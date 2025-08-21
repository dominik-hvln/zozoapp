import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class AdminService {
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

    getAllUsers() {
        return this.prisma.users.findMany({
            select: { id: true, email: true, first_name: true, role: true, created_at: true },
        });
    }

    async generateAndStoreRandomCodes(count: number) {
        const codesToInsert: Prisma.tattoo_instancesCreateManyInput[] = [];
        for (let i = 0; i < count; i++) {
            const uuid = randomUUID();
            const parts = uuid.split('-');
            const friendlyCode = `ZAP-${parts[1].toUpperCase()}-${parts[3].toUpperCase()}`;
            codesToInsert.push({ unique_code: friendlyCode });
        }

        return this.prisma.tattoo_instances.createMany({
            data: codesToInsert,
            skipDuplicates: true,
        });
    }

    getActiveAssignments() {
        return this.prisma.assignments.findMany({
            where: { is_active: true },
            include: {
                users: { select: { email: true } },
                children: { select: { name: true } },
                tattoo_instances: { select: { unique_code: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    getNewTattooCodes() {
        return this.prisma.tattoo_instances.findMany({
            where: { status: 'new' },
            orderBy: { created_at: 'desc' },
        });
    }

    async getUserDetails(userId: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                created_at: true,
                phone: true,
                children: {
                    include: {
                        _count: {
                            select: { assignments: { where: { is_active: true } } },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Użytkownik nie został znaleziony.');
        }
        return user;
    }

    async deactivateAssignment(assignmentId: string) {
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assignments.update({
                where: { id: assignmentId },
                data: { is_active: false },
            });

            await tx.tattoo_instances.update({
                where: { id: assignment.tattoo_instance_id },
                data: { status: 'inactive' },
            });

            return assignment;
        });
    }

    async getDashboardStats() {
        const usersCount = await this.prisma.users.count();
        const childrenCount = await this.prisma.children.count();
        const newTattoosCount = await this.prisma.tattoo_instances.count({
            where: { status: 'new' },
        });
        const activeTattoosCount = await this.prisma.tattoo_instances.count({
            where: { status: 'active' },
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsersLast7Days = await this.prisma.users.groupBy({
            by: ['created_at'],
            where: {
                created_at: {
                    gte: sevenDaysAgo,
                },
            },
            _count: {
                id: true,
            },
        });

        const chartData = newUsersLast7Days.map(day => ({
            date: new Date(day.created_at).toISOString().split('T')[0],
            count: day._count.id
        }));

        return {
            usersCount,
            childrenCount,
            newTattoosCount,
            activeTattoosCount,
            chartData,
        };
    }

    getAllProducts() {
        return this.prisma.products.findMany({
            orderBy: { created_at: 'desc' },
            include: { product_variants: true },
        });
    }

    async createProduct(data: { name: string, description?: string }) {
        // Krok 1: Stwórz produkt w Stripe
        const stripeProduct = await this.stripe.products.create({
            name: data.name,
            description: data.description,
        });

        // Krok 2: Zapisz produkt w naszej bazie danych razem z ID ze Stripe
        return this.prisma.products.create({
            data: {
                name: data.name,
                description: data.description,
                stripe_product_id: stripeProduct.id,
            },
        });
    }

    async addVariantToProduct(productId: string, data: { quantity: number; price: number; }) {
        const product = await this.prisma.products.findUnique({ where: { id: productId } });
        if (!product || !product.stripe_product_id) {
            throw new NotFoundException('Produkt nie istnieje lub nie jest zsynchronizowany ze Stripe.');
        }

        // Krok 1: Stwórz nową cenę w Stripe powiązaną z produktem
        const stripePrice = await this.stripe.prices.create({
            product: product.stripe_product_id,
            unit_amount: data.price, // Cena w groszach
            currency: 'pln',
        });

        // Krok 2: Zapisz wariant w naszej bazie z ID ceny ze Stripe
        return this.prisma.product_variants.create({
            data: {
                product_id: productId,
                quantity: data.quantity,
                price: data.price,
                stripe_price_id: stripePrice.id,
            }
        });
    }

    async getQrCodeContentForTattoo(tattooInstanceId: string): Promise<{ content: string; uniqueCode: string }> {
        const tattoo = await this.prisma.tattoo_instances.findUnique({
            where: { id: tattooInstanceId },
        });

        if (!tattoo) {
            throw new NotFoundException('Nie znaleziono tatuażu o podanym ID.');
        }

        const qrContent = `${process.env.FRONTEND_URL}/t/${tattoo.unique_code}`;
        return { content: qrContent, uniqueCode: tattoo.unique_code };
    }
}