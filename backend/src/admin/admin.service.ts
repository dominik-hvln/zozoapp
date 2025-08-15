import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

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
        });
    }

    createProduct(data: { name: string, description?: string, price: number }) {
        return this.prisma.products.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
            },
        });
    }
}