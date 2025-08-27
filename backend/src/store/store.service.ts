import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

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
    shippingMethodId: string;
    shippingAddress: ShippingAddressDto; // <-- DODANE POLE
}

@Injectable()
export class StoreService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService, private mailService: MailService) {
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
                    price: 'price_1RwJhZLpI3RKz2R39q16HoQU',
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
            select: { id: true, name: true, price: true, is_active: true },
            orderBy: { price: 'asc' },
        });
    }


    async createOneTimePaymentCheckoutSession(userId: string, checkoutDto: CreateCheckoutDto) {
        const { items, platform, couponCode, shippingMethodId, shippingAddress } = checkoutDto;

        // Krok 1: Walidacja i przygotowanie danych (bez zmian)
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.stripe_customer_id) {
            throw new NotFoundException('Użytkownik lub jego dane płatności nie zostały znalezione.');
        }

        const shippingMethod = await this.prisma.shipping_methods.findUnique({
            where: { id: shippingMethodId, is_active: true }
        });
        if (!shippingMethod) {
            throw new BadRequestException('Wybrana metoda dostawy jest nieprawidłowa.');
        }

        const priceIds = items.map(item => item.priceId);
        const variantsInDb = await this.prisma.product_variants.findMany({
            where: { stripe_price_id: { in: priceIds } },
            select: { id: true, stripe_price_id: true, price: true }
        });

        // Krok 2: Obliczenie finalnej kwoty zamówienia
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

        // Krok 3: Utworzenie sesji płatności w Stripe
        const line_items = items.map(item => ({ price: item.priceId, quantity: item.quantity }));
        const successUrl = platform === 'mobile'
            ? `zozoapp://payment-complete?status=success&session_id={CHECKOUT_SESSION_ID}`
            : `${process.env.FRONTEND_URL}/panel/zamowienie/{CHECKOUT_SESSION_ID}`;
        const cancelUrl = platform === 'mobile'
            ? `zozoapp://payment-complete?status=cancel`
            : `${process.env.FRONTEND_URL}/panel/koszyk?status=cancel`;

        const sessionPayload: Stripe.Checkout.SessionCreateParams = {
            ui_mode: 'hosted',
            mode: 'payment',
            client_reference_id: userId,
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
            }
        });

        const newOrder = await this.prisma.orders.create({
            data: {
                user_id: userId,
                shipping_address_id: newAddress.id,
                shipping_method_id: shippingMethodId, // Zapisujemy ID metody dostawy
                status: 'PENDING',
                total: totalAmount,
                stripe_customer_id: user.stripe_customer_id,
                stripe_checkout_id: session.id,
                stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                total_amount: totalAmount,
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

    async getAndUpdateOrderBySessionId(sessionId: string, userId: string) {
        const order = await this.prisma.orders.findFirst({
            where: {
                stripe_checkout_id: sessionId,
                user_id: userId,
            },
            include: {
                users: true,
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

            if (finalOrder.users?.email) {
                await this.mailService.sendOrderConfirmationEmail(finalOrder.users.email, finalOrder);
            }

            return finalOrder;
        }

        return order;
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
}
