import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) {}

    create(data: Prisma.notificationsUncheckedCreateInput) {
        return this.prisma.notifications.create({ data });
    }

    findAllForUser(userId: string) {
        return this.prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }

    getUnreadCount(userId: string) {
        return this.prisma.notifications.count({
            where: { user_id: userId, is_read: false },
        });
    }

    markAsRead(notificationId: string, userId: string) {
        return this.prisma.notifications.updateMany({
            where: { id: notificationId, user_id: userId },
            data: { is_read: true },
        });
    }
}