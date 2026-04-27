import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { EventsGateway } from 'src/events/events.gateway';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class WebhooksService {
    private stripe: Stripe;
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private mailService: MailService,
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
                    order_items: { include: { product_variants: { include: { products: true } } } },
                },
            });

            if (fullOrderDetails?.users?.email) {
                await this.mailService.sendOrderConfirmationEmail(fullOrderDetails.users.email, fullOrderDetails);
            }
        } catch (error) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Nie udało się przetworzyć zamówienia:', error);
            throw error;
        }
    }
}