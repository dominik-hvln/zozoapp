import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) {}

    async getProfile(userId: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { email: true, first_name: true, last_name: true, phone: true },
        });
        if (!user) {
            throw new NotFoundException('Profil nie znaleziony.');
        }
        return user;
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

        // POPRAWKA JEST TUTAJ:
        // Sprawdzamy, czy na pewno znaleźliśmy użytkownika w bazie
        if (!user) {
            throw new UnauthorizedException('Użytkownik nie istnieje.');
        }

        const isPasswordMatching = await bcrypt.compare(oldPass, user.password_hash);

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Stare hasło jest nieprawidłowe.');
        }

        const newHashedPassword = await bcrypt.hash(newPass, 10);
        return this.prisma.users.update({
            where: { id: userId },
            data: { password_hash: newHashedPassword },
        });
    }
}