import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChildrenService {
    constructor(private prisma: PrismaService) {}

    create(name: string, userId: string) {
        return this.prisma.children.create({
            data: {
                name,
                user_id: userId,
            },
        });
    }

    findAllForUser(userId: string) {
        return this.prisma.children.findMany({
            where: {
                user_id: userId,
            },
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
                created_at: 'asc'
            }
        });
    }

    update(childId: string, name: string, userId: string) {
        return this.prisma.children.updateMany({
            where: {
                id: childId,
                user_id: userId,
            },
            data: {
                name,
            },
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