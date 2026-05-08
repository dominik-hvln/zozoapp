import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { EventsGateway } from 'src/events/events.gateway';
import { MailService } from 'src/mail/mail.service';
import { InpostService } from 'src/store/inpost.service';

type ShippingIntegrationType = 'NONE' | 'INPOST_LOCKER' | 'INPOST_COURIER';

@Injectable()
export class WebhooksService {
    private stripe: Stripe;
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private mailService: MailService,
        private inpostService: InpostService,
    ) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new InternalServerErrorException('Stripe secret key is not configured.');
        }
        this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });
    }

    async handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
        if (session.mode === 'subscription') {
            await this.handleSubscriptionUpdate(session);
        } else if (session.mode === 'payment') {
            await this.handleOneTimePayment(session);
        }
    }

    async handleInpostShipxWebhook(payload: any) {
        const eventType = payload?.event;
        if (!eventType || !payload?.payload) {
            return;
        }

        const shipmentId = payload.payload.shipment_id ? String(payload.payload.shipment_id) : undefined;
        const trackingNumber = payload.payload.tracking_number;
        const shipmentStatus = payload.payload.status;

        if (!shipmentId && !trackingNumber) {
            return;
        }

        const whereByShipment = shipmentId
            ? { path: ['shipmentId'], equals: shipmentId }
            : undefined;
        const whereByTracking = trackingNumber
            ? { path: ['trackingNumber'], equals: trackingNumber }
            : undefined;

        const order = await this.prisma.orders.findFirst({
            where: {
                OR: [
                    ...(whereByShipment ? [{ inpost_locker_data: whereByShipment }] : []),
                    ...(whereByTracking ? [{ inpost_locker_data: whereByTracking }] : []),
                ],
            },
            select: {
                id: true,
                inpost_locker_data: true,
            },
        });

        if (!order) {
            return;
        }

        const businessDeliveryStatus = this.mapShipxEventToBusinessStatus(eventType, shipmentStatus);
        const existingData = order.inpost_locker_data && typeof order.inpost_locker_data === 'object'
            ? order.inpost_locker_data as object
            : {};

        await this.prisma.orders.update({
            where: { id: order.id },
            data: {
                inpost_locker_data: {
                    ...existingData,
                    webhookLastEvent: eventType,
                    webhookLastStatus: shipmentStatus ?? null,
                    trackingNumber: trackingNumber ?? null,
                    shipmentId: shipmentId ?? null,
                    businessDeliveryStatus,
                    webhookUpdatedAt: new Date().toISOString(),
                },
            },
        });
    }

    private async handleSubscriptionUpdate(session: Stripe.Checkout.Session) {
        console.log('[WEBHOOK] Rozpoczynam obsługę subskrypcji...');
        const userId = session.client_reference_id;
        const stripeCustomerObject = session.customer;
        const stripeCustomerId = typeof stripeCustomerObject === 'string'
            ? stripeCustomerObject
            : stripeCustomerObject?.id;

        if (!userId || !stripeCustomerId) {
            console.error('[WEBHOOK BŁĄD] Brak danych w sesji subskrypcji!', { sessionId: session.id });
            return;
        }

        const subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 31);

        try {
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    account_status: 'ACTIVE',
                    trial_expires_at: subscriptionExpiresAt,
                    stripe_customer_id: stripeCustomerId,
                },
            });
            this.eventsGateway.sendToUser(userId, 'accountStatusChanged', { status: 'ACTIVE' });
            console.log(`[WEBHOOK] Subskrypcja aktywowana dla użytkownika: ${userId}`);
        } catch (error) {
            console.error(`[WEBHOOK BŁĄD KRYTYCZNY] Błąd podczas aktualizacji użytkownika po subskrypcji:`, error);
            throw error;
        }
    }

    private async handleOneTimePayment(session: Stripe.Checkout.Session) {
        console.log(`[WEBHOOK] Rozpoczynam obsługę płatności jednorazowej dla sesji: ${session.id}`);
        if (!session.amount_total) {
            console.error('[WEBHOOK BŁĄD] Brak kluczowych danych w sesji płatności!');
            return;
        }

        const existingOrder = await this.prisma.orders.findUnique({
            where: { stripe_checkout_id: session.id },
        });

        if (!existingOrder) {
            console.error(`[WEBHOOK BŁĄD] Brak lokalnego zamówienia dla sesji ${session.id}.`);
            return;
        }

        if (existingOrder.status === 'COMPLETED') {
            console.log(`[WEBHOOK] Zamówienie ${existingOrder.id} jest już zakończone. Pomijam.`);
            return;
        }

        try {
            const updatedOrder = await this.prisma.orders.update({
                where: { id: existingOrder.id },
                data: {
                    status: 'COMPLETED',
                    total: session.amount_total,
                    total_amount: session.amount_total,
                    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                },
            });

            const fullOrderDetails = await this.prisma.orders.findUnique({
                where: { id: updatedOrder.id },
                include: {
                    users: true,
                    shipping_addresses: true,
                    shipping_methods: true,
                    order_items: { include: { product_variants: { include: { products: true } } } },
                },
            });

            if (fullOrderDetails) {
                await this.tryCreateInpostShipment(fullOrderDetails);
            }

            if (fullOrderDetails?.users?.email) {
                await this.mailService.sendOrderConfirmationEmail(fullOrderDetails.users.email, fullOrderDetails);
            }
        } catch (error) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Nie udało się przetworzyć zamówienia:', error);
            throw error;
        }
    }

    private async tryCreateInpostShipment(order: any) {
        if (!this.isInpostShipping(order.shipping_methods?.integration_type, order.shipping_methods?.name)) {
            return;
        }

        const organizationId = process.env.INPOST_ORGANIZATION_ID;
        if (!organizationId) {
            console.error('[WEBHOOK][INPOST] Brak INPOST_ORGANIZATION_ID. Pomijam tworzenie przesyłki.');
            return;
        }

        const lockerId = order.shipping_addresses?.inpost_locker_id ?? undefined;
        const isLockerDelivery = this.isInpostLockerShipping(order.shipping_methods?.integration_type, order.shipping_methods?.name);
        const normalizedTargetPoint = this.normalizeShipxTargetPoint(lockerId);
        const senderPhone = this.normalizeShipxPhone(process.env.INPOST_SENDER_PHONE);
        const receiverPhone = this.normalizeShipxPhone(order.shipping_addresses?.phone_number ?? order.users?.phone ?? '');
        if (isLockerDelivery && !lockerId) {
            await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    inpost_locker_data: {
                        ...(order.inpost_locker_data && typeof order.inpost_locker_data === 'object' ? order.inpost_locker_data as object : {}),
                        shipment_error: 'Brak identyfikatora paczkomatu dla zamówienia InPost.',
                        shipment_error_at: new Date().toISOString(),
                    },
                },
            });
            return;
        }
        if (!senderPhone) {
            await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    inpost_locker_data: {
                        ...(order.inpost_locker_data && typeof order.inpost_locker_data === 'object' ? order.inpost_locker_data as object : {}),
                        shipment_error: 'Nieprawidłowy INPOST_SENDER_PHONE (wymagane 9 cyfr PL).',
                        shipment_error_at: new Date().toISOString(),
                    },
                },
            });
            return;
        }
        if (isLockerDelivery && !normalizedTargetPoint) {
            await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    inpost_locker_data: {
                        ...(order.inpost_locker_data && typeof order.inpost_locker_data === 'object' ? order.inpost_locker_data as object : {}),
                        shipment_error: 'Nieprawidłowy identyfikator paczkomatu (target_point).',
                        shipment_error_at: new Date().toISOString(),
                    },
                },
            });
            return;
        }

        const payload = {
            reference: order.id,
            service: isLockerDelivery ? 'inpost_locker_standard' : 'inpost_courier_standard',
            receiver: {
                first_name: order.shipping_addresses?.first_name ?? order.users?.first_name ?? 'Klient',
                last_name: order.shipping_addresses?.last_name ?? order.users?.last_name ?? 'Zozo',
                email: order.users?.email,
                phone: receiverPhone ?? senderPhone,
                address: {
                    street: order.shipping_addresses?.street,
                    building_number: '1',
                    city: order.shipping_addresses?.city,
                    post_code: order.shipping_addresses?.postal_code,
                    country_code: 'PL',
                },
            },
            sender: {
                company_name: process.env.INPOST_SENDER_COMPANY_NAME,
                first_name: process.env.INPOST_SENDER_FIRST_NAME,
                last_name: process.env.INPOST_SENDER_LAST_NAME,
                email: process.env.INPOST_SENDER_EMAIL,
                phone: senderPhone,
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
            custom_attributes: isLockerDelivery ? { target_point: normalizedTargetPoint } : {},
        };

        try {
            const response = await this.inpostService.createShipment(organizationId, payload);
            const trackingNumber = this.extractTrackingNumber(response);
            const shipmentId = this.extractShipmentId(response);

            await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    inpost_locker_data: {
                        ...(order.inpost_locker_data && typeof order.inpost_locker_data === 'object' ? order.inpost_locker_data as object : {}),
                        shipment_request: payload,
                        shipment_response: response,
                        shipmentId: shipmentId ?? null,
                        trackingNumber: trackingNumber ?? null,
                        shipmentCreatedAt: new Date().toISOString(),
                    },
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Nieznany błąd';
            console.error('[WEBHOOK][INPOST] Nie udało się utworzyć przesyłki:', message);
            await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    inpost_locker_data: {
                        ...(order.inpost_locker_data && typeof order.inpost_locker_data === 'object' ? order.inpost_locker_data as object : {}),
                        shipment_error: message,
                        shipment_error_at: new Date().toISOString(),
                    },
                },
            });
        }
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
        if (typeof payload.id === 'number' || typeof payload.id === 'string') {
            return String(payload.id);
        }
        return undefined;
    }

    private mapShipxEventToBusinessStatus(eventType: string, shipxStatus?: string) {
        const normalizedStatus = (shipxStatus ?? '').toLowerCase();
        if (eventType === 'shipment_confirmed') {
            return 'CREATED';
        }
        if (normalizedStatus === 'delivered') {
            return 'DELIVERED';
        }
        if (normalizedStatus === 'ready_to_pickup') {
            return 'READY_FOR_PICKUP';
        }
        if (normalizedStatus === 'returned_to_sender') {
            return 'RETURNED';
        }
        if (normalizedStatus === 'confirmed') {
            return 'CREATED';
        }
        if (normalizedStatus) {
            return 'IN_TRANSIT';
        }
        return 'UNKNOWN';
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

    private normalizeShipxPhone(phone?: string | null) {
        const digits = (phone ?? '').replace(/\D/g, '');
        if (!digits) return null;
        if (digits.startsWith('48') && digits.length === 11) return digits.slice(2);
        if (digits.length === 9) return digits;
        return null;
    }

    private normalizeShipxTargetPoint(rawValue?: string | null) {
        const value = (rawValue ?? '').trim().toUpperCase();
        if (!value) return null;
        const matches = value.match(/[A-Z]{3}[A-Z0-9]{2,10}/g);
        if (matches?.length) {
            return matches[0];
        }
        const compact = value.replace(/[^A-Z0-9]/g, '');
        if (compact.length >= 5 && compact.length <= 14) {
            return compact;
        }
        return null;
    }
}