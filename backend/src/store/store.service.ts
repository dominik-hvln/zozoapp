import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StoreService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new InternalServerErrorException('Stripe secret key is not configured.');
        }
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-07-30.basil',
        });
    }

    // Twoja istniejąca metoda - pozostaje bez zmian
    getAvailableProducts() {
        return this.prisma.products.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'asc' },
        });
    }

    async createSubscriptionCheckoutSession(userId: string) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                ui_mode: 'hosted',
                payment_method_collection: 'if_required',
                mode: 'subscription',
                client_reference_id: userId,
                line_items: [{
                    price: 'price_1RwJhZLpI3RKz2R39q16HoQU',
                    quantity: 1,
                }],
                success_url: `${process.env.FRONTEND_URL}/panel?payment=success`,
                cancel_url: `${process.env.FRONTEND_URL}/panel`,
            });
            return session;
        } catch (error) {
            console.error("Błąd z API Stripe:", error.message);
            throw new InternalServerErrorException(`Błąd Stripe: ${error.message}`);
        }
    }
}