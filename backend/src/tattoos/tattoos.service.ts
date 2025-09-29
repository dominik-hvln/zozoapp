import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TattoosService {
    constructor(private prisma: PrismaService) {}

    async activateTattoo(uniqueCode: string, childId: string, userId: string) {
        const tattoo = await this.prisma.tattoo_instances.findUnique({
            where: { unique_code: uniqueCode },
        });

        if (!tattoo) {
            throw new NotFoundException('Tatuaż o podanym kodzie nie istnieje.');
        }

        if (tattoo.status !== 'new') {
            throw new BadRequestException('Ten tatuaż został już aktywowany.');
        }

        return this.prisma.$transaction(async (tx) => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const updatedTattoo = await tx.tattoo_instances.update({
                where: { id: tattoo.id },
                data: {
                    status: 'active',
                    expires_at: expiresAt,
                },
            });

            const assignment = await tx.assignments.create({
                data: {
                    user_id: userId,
                    child_id: childId,
                    tattoo_instance_id: tattoo.id,
                    is_active: true,
                },
            });

            return { updatedTattoo, assignment };
        });
    }

    findAllForUser(userId: string) {
        return this.prisma.assignments.findMany({
            where: {
                user_id: userId,
            },
            include: {
                children: true,
                tattoo_instances: {
                    select: {
                        unique_code: true,
                        expires_at: true,
                    }
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }
}