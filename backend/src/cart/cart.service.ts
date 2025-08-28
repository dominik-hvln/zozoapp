import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) {}

    private async findOrCreateCart(userId: string) {
        let cart = await this.prisma.carts.findUnique({
            where: { user_id: userId },
        });
        if (!cart) {
            cart = await this.prisma.carts.create({
                data: { user_id: userId },
            });
        }
        return cart;
    }

    async getCart(userId: string) {
        const cart = await this.findOrCreateCart(userId);
        return this.prisma.cart_items.findMany({
            where: { cart_id: cart.id },
            include: { products: true },
        });
    }

    async addItem(userId: string, productId: string, quantity: number, image_url: string) {
        const cart = await this.findOrCreateCart(userId);

        const existingItem = await this.prisma.cart_items.findFirst({
            where: { cart_id: cart.id, product_id: productId },
        });

        if (existingItem) {
            return this.prisma.cart_items.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            return this.prisma.cart_items.create({
                data: {
                    cart_id: cart.id,
                    product_id: productId,
                    quantity: quantity,
                    image_url: image_url,
                },
            });
        }
    }

    async updateItemQuantity(userId: string, itemId: string, quantity: number) {
        const cart = await this.findOrCreateCart(userId);
        return this.prisma.cart_items.updateMany({
            where: { id: itemId, cart_id: cart.id },
            data: { quantity: quantity },
        });
    }

    async removeItem(userId: string, itemId: string) {
        const cart = await this.findOrCreateCart(userId);
        return this.prisma.cart_items.deleteMany({
            where: { id: itemId, cart_id: cart.id },
        });
    }
}