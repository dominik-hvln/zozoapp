import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) {
            throw new NotFoundException('Użytkownik nie został znaleziony.');
        }
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
                success_url: `${process.env.FRONTEND_URL}/panel?payment=success`,
                cancel_url: `${process.env.FRONTEND_URL}/panel`,
            });
            return session;
        } catch (error) {
            console.error("Błąd z API Stripe:", error.message);
            throw new InternalServerErrorException(`Błąd Stripe: ${error.message}`);
        }
    }

    async createOneTimePaymentCheckoutSession(items: { priceId: string, quantity: number }[], userId: string) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Użytkownik nie został znaleziony.');
        }

        const priceIds = items.map(item => item.priceId);
        const productsInDb = await this.prisma.products.findMany({
            where: { stripe_price_id: { in: priceIds } },
        });

        // Filtrujemy, aby mieć pewność, że każdy produkt ma priceId i jest poprawny
        const validProducts = productsInDb.filter(p => p.stripe_price_id);
        if (validProducts.length !== items.length) {
            throw new InternalServerErrorException('Niektóre produkty w koszyku są nieprawidłowe lub niedostępne.');
        }

        const line_items = validProducts.map(product => {
            const item = items.find(i => i.priceId === product.stripe_price_id);
            return {
                price: product.stripe_price_id!, // Używamy '!', bo jesteśmy pewni, że nie jest null
                quantity: item?.quantity || 1,
            };
        });

        if (line_items.length === 0) {
            throw new InternalServerErrorException('Koszyk jest pusty.');
        }

        const session = await this.stripe.checkout.sessions.create({
            ui_mode: 'hosted',
            mode: 'payment', // Tryb jednorazowej płatności
            client_reference_id: userId,
            customer_email: user.email,
            line_items: line_items,
            success_url: `${process.env.FRONTEND_URL}/panel/koszyk?status=success`,
            cancel_url: `${process.env.FRONTEND_URL}/panel/koszyk?status=cancel`,
        });

        return session;
    }
}