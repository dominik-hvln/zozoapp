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
        const userId = session.client_reference_id;

        if (!userId) {
            console.error('Błąd krytyczny: Brak userId w sesji Stripe Checkout!', { sessionId: session.id });
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
                },
            });
            console.log(`Subskrypcja została pomyślnie aktywowana dla użytkownika: ${userId}`);
        } catch (error) {
            console.error(`Nie udało się zaktualizować statusu dla użytkownika ${userId}`, error);
        }

        this.eventsGateway.sendToUser(userId, 'accountStatusChanged', {
            status: 'ACTIVE'
        });
    }
}