import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { InpostService } from './inpost.service';

// --- NOWA DEFINICJA DTO DLA ADRESU ---
class ShippingAddressDto {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    phoneNumber?: string;
}

// --- ZAKTUALIZOWANE DTO DLA PŁATNOŚCI ---
class CreateCheckoutDto {
    items: { priceId: string, quantity: number }[];
    platform: 'web' | 'mobile';
    couponCode?: string;
    customerEmail?: string;
    shippingMethodId: string;
    shippingAddress: ShippingAddressDto; // <-- DODANE POLE
    inpostLocker?: {
        id: string;
        name?: string;
        address?: string;
        postcode?: string;
        city?: string;
        raw?: unknown;
    };
}

type InpostDataPayload = {
    trackingNumber?: string;
    shipmentId?: string | number;
    shipment_response?: unknown;
    selected_point?: unknown;
    businessDeliveryStatus?: string;
    inpostShipmentStatus?: string;
};

type ShippingIntegrationType = 'NONE' | 'INPOST_LOCKER' | 'INPOST_COURIER';

@Injectable()
export class StoreService {
    private stripe: Stripe;
    private organizationServicesCache: { services: string[]; expiresAt: number } | null = null;

    constructor(
        private prisma: PrismaService,
        private inpostService: InpostService,
    ) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new InternalServerErrorException('Stripe secret key is not configured.');
        }
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-07-30.basil', // Używam stabilnej wersji API
        });
    }
    async getAvailableProducts(
        searchTerm?: string,
        sortBy: 'price' | 'name' = 'name',
        sortOrder: 'asc' | 'desc' = 'asc'
    ) {
        const where: Prisma.productsWhereInput = {
            is_active: true,
        };

        if (searchTerm) {
            where.name = { contains: searchTerm, mode: 'insensitive' };
        }

        return this.prisma.products.findMany({
            where,
            include: {
                product_variants: {
                    where: {
                        is_deleted: false,
                    },
                    orderBy: { quantity: 'asc' },
                },
            },
            orderBy: { [sortBy]: sortOrder },
        });
    }

    async createSubscriptionCheckoutSession(userId: string, platform: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) {
            throw new NotFoundException('Użytkownik nie został znaleziony.');
        }
        const successUrl = platform === 'mobile'
            ? `zozoapp://payment-complete?status=success`
            : `${process.env.FRONTEND_URL}/panel?payment=success`;

        const cancelUrl = platform === 'mobile'
            ? `zozoapp://payment-complete?status=cancel`
            : `${process.env.FRONTEND_URL}/panel`;
        try {
            const session = await this.stripe.checkout.sessions.create({
                ui_mode: 'hosted',
                payment_method_collection: 'if_required',
                mode: 'subscription',
                client_reference_id: userId,
                customer_email: user.email,
                line_items: [{
                    price: 'price_1S1Ci143I93q19tr6Stycejq',
                    quantity: 1,
                }],
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
            return session;
        } catch (error) {
            console.error("Błąd z API Stripe:", error.message);
            throw new InternalServerErrorException(`Błąd Stripe: ${error.message}`);
        }
    }

    async validatePromoCode(code: string) {
        try {
            const promotionCodes = await this.stripe.promotionCodes.list({
                code: code,
                active: true,
                limit: 1,
            });

            if (promotionCodes.data.length === 0) {
                throw new BadRequestException('Kod rabatowy jest nieprawidłowy lub wygasł.');
            }

            const promoCode = promotionCodes.data[0];
            const coupon = await this.stripe.coupons.retrieve(promoCode.coupon.id);

            return {
                code: promoCode.code,
                discount: {
                    type: coupon.percent_off ? 'PERCENTAGE' : 'FIXED_AMOUNT',
                    value: coupon.percent_off || coupon.amount_off,
                },
            };
        } catch (error) {
            throw new BadRequestException('Kod rabatowy jest nieprawidłowy lub wygasł.');
        }
    }

    async getActiveShippingMethods() {
        return this.prisma.shipping_methods.findMany({
            where: { is_active: true },
            select: { id: true, name: true, price: true, is_active: true, integration_type: true },
            orderBy: { price: 'asc' },
        });
    }


    async createOneTimePaymentCheckoutSession(userId: string | null, checkoutDto: CreateCheckoutDto) {
        const { items, platform, couponCode, shippingMethodId, shippingAddress, customerEmail, inpostLocker } = checkoutDto;
        const normalizedCustomerEmail = customerEmail?.trim().toLowerCase();

        if (!userId) {
            if (!normalizedCustomerEmail) {
                throw new BadRequestException('Adres e-mail jest wymagany dla zakupów bez logowania.');
            }
            if (!this.isValidEmail(normalizedCustomerEmail)) {
                throw new BadRequestException('Podano nieprawidłowy adres e-mail.');
            }
        }

        const user = userId
            ? await this.prisma.users.findUnique({ where: { id: userId } })
            : await this.createGuestUser(shippingAddress, normalizedCustomerEmail as string);

        if (!user) {
            throw new NotFoundException('Nie udało się przygotować danych użytkownika do zamówienia.');
        }

        const shippingMethod = await this.prisma.shipping_methods.findUnique({
            where: { id: shippingMethodId, is_active: true }
        });
        if (!shippingMethod) {
            throw new BadRequestException('Wybrana metoda dostawy jest nieprawidłowa.');
        }
        const requiresInpostLocker = this.isInpostLockerShipping(shippingMethod.integration_type, shippingMethod.name);
        if (requiresInpostLocker && !inpostLocker?.id) {
            throw new BadRequestException('Dla dostawy do paczkomatu wybierz punkt odbioru.');
        }

        const priceIds = items.map(item => item.priceId);
        const variantsInDb = await this.prisma.product_variants.findMany({
            where: { stripe_price_id: { in: priceIds } },
            select: { id: true, stripe_price_id: true, price: true }
        });
        const subtotal = variantsInDb.reduce((acc, variant) => {
            const item = items.find(i => i.priceId === variant.stripe_price_id);
            return acc + (variant.price * (item?.quantity || 1));
        }, 0);

        let discountAmount = 0;
        let promotionCodeId: string | null = null;
        if (couponCode) {
            const promotionCodes = await this.stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
            if (promotionCodes.data.length > 0) {
                promotionCodeId = promotionCodes.data[0].id;
                const coupon = await this.stripe.coupons.retrieve(promotionCodes.data[0].coupon.id);
                if (coupon.percent_off) {
                    discountAmount = (subtotal * coupon.percent_off) / 100;
                } else if (coupon.amount_off) {
                    discountAmount = coupon.amount_off;
                }
            }
        }
        const totalAmount = subtotal - discountAmount + shippingMethod.price;

        const line_items = items.map(item => ({ price: item.priceId, quantity: item.quantity }));
        const publicOrderAccessToken = !userId ? randomBytes(24).toString('hex') : null;
        const webSuccessPath = userId ? '/panel/zamowienie/{CHECKOUT_SESSION_ID}' : '/zamowienie/{CHECKOUT_SESSION_ID}';
        const webCancelPath = userId ? '/panel/koszyk?status=cancel' : '/koszyk?status=cancel';
        const mobileSuccessPath = userId ? 'zozoapp://panel/zamowienie/{CHECKOUT_SESSION_ID}' : 'zozoapp://zamowienie/{CHECKOUT_SESSION_ID}';
        const mobileCancelPath = userId ? 'zozoapp://panel/koszyk?status=cancel' : 'zozoapp://koszyk?status=cancel';
        const successUrlSuffix = publicOrderAccessToken ? `?token=${publicOrderAccessToken}` : '';
        const successUrl = platform === 'mobile'
            ? `${mobileSuccessPath}${successUrlSuffix}`
            : `${process.env.FRONTEND_URL}${webSuccessPath}${successUrlSuffix}`;
        const cancelUrl = platform === 'mobile' ? mobileCancelPath : `${process.env.FRONTEND_URL}${webCancelPath}`;

        const sessionPayload: Stripe.Checkout.SessionCreateParams = {
            ui_mode: 'hosted',
            mode: 'payment',
            client_reference_id: user.id,
            customer_email: user.email,
            line_items,
            shipping_options: [{ shipping_rate: shippingMethod.stripe_shipping_rate_id ?? undefined }],
            success_url: successUrl,
            cancel_url: cancelUrl,
        };
        if (promotionCodeId) {
            sessionPayload.discounts = [{ promotion_code: promotionCodeId }];
        }
        const session = await this.stripe.checkout.sessions.create(sessionPayload);

        const newAddress = await this.prisma.shipping_addresses.create({
            data: {
                first_name: shippingAddress.firstName,
                last_name: shippingAddress.lastName,
                street: shippingAddress.street,
                city: shippingAddress.city,
                postal_code: shippingAddress.postalCode,
                phone_number: shippingAddress.phoneNumber,
                inpost_locker_id: inpostLocker?.id,
                inpost_locker_name: inpostLocker?.name,
                inpost_locker_address: inpostLocker?.address,
                inpost_locker_postcode: inpostLocker?.postcode,
                inpost_locker_city: inpostLocker?.city,
            }
        });

        const newOrder = await this.prisma.orders.create({
            data: {
                user_id: user.id,
                shipping_address_id: newAddress.id,
                shipping_method_id: shippingMethodId,
                status: 'PENDING',
                total: totalAmount,
                stripe_customer_id: user.stripe_customer_id,
                stripe_checkout_id: session.id,
                stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                total_amount: totalAmount,
                inpost_locker_name: inpostLocker?.name,
                inpost_locker_address: inpostLocker?.address,
                inpost_locker_data: this.toPrismaJsonValue({
                    ...(publicOrderAccessToken ? { public_access_token: publicOrderAccessToken } : {}),
                    ...(inpostLocker ? { selected_point: inpostLocker } : {}),
                }),
            }
        });

        const orderItemsData = items.map(item => {
            const variant = variantsInDb.find(v => v.stripe_price_id === item.priceId);
            if (!variant) {
                throw new InternalServerErrorException(`Wariant produktu dla priceId ${item.priceId} nie został znaleziony.`);
            }
            return {
                order_id: newOrder.id,
                product_variant_id: variant.id,
                quantity: item.quantity,
                price: variant.price,
            };
        });

        await this.prisma.order_items.createMany({
            data: orderItemsData,
        });

        return { url: session.url };
    }

    async getAndUpdateOrderBySessionId(sessionId: string, userId?: string, accessToken?: string) {
        if (!userId && !accessToken) {
            throw new BadRequestException('Brak tokenu dostępu do zamówienia.');
        }

        const order = await this.prisma.orders.findFirst({
            where: {
                stripe_checkout_id: sessionId,
                ...(userId ? { user_id: userId } : {}),
            },
            include: {
                users: !!userId,
                order_items: {
                    include: {
                        product_variants: { include: { products: true } },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Nie znaleziono zamówienia dla podanej sesji.');
        }

        if (!userId) {
            const storedToken = this.getOrderAccessToken(order.inpost_locker_data);
            if (!storedToken || storedToken !== accessToken) {
                throw new NotFoundException('Nie znaleziono zamówienia dla podanej sesji.');
            }
        }

        if (order.status === 'COMPLETED') {
            return order;
        }

        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const updatedOrderData = await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    status: 'COMPLETED',
                    total: session.amount_total ?? order.total,
                    total_amount: session.amount_total ?? order.total_amount,
                    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                }
            });

            const finalOrder = {
                ...order, // Zawiera `order_items` i `users` z pierwszego zapytania
                ...updatedOrderData, // Nadpisuje `status`, `total` etc. nowymi danymi
            };

            return finalOrder;
        }

        return order;
    }

    private async createGuestUser(shippingAddress: ShippingAddressDto, email: string) {
        const existingUser = await this.prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return existingUser;
        }

        const randomToken = Math.random().toString(36).slice(2, 10);
        const passwordHash = await bcrypt.hash(`${Date.now()}-${randomToken}`, 10);

        return this.prisma.users.create({
            data: {
                email,
                password_hash: passwordHash,
                first_name: shippingAddress.firstName,
                last_name: shippingAddress.lastName,
                role: 'USER',
                account_status: 'TRIAL',
                phone: shippingAddress.phoneNumber,
            },
        });
    }

    private isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private getOrderAccessToken(data: unknown): string | null {
        if (!data || typeof data !== 'object') {
            return null;
        }
        const payload = data as Record<string, unknown>;
        return typeof payload.public_access_token === 'string' ? payload.public_access_token : null;
    }

    private getInpostPayload(data: unknown): InpostDataPayload | null {
        if (!data || typeof data !== 'object') {
            return null;
        }
        return data as InpostDataPayload;
    }

    private extractTrackingNumber(response: unknown): string | undefined {
        if (!response || typeof response !== 'object') {
            return undefined;
        }
        const payload = response as Record<string, unknown>;
        if (typeof payload.trackingNumber === 'string') {
            return payload.trackingNumber;
        }
        if (typeof payload.tracking_number === 'string') {
            return payload.tracking_number;
        }
        return undefined;
    }

    private extractShipmentId(response: unknown): string | undefined {
        if (!response || typeof response !== 'object') {
            return undefined;
        }
        const payload = response as Record<string, unknown>;
        const directId = payload.id;
        if (typeof directId === 'number' || typeof directId === 'string') {
            return String(directId);
        }
        return undefined;
    }

    private extractShipmentStatus(response: unknown): string | undefined {
        if (!response || typeof response !== 'object') {
            return undefined;
        }
        const payload = response as Record<string, unknown>;
        const directStatus = payload.status;
        if (typeof directStatus === 'string') {
            return directStatus;
        }
        const shipment = payload.shipment;
        if (shipment && typeof shipment === 'object' && typeof (shipment as Record<string, unknown>).status === 'string') {
            return (shipment as Record<string, unknown>).status as string;
        }
        return undefined;
    }

    private mapInpostStatusToBusinessStatus(status?: string) {
        const normalized = (status ?? '').toUpperCase();
        if (!normalized) return 'UNKNOWN';
        if (['CREATED', 'REGISTERED'].includes(normalized)) return 'CREATED';
        if (['PICKED_UP', 'IN_TRANSIT', 'ADOPTED_AT_SOURCE_BRANCH', 'SENT_FROM_SOURCE_BRANCH'].includes(normalized)) return 'IN_TRANSIT';
        if (['READY_TO_PICKUP', 'READY_TO_COLLECT'].includes(normalized)) return 'READY_FOR_PICKUP';
        if (['DELIVERED', 'COLLECTED'].includes(normalized)) return 'DELIVERED';
        if (['RETURNED_TO_SENDER', 'RETURNED'].includes(normalized)) return 'RETURNED';
        if (['CANCELED', 'CANCELLED', 'ERROR', 'UNDELIVERED', 'LOST', 'DAMAGED'].includes(normalized)) return 'EXCEPTION';
        return 'UNKNOWN';
    }

    private async getAllowedShipxServices(organizationId: string) {
        if (this.organizationServicesCache && Date.now() < this.organizationServicesCache.expiresAt) {
            return this.organizationServicesCache.services;
        }
        const organization = await this.inpostService.getOrganization(organizationId);
        const services = Array.isArray(organization?.services) ? organization.services : [];
        this.organizationServicesCache = {
            services,
            expiresAt: Date.now() + 10 * 60 * 1000,
        };
        return services;
    }

    private buildShipxShipmentPayload(order: any) {
        const isLockerDelivery = this.isInpostLockerShipping(order.shipping_methods?.integration_type, order.shipping_methods?.name);
        const service = isLockerDelivery ? 'inpost_locker_standard' : 'inpost_courier_standard';
        const receiverAddress = {
            street: order.shipping_addresses?.street,
            building_number: '1',
            city: order.shipping_addresses?.city,
            post_code: order.shipping_addresses?.postal_code,
            country_code: 'PL',
        };

        return {
            reference: order.id,
            service,
            receiver: {
                first_name: order.shipping_addresses?.first_name ?? order.users?.first_name ?? 'Klient',
                last_name: order.shipping_addresses?.last_name ?? order.users?.last_name ?? 'Zozo',
                email: order.users?.email,
                phone: order.shipping_addresses?.phone_number ?? order.users?.phone ?? '',
                address: receiverAddress,
            },
            sender: {
                company_name: process.env.INPOST_SENDER_COMPANY_NAME,
                first_name: process.env.INPOST_SENDER_FIRST_NAME,
                last_name: process.env.INPOST_SENDER_LAST_NAME,
                email: process.env.INPOST_SENDER_EMAIL,
                phone: process.env.INPOST_SENDER_PHONE,
                address: {
                    street: process.env.INPOST_SENDER_STREET,
                    building_number: process.env.INPOST_SENDER_BUILDING_NUMBER,
                    city: process.env.INPOST_SENDER_CITY,
                    post_code: process.env.INPOST_SENDER_POSTCODE,
                    country_code: process.env.INPOST_SENDER_COUNTRY_CODE ?? 'PL',
                },
            },
            parcels: [
                {
                    template: process.env.INPOST_DEFAULT_TEMPLATE ?? 'small',
                },
            ],
            custom_attributes: isLockerDelivery
                ? {
                    target_point: order.shipping_addresses?.inpost_locker_id,
                }
                : {},
        };
    }

    private async getOrderForInpostActions(orderId: string) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                users: true,
                shipping_addresses: true,
                shipping_methods: true,
            },
        });
        if (!order) {
            throw new NotFoundException('Nie znaleziono zamówienia.');
        }
        return order;
    }

    private async updateInpostData(orderId: string, data: Record<string, unknown>, existingData?: unknown) {
        const merged = {
            ...(existingData && typeof existingData === 'object' ? existingData as object : {}),
            ...data,
        };
        await this.prisma.orders.update({
            where: { id: orderId },
            data: {
                inpost_locker_data: this.toPrismaJsonValue(merged),
            },
        });
        return merged;
    }

    private toPrismaJsonValue(value: unknown): Prisma.InputJsonValue {
        return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
    }

    async createCustomerPortalSession(userId: string) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });

        if (!user || !user.stripe_customer_id) {
            throw new NotFoundException('Nie znaleziono danych subskrypcji dla tego użytkownika.');
        }

        const portalSession = await this.stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/panel/ustawienia/subskrypcja`,
        });
        return portalSession;
    }

    async getOrders() {
        // Używamy rozbudowanego zapytania SQL, aby dołączyć listę produktów do każdego zamówienia.
        const orders = await this.prisma.$queryRaw`
            SELECT
                o.id,
                o.status,
                o.total,
                o.created_at,
                u.email as "userEmail",
                sa.first_name as "firstName",
                sa.last_name as "lastName",
                sa.street,
                sa.city,
                sa.postal_code as "postalCode",
                sa.phone_number as "phoneNumber",
                sm.name as "shippingMethodName",
                sm.price as "shippingMethodPrice",
                sa.inpost_locker_id as "inpostLockerId",
                sa.inpost_locker_name as "inpostLockerName",
                sa.inpost_locker_address as "inpostLockerAddress",
                o.inpost_locker_data as "inpostData",
                (
                    SELECT json_agg(json_build_object(
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'name', p.name
                                    ))
                    FROM "order_items" oi
                             JOIN "product_variants" pv ON oi.product_variant_id = pv.id
                             JOIN "products" p ON pv.product_id = p.id
                    WHERE oi.order_id = o.id
                ) as "orderItems"
            FROM "orders" o
                     JOIN "users" u ON o.user_id = u.id
                     LEFT JOIN "shipping_addresses" sa ON o.shipping_address_id = sa.id
                     LEFT JOIN "shipping_methods" sm ON o.shipping_method_id = sm.id
            GROUP BY o.id, u.email, sa.id, sm.id
            ORDER BY o.created_at DESC;
        `;
        return orders;
    }

    async getInpostPoints(query: Record<string, string | undefined>) {
        return this.inpostService.getPoints(query);
    }

    async getInpostShipmentForOrder(orderId: string) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            select: { id: true, inpost_locker_data: true },
        });
        if (!order) {
            throw new NotFoundException('Nie znaleziono zamówienia.');
        }

        const payload = this.getInpostPayload(order.inpost_locker_data);
        const shipmentId = payload?.shipmentId ? String(payload.shipmentId) : undefined;
        if (!shipmentId) {
            throw new BadRequestException('Brak identyfikatora przesyłki ShipX dla tego zamówienia.');
        }

        return this.inpostService.getShipmentById(shipmentId);
    }

    async getInpostLabelForOrder(orderId: string, acceptHeader?: string) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            select: { id: true, inpost_locker_data: true },
        });
        if (!order) {
            throw new NotFoundException('Nie znaleziono zamówienia.');
        }

        const payload = this.getInpostPayload(order.inpost_locker_data);
        const shipmentId = payload?.shipmentId ? String(payload.shipmentId) : undefined;
        if (!shipmentId) {
            throw new BadRequestException('Brak identyfikatora przesyłki ShipX dla tego zamówienia.');
        }

        const labelType = acceptHeader?.toUpperCase() === 'A4' ? 'normal' : 'A6';

        return this.inpostService.getShipmentLabel(
            shipmentId,
            'Pdf',
            labelType,
        );
    }

    async createInpostShipmentForOrder(orderId: string) {
        const order = await this.getOrderForInpostActions(orderId);
        if (!this.isInpostShipping(order.shipping_methods?.integration_type, order.shipping_methods?.name)) {
            throw new BadRequestException('To zamówienie nie używa dostawy InPost.');
        }

        const isLockerDelivery = this.isInpostLockerShipping(order.shipping_methods?.integration_type, order.shipping_methods?.name);
        if (isLockerDelivery && !order.shipping_addresses?.inpost_locker_id) {
            throw new BadRequestException('Brak wybranego paczkomatu dla zamówienia.');
        }

        const organizationId = process.env.INPOST_ORGANIZATION_ID;
        if (!organizationId) {
            throw new InternalServerErrorException('Brak konfiguracji INPOST_ORGANIZATION_ID.');
        }

        const payload = this.buildShipxShipmentPayload(order);

        const requestedService = payload.service;
        const allowedServices = await this.getAllowedShipxServices(organizationId);
        if (!allowedServices.includes(requestedService)) {
            throw new BadRequestException(`Serwis ${requestedService} nie jest dostępny dla tej organizacji ShipX.`);
        }

        const response = await this.inpostService.createShipment(organizationId, payload);
        const trackingNumber = this.extractTrackingNumber(response);
        const shipmentId = this.extractShipmentId(response);
        const status = this.extractShipmentStatus(response);
        const businessStatus = this.mapInpostStatusToBusinessStatus(status);

        const inpostData = await this.updateInpostData(order.id, {
            shipment_request: payload,
            shipment_response: response,
            shipmentId: shipmentId ?? null,
            trackingNumber: trackingNumber ?? null,
            inpostShipmentStatus: status ?? null,
            businessDeliveryStatus: businessStatus,
            shipmentCreatedAt: new Date().toISOString(),
        }, order.inpost_locker_data);

        return {
            shipmentId: shipmentId ?? null,
            trackingNumber: trackingNumber ?? null,
            inpostShipmentStatus: status ?? null,
            businessDeliveryStatus: businessStatus,
            inpostData,
        };
    }

    async syncInpostStatusForOrder(orderId: string) {
        const order = await this.getOrderForInpostActions(orderId);
        const payload = this.getInpostPayload(order.inpost_locker_data);
        const shipmentId = payload?.shipmentId ? String(payload.shipmentId) : undefined;
        const trackingNumber = payload?.trackingNumber;
        if (!shipmentId) {
            throw new BadRequestException('Brak identyfikatora przesyłki ShipX dla tego zamówienia.');
        }

        const shipment = await this.inpostService.getShipmentById(shipmentId);
        let status = this.extractShipmentStatus(shipment);
        let trackingPayload: unknown = null;
        if ((!status || status === 'unknown') && trackingNumber) {
            try {
                trackingPayload = await this.inpostService.getTrackingByNumber(trackingNumber);
                const trackingStatus = (trackingPayload as Record<string, unknown>)?.status;
                if (typeof trackingStatus === 'string') {
                    status = trackingStatus;
                }
            } catch {
                // fallback best-effort: keep status from shipment resource
            }
        }
        const businessStatus = this.mapInpostStatusToBusinessStatus(status);

        const inpostData = await this.updateInpostData(order.id, {
            shipment_response: shipment,
            tracking_response: trackingPayload,
            inpostShipmentStatus: status ?? null,
            businessDeliveryStatus: businessStatus,
            statusSyncedAt: new Date().toISOString(),
        }, order.inpost_locker_data);

        return {
            shipmentId,
            trackingNumber,
            inpostShipmentStatus: status ?? null,
            businessDeliveryStatus: businessStatus,
            inpostData,
        };
    }

    async createDispatchOrderForOrder(orderId: string) {
        const order = await this.getOrderForInpostActions(orderId);
        const payload = this.getInpostPayload(order.inpost_locker_data);
        const shipmentId = payload?.shipmentId ? String(payload.shipmentId) : undefined;
        if (!shipmentId) {
            throw new BadRequestException('Najpierw utwórz przesyłkę ShipX.');
        }

        const organizationId = process.env.INPOST_ORGANIZATION_ID;
        if (!organizationId) {
            throw new InternalServerErrorException('Brak konfiguracji INPOST_ORGANIZATION_ID.');
        }

        const dispatchPayload = {
            shipments: [shipmentId],
            name: `${order.shipping_addresses?.first_name ?? ''} ${order.shipping_addresses?.last_name ?? ''}`.trim() || 'Odbior paczek',
            phone: order.shipping_addresses?.phone_number ?? order.users?.phone ?? process.env.INPOST_SENDER_PHONE ?? '',
            email: order.users?.email ?? process.env.INPOST_SENDER_EMAIL ?? undefined,
            address: {
                street: process.env.INPOST_SENDER_STREET,
                building_number: process.env.INPOST_SENDER_BUILDING_NUMBER,
                city: process.env.INPOST_SENDER_CITY,
                post_code: process.env.INPOST_SENDER_POSTCODE,
                country_code: process.env.INPOST_SENDER_COUNTRY_CODE ?? 'PL',
            },
            comment: `Automatyczne zlecenie odbioru dla zamówienia ${order.id}`,
        };

        const dispatchOrder = await this.inpostService.createDispatchOrder(organizationId, dispatchPayload);
        const inpostData = await this.updateInpostData(order.id, {
            dispatch_order: dispatchOrder,
            dispatch_order_created_at: new Date().toISOString(),
        }, order.inpost_locker_data);

        return { dispatchOrder, inpostData };
    }

    private isInpostShipping(integrationType?: ShippingIntegrationType | null, fallbackName?: string | null) {
        if (integrationType && integrationType !== 'NONE') {
            return integrationType === 'INPOST_LOCKER' || integrationType === 'INPOST_COURIER';
        }
        const methodName = (fallbackName ?? '').toLowerCase();
        return methodName.includes('inpost');
    }

    private isInpostLockerShipping(integrationType?: ShippingIntegrationType | null, fallbackName?: string | null) {
        if (integrationType && integrationType !== 'NONE') {
            return integrationType === 'INPOST_LOCKER';
        }
        const methodName = (fallbackName ?? '').toLowerCase();
        return methodName.includes('paczkomat');
    }
}
