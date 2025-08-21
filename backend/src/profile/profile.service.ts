import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) {}

    async getFullProfile(userId: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
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
        let subscriptionStatus = 'Nieznany';
        switch (user.account_status) {
            case 'ACTIVE':
                subscriptionStatus = 'Standard (Aktywny)';
                break;
            case 'TRIAL':
                subscriptionStatus = 'Okres próbny';
                break;

            case 'BLOCKED':
                subscriptionStatus = 'Wygasł / Zablokowany';
                break;
        }

        return { ...user, scansCount, subscriptionStatus };
    }

    updateProfile(userId: string, data: { firstName: string; lastName: string; phone: string }) {
        return this.prisma.users.update({
            where: { id: userId },
            data: {
                first_name: data.firstName,
                last_name: data.lastName,
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
        return this.prisma.users.update({
            where: { id: userId },
            data: { password_hash: newHashedPassword },
        });
    }
}