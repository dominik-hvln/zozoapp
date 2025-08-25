import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

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
                    orderBy: { quantity: 'asc' },
                },
            },
            orderBy: { [sortBy]: sortOrder },
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
                success_url: `${process.env.FRONTEND_URL}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
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

        // Szukamy wariantów po ich stripe_price_id
        const variantsInDb = await this.prisma.product_variants.findMany({
            where: { stripe_price_id: { in: priceIds } },
        });

        if (variantsInDb.length !== items.length) {
            throw new InternalServerErrorException('Niektóre produkty w koszyku są nieprawidłowe.');
        }

        const line_items = variantsInDb.map(variant => {
            const item = items.find(i => i.priceId === variant.stripe_price_id);
            return {
                price: variant.stripe_price_id,
                quantity: item?.quantity || 1,
            };
        });

        if (line_items.length === 0) {
            throw new InternalServerErrorException('Koszyk jest pusty.');
        }

        const session = await this.stripe.checkout.sessions.create({
            ui_mode: 'hosted',
            mode: 'payment',
            client_reference_id: userId,
            customer_email: user.email,
            line_items: line_items,
                success_url: `${process.env.FRONTEND_URL}/panel/zamowienie/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/panel/koszyk?status=cancel`,
        });

        return session;
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
}