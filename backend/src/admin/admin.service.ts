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
            where: {
                is_deleted: false,
            },
            orderBy: { created_at: 'desc' },
            include: { product_variants: {
                    where: {
                        is_deleted: false,
                    },
                    orderBy: {
                        quantity: 'asc'
                    },
                }, categories: true },
        });
    }

    async createProduct(data: { name: string, description?: string, categoryIds?: string[] }) {
        const stripeProduct = await this.stripe.products.create({
            name: data.name,
            description: data.description,
        });

        return this.prisma.products.create({
            data: {
                name: data.name,
                description: data.description,
                stripe_product_id: stripeProduct.id,
                categories: {
                    connect: data.categoryIds?.map(id => ({ id })) || [],
                },
            },
        });
    }

    async updateProduct(productId: string, data: { name?: string, description?: string, isActive?: boolean, categoryIds?: string[] }) {
        return this.prisma.products.update({
            where: { id: productId },
            data: {
                name: data.name,
                description: data.description,
                is_active: data.isActive,
                categories: {
                    set: data.categoryIds?.map(id => ({ id })) || [],
                },
            },
        });
    }

    async addVariantToProduct(productId: string, data: { quantity: number; price: number; }) {
        const product = await this.prisma.products.findUnique({ where: { id: productId } });
        if (!product || !product.stripe_product_id) {
            throw new NotFoundException('Produkt nie istnieje lub nie jest zsynchronizowany ze Stripe.');
        }

        try {
            const stripePrice = await this.stripe.prices.create({
                product: product.stripe_product_id,
                unit_amount: data.price,
                currency: 'pln',
            });

            return this.prisma.products.update({
                where: { id: productId },
                data: {
                    product_variants: {
                        create: {
                            quantity: data.quantity,
                            price: data.price,
                            stripe_price_id: stripePrice.id,
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Błąd podczas tworzenia wariantu:", error);
            throw new InternalServerErrorException('Nie udało się stworzyć wariantu w Stripe lub w bazie danych.');
        }
    }

    async updateVariant(variantId: string, data: { quantity: number; price: number; }) {
        const variant = await this.prisma.product_variants.findUnique({
            where: { id: variantId },
            include: { products: true }
        });
        if (!variant || !variant.products.stripe_product_id) {
            throw new NotFoundException('Wariant lub powiązany produkt Stripe nie został znaleziony.');
        }

        await this.stripe.prices.update(variant.stripe_price_id, { active: false });

        const newStripePrice = await this.stripe.prices.create({
            product: variant.products.stripe_product_id,
            unit_amount: data.price,
            currency: 'pln',
        });

        return this.prisma.product_variants.update({
            where: { id: variantId },
            data: {
                quantity: data.quantity,
                price: data.price,
                stripe_price_id: newStripePrice.id,
            }
        });
    }

    async deleteVariant(variantId: string) {
        const variant = await this.prisma.product_variants.findUnique({
            where: { id: variantId }
        });

        if (!variant) {
            throw new NotFoundException('Wariant nie został znaleziony.');
        }

        try {
            await this.stripe.prices.update(variant.stripe_price_id, { active: false });

            await this.prisma.product_variants.update({
                where: { id: variantId },
                data: {
                    is_deleted: true,
                }
            });

            return { success: true, message: 'Wariant został pomyślnie zarchiwizowany.' };
        } catch (error) {
            console.error("Błąd podczas archiwizacji wariantu:", error);
            throw new InternalServerErrorException('Nie udało się zarchiwizować wariantu.');
        }
    }

    async deleteProduct(productId: string) {
        const product = await this.prisma.products.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('Produkt nie został znaleziony.');
        }

        // Deaktywujemy produkt w Stripe
        if (product.stripe_product_id) {
            await this.stripe.products.update(product.stripe_product_id, { active: false });
        }

        // Archiwizujemy produkt w naszej bazie
        return this.prisma.products.update({
            where: { id: productId },
            data: { is_deleted: true },
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

    getAllCategories() {
        return this.prisma.categories.findMany();
    }

    createCategory(name: string) {
        return this.prisma.categories.create({ data: { name } });
    }

    async assignCategoriesToProduct(productId: string, categoryIds: string[]) {
        return this.prisma.products.update({
            where: { id: productId },
            data: {
                categories: {
                    set: categoryIds.map(id => ({ id })),
                },
            },
        });
    }

    getAllDiscountCodes() {
        return this.prisma.discount_codes.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    async createDiscountCode(data: Omit<Prisma.discount_codesUncheckedCreateInput, 'id' | 'created_at'>) {
        // Krok 1: Stwórz Kupon w Stripe
        const couponParams: Stripe.CouponCreateParams = {
            duration: 'once', // Kupon jednorazowy
        };
        if (data.type === 'PERCENTAGE') {
            couponParams.percent_off = data.value;
        } else {
            couponParams.amount_off = data.value; // Wartość w groszach
            couponParams.currency = 'pln';
        }
        const coupon = await this.stripe.coupons.create(couponParams);

        // Krok 2: Stwórz Kod Promocyjny w Stripe, powiązany z Kuponem
        await this.stripe.promotionCodes.create({
            coupon: coupon.id,
            code: data.code,
        });

        // Krok 3: Zapisz kod w naszej bazie danych
        return this.prisma.discount_codes.create({ data });
    }

    updateDiscountCode(id: string, data: Prisma.discount_codesUncheckedUpdateInput) {
        return this.prisma.discount_codes.update({
            where: { id },
            data,
        });
    }

    getAllShippingMethods() {
        return this.prisma.shipping_methods.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    async createShippingMethod(data: Omit<Prisma.shipping_methodsUncheckedCreateInput, 'id' | 'created_at' | 'stripe_shipping_rate_id'>) {
        // Krok 1: Stwórz stawkę dostawy w Stripe
        const shippingRate = await this.stripe.shippingRates.create({
            display_name: data.name,
            type: 'fixed_amount',
            fixed_amount: {
                amount: data.price, // Cena w groszach
                currency: 'pln',
            },
        });

        // Krok 2: Zapisz metodę dostawy w naszej bazie
        return this.prisma.shipping_methods.create({
            data: {
                ...data,
                stripe_shipping_rate_id: shippingRate.id,
            },
        });
    }

    async updateShippingMethod(id: string, data: Omit<Prisma.shipping_methodsUncheckedUpdateInput, 'id' | 'created_at' | 'stripe_shipping_rate_id'>) {
        const existingMethod = await this.prisma.shipping_methods.findUnique({ where: { id } });
        if (!existingMethod) {
            throw new NotFoundException('Metoda dostawy nie została znaleziona.');
        }

        if (existingMethod.stripe_shipping_rate_id) {
            await this.stripe.shippingRates.update(existingMethod.stripe_shipping_rate_id, { active: false });
        }

        const newShippingRate = await this.stripe.shippingRates.create({
            display_name: data.name as string,
            type: 'fixed_amount',
            fixed_amount: {
                amount: data.price as number,
                currency: 'pln',
            },
        });

        return this.prisma.shipping_methods.update({
            where: { id },
            data: {
                name: data.name as string,
                price: data.price as number,
                is_active: data.is_active as boolean,
                stripe_shipping_rate_id: newShippingRate.id,
            },
        });
    }
}