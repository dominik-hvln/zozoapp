import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { EventsGateway } from 'src/events/events.gateway';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class WebhooksService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private mailService: MailService,
    ) {}

    // GŁÓWNA FUNKCJA, KTÓRA WRACA NA SWOJE MIEJSCE
    async handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
        console.log(`[WEBHOOK] Otrzymano sesję checkout: ${session.id}, tryb: ${session.mode}`);

        if (session.mode === 'subscription') {
            await this.handleSubscriptionUpdate(session);
        } else if (session.mode === 'payment') {
            await this.handleOneTimePayment(session);
        } else {
            console.warn(`[WEBHOOK] Nieobsługiwany tryb sesji: ${session.mode}`);
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
        console.log('[WEBHOOK] Rozpoczynam obsługę płatności jednorazowej...');
        const userId = session.client_reference_id;
        if (!userId || !session.amount_total) {
            console.error('[WEBHOOK BŁĄD] Brak userId lub kwoty w sesji płatności!', { sessionId: session.id });
            return;
        }

        // Czekamy chwilę, aby dać czas na stworzenie zamówienia w `processSuccessfulOrder`
        await new Promise(resolve => setTimeout(resolve, 2000));

        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        const order = await this.prisma.orders.findFirst({
            where: { stripe_checkout_id: session.id },
            include: {
                order_items: {
                    include: {
                        product_variants: {
                            include: {
                                products: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        if (user && order) {
            await this.mailService.sendOrderConfirmationEmail(user.email, order);
        } else {
            console.error(`[WEBHOOK BŁĄD] Nie znaleziono użytkownika lub zamówienia dla sesji płatności: ${session.id}`);
        }
    }
}