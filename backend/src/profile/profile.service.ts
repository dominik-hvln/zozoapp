import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from 'src/notifications/notifications.service';
import { effectiveAccountStatus, isAppStoreReviewMode } from 'src/common/app-review';

@Injectable()
export class ProfileService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private configService: ConfigService,
    ) {}

    async getFullProfile(userId: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                phone: true,
                created_at: true,
                account_status: true,
                trial_expires_at: true,
                children: {
                    include: {
                        _count: {
                            select: { assignments: { where: { is_active: true } } },
                        },
                    },
                },
                _count: {
                    select: {
                        assignments: true, // Liczba wszystkich kodów
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Profil nie znaleziony.');
        }

        const scansCount = 0;

        const effectiveStatus = effectiveAccountStatus(this.configService, user.account_status);

        const subscriptionStatus = isAppStoreReviewMode(this.configService)
            ? 'Standard (Aktywny)'
            : (() => {
                switch (user.account_status) {
                    case 'ACTIVE':
                        return 'Standard (Aktywny)';
                    case 'TRIAL':
                        return 'Okres próbny';
                    case 'BLOCKED':
                        return 'Wygasł / Zablokowany';
                    default:
                        return 'Nieznany';
                }
            })();

        return {
            ...user,
            account_status: effectiveStatus,
            trial_expires_at: isAppStoreReviewMode(this.configService) ? null : user.trial_expires_at,
            scansCount,
            subscriptionStatus,
        };
    }

    updateProfile(userId: string, data: { firstName: string; lastName: string; avatar_url: string; phone: string }) {
        return this.prisma.users.update({
            where: { id: userId },
            data: {
                first_name: data.firstName,
                last_name: data.lastName,
                avatar_url: data.avatar_url,
                phone: data.phone,
            },
        });
    }

    async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user) { throw new UnauthorizedException('Użytkownik nie istnieje.'); }
        const isPasswordMatching = await bcrypt.compare(oldPass, user.password_hash);
        if (!isPasswordMatching) { throw new UnauthorizedException('Stare hasło jest nieprawidłowe.'); }
        const newHashedPassword = await bcrypt.hash(newPass, 12);
        await this.notificationsService.create({
            user_id: userId,
            type: 'PASSWORD_CHANGE',
            title: 'Hasło zostało zmienione',
            message: 'Twoje hasło do konta zostało pomyślnie zaktualizowane.',
        });
        return this.prisma.users.update({
            where: { id: userId },
            data: { password_hash: newHashedPassword },
        });
    }

    async deleteAccount(userId: string, passwordConfirmation: string) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Użytkownik nie istnieje.');
        }

        const isPasswordMatching = await bcrypt.compare(passwordConfirmation, user.password_hash);
        if (!isPasswordMatching) {
            throw new UnauthorizedException('Hasło jest nieprawidłowe. Nie można usunąć konta.');
        }

        await this.notificationsService.create({
            user_id: userId,
            type: 'ACCOUNT_DELETION',
            title: 'Konto zostało usunięte',
            message: 'Twoje konto zostało trwale usunięte z naszego systemu.',
        });

        return this.prisma.users.delete({
            where: { id: userId },
        });
    }
}