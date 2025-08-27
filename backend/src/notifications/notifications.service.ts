import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) {}

    onModuleInit() {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                if (admin.apps.length === 0) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    this.logger.log('Firebase Admin SDK initialized successfully.');
                }
            } else {
                this.logger.warn('FIREBASE_SERVICE_ACCOUNT is not set. Push notifications are disabled.');
            }
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK.', error);
        }
    }

    // --- Logika powiadomień w panelu ---

    create(data: Prisma.notificationsUncheckedCreateInput) {
        return this.prisma.notifications.create({ data });
    }

    // POPRAWKA: userId jest typu string, zgodnie z Twoim schematem Prisma
    findAllForUser(userId: string) {
        return this.prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }

    // POPRAWKA: userId jest typu string
    getUnreadCount(userId: string) {
        return this.prisma.notifications.count({
            where: { user_id: userId, is_read: false },
        });
    }

    // POPRAWKA: userId jest typu string
    markAsRead(notificationId: string, userId: string) {
        return this.prisma.notifications.updateMany({
            where: { id: notificationId, user_id: userId },
            data: { is_read: true },
        });
    }

    async saveToken(userId: string, token: string): Promise<void> {
        await this.prisma.device_tokens.upsert({
            where: { token },
            update: { user_id: userId },
            create: { user_id: userId, token },
        });
        this.logger.log(`Saved or updated device token for user ID: ${userId}`);
    }

    // POPRAWKA: userId jest typu string
    async sendNotificationToUser(userId: string, payload: admin.messaging.MessagingPayload) {
        const userTokens = await this.prisma.device_tokens.findMany({
            where: { user_id: userId },
        });

        const tokens = userTokens.map((t) => t.token);

        if (tokens.length === 0) {
            this.logger.warn(`No device tokens for user ID: ${userId}. Skipping push notification.`);
            return;
        }

        const message: admin.messaging.MulticastMessage = { ...payload, tokens };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(`Push message sent to ${response.successCount} devices for user ${userId}.`);
            if (response.failureCount > 0) {
                this.handleFailedTokens(response, tokens);
            }
        } catch (error) {
            this.logger.error(`Error sending push notification to user ${userId}`, error);
        }
    }

    private async handleFailedTokens(response: admin.messaging.BatchResponse, tokens: string[]) {
        const tokensToDelete: string[] = [];
        response.responses.forEach((result, index) => {
            // POPRAWKA: Sprawdzamy, czy `result.error` istnieje, zanim odwołamy się do `.code`
            if (!result.success && result.error) {
                const errorCode = result.error.code;
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered'
                ) {
                    tokensToDelete.push(tokens[index]);
                }
            }
        });

        if (tokensToDelete.length > 0) {
            this.logger.log(`Deleting ${tokensToDelete.length} invalid tokens.`);
            await this.prisma.device_tokens.deleteMany({
                where: { token: { in: tokensToDelete } },
            });
        }
    }
}