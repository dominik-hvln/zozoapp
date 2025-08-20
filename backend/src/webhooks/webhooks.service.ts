import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class WebhooksService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
    ) {}

    async handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
        console.log('[WEBHOOK] Rozpoczynam obsługę udanej płatności...');

        const userId = session.client_reference_id;
        const stripeCustomerObject = session.customer;

        // OSTATECZNA POPRAWKA: Poprawnie i bezpiecznie wyciągamy ID klienta
        const stripeCustomerId = typeof stripeCustomerObject === 'string'
            ? stripeCustomerObject
            : stripeCustomerObject?.id;

        if (!userId || !stripeCustomerId) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Brak userId lub stripeCustomerId w sesji Stripe!', { sessionId: session.id });
            return; // Zakończ, jeśli brakuje kluczowych danych
        }

        console.log(`[WEBHOOK] Dane poprawne. UserId: ${userId}, StripeCustomerId: ${stripeCustomerId}`);

        const subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 31);

        try {
            console.log(`[WEBHOOK] Próbuję zaktualizować użytkownika ${userId} w bazie danych...`);
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    account_status: 'ACTIVE',
                    trial_expires_at: subscriptionExpiresAt,
                    stripe_customer_id: stripeCustomerId, // Gwarantujemy, że to pole jest zapisywane
                },
            });
            console.log('[WEBHOOK] Użytkownik w bazie danych zaktualizowany pomyślnie.');
        } catch (error) {
            console.error(`[WEBHOOK BŁĄD KRYTYCZNY] Błąd podczas aktualizacji użytkownika ${userId}:`, error);
            // Rzucamy błąd dalej, aby Stripe wiedział, że coś poszło nie tak
            throw error;
        }

        try {
            this.eventsGateway.sendToUser(userId, 'accountStatusChanged', { status: 'ACTIVE' });
            console.log(`[WEBHOOK] Powiadomienie WebSocket wysłane do użytkownika: ${userId}`);
        } catch (error) {
            console.error(`[WEBHOOK BŁĄD] Nie udało się wysłać powiadomienia WebSocket dla ${userId}`, error);
        }

        console.log(`[WEBHOOK] Obsługa płatności zakończona pomyślnie dla użytkownika: ${userId}.`);
    }
}