import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChildrenService {
    constructor(private prisma: PrismaService) {}

    create(data: Omit<Prisma.childrenUncheckedCreateInput, 'user_id'>, userId: string) {
        return this.prisma.children.create({
            data: {
                ...data,
                users: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
    }

    findAllForUser(userId: string) {
        return this.prisma.children.findMany({
            where: {
                user_id: userId,
            },
            // Przywracamy dołączanie licznika _count
            include: {
                _count: {
                    select: {
                        assignments: {
                            where: { is_active: true },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
    }

    async findOneById(childId: string, userId: string) {
        const child = await this.prisma.children.findFirst({
            where: {
                id: childId,
                user_id: userId,
            },
            include: {
                assignments: {
                    where: { is_active: true },
                    include: {
                        tattoo_instances: { select: { unique_code: true } }
                    }
                }
            }
        });

        if (!child) {
            throw new NotFoundException('Nie znaleziono profilu dziecka.');
        }
        return child;
    }

    update(childId: string, data: Prisma.childrenUncheckedUpdateInput, userId: string) {
        return this.prisma.children.updateMany({
            where: {
                id: childId,
                user_id: userId,
            },
            data,
        });
    }

    remove(childId: string, userId: string) {
        return this.prisma.children.deleteMany({
            where: {
                id: childId,
                user_id: userId,
            },
        });
    }
}