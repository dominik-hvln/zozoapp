import { Injectable } from '@nestjs/common';
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
            console.error('[WEBHOOK BŁĄD] Brak kluczowych danych w sesji płatności!');
            return;
        }

        try {
            // Krok 1: Stwórz zamówienie w bazie
            const order = await this.prisma.orders.create({
                data: {
                    user_id: userId,
                    stripe_checkout_id: session.id,
                    total_amount: session.amount_total,
                }
            });
            console.log(`[WEBHOOK] Stworzono zamówienie w bazie: ${order.id}`);

            // Krok 2: Pobierz szczegóły produktów i stwórz pozycje zamówienia
            const lineItems = await this.stripe.checkout.sessions.listLineItems(session.id);
            for (const item of lineItems.data) {
                if (item.price && item.price.id && item.quantity) {
                    const variant = await this.prisma.product_variants.findUnique({
                        where: { stripe_price_id: item.price.id }
                    });
                    if (variant) {
                        await this.prisma.order_items.create({
                            data: {
                                order_id: order.id,
                                product_variant_id: variant.id,
                                quantity: item.quantity,
                                price: variant.price,
                            }
                        });
                    }
                }
            }
            console.log(`[WEBHOOK] Zapisano pozycje dla zamówienia: ${order.id}`);

            // Krok 3: Wyślij e-mail z potwierdzeniem
            const user = await this.prisma.users.findUnique({ where: { id: userId } });
            const fullOrderDetails = await this.prisma.orders.findUnique({
                where: { id: order.id },
                include: { order_items: { include: { product_variants: { include: { products: true } } } } }
            });

            if (user && fullOrderDetails) {
                await this.mailService.sendOrderConfirmationEmail(user.email, fullOrderDetails);
            }
        } catch (error) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Nie udało się przetworzyć zamówienia:', error);
            throw error;
        }
    }
}