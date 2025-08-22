import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class OrdersService {
    private stripe: Stripe;
    constructor(private prisma: PrismaService) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new InternalServerErrorException('Stripe secret key is not configured.');
        }
        this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });
    }

    async processSuccessfulOrder(sessionId: string, userId: string) {
        const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items.data.price.product'],
        });

        if (session.payment_status !== 'paid' || session.client_reference_id !== userId) {
            throw new NotFoundException('Płatność nie została potwierdzona lub jest nieprawidłowa.');
        }

        if (!session.amount_total) {
            throw new InternalServerErrorException('Brak kwoty w sesji Stripe.');
        }

        const order = await this.prisma.orders.create({
            data: {
                user_id: userId,
                stripe_checkout_id: sessionId,
                total_amount: session.amount_total,
            }
        });

        if (session.line_items) {
            for (const item of session.line_items.data) {
                if (item.price && item.price.id && item.quantity && item.price.unit_amount) {
                    const variant = await this.prisma.product_variants.findUnique({
                        where: { stripe_price_id: item.price.id }
                    });

                    if (variant) {
                        // POPRAWKA: Używamy `order_items`, a nie `cart_items`
                        await this.prisma.order_items.create({
                            data: {
                                order_id: order.id,
                                product_variant_id: variant.id,
                                quantity: item.quantity,
                                price: item.price.unit_amount,
                            }
                        });
                    }
                }
            }
        }

        return this.getOrderDetails(order.id, userId);
    }

    getOrderDetails(orderId: string, userId: string) {
        return this.prisma.orders.findFirst({
            where: { id: orderId, user_id: userId },
            include: {
                // POPRAWKA: Poprawna ścieżka do nazwy produktu
                order_items: {
                    include: {
                        product_variants: {
                            include: {
                                products: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}