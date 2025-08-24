import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const { password, ...submissionData } = dto;

        const newUser = await this.usersService.create({
            ...submissionData,
            password_hash: hashedPassword,
        });

        try {
            await this.mailService.sendWelcomeEmail(newUser.email, newUser.first_name ?? 'Nowy Użytkowniku');
        } catch (emailError) {
            console.error('Błąd wysyłki e-maila powitalnego (użytkownik został utworzony):', emailError);
        }

        const secret = this.configService.get<string>('JWT_SECRET');
        console.log('SECRET KEY CHECK:', secret ? `Secret o długości ${secret.length} został znaleziony.` : '!!! SEKRET JEST PUSTY LUB NIEZNALEZIONY !!!');

        const payload = {
            sub: newUser.id, email: newUser.email, role: newUser.role,
            status: newUser.account_status, firstName: newUser.first_name,
            avatar_url: newUser.avatar_url,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            access_token: accessToken,
        };
    }

    async login(dto: { email: string; pass: string }) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Nieprawidłowe dane logowania');
        }

        const isPasswordMatching = await bcrypt.compare(dto.pass, user.password_hash);
        if (!isPasswordMatching) {
            throw new UnauthorizedException('Nieprawidłowe dane logowania');
        }

        const payload = {
            sub: user.id, email: user.email, role: user.role,
            status: user.account_status, firstName: user.first_name,
            avatar_url: user.avatar_url,
        };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
        };
    }

    async refreshSession(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException();
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            status: user.account_status,
            firstName: user.first_name,
        };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
        };
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Ze względów bezpieczeństwa, nie informujemy, czy e-mail istnieje
            return { message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany.' };
        }

        const resetToken = randomBytes(32).toString('hex');
        const passwordResetToken = createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 3600000); // Ważny 1 godzinę

        await this.prisma.users.update({
            where: { email },
            data: {
                password_reset_token: passwordResetToken,
                password_reset_expires: passwordResetExpires,
            },
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await this.mailService.sendPasswordResetEmail(email, resetUrl);

        return { message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany.' };
    }

    async resetPassword(token: string, newPass: string): Promise<{ message: string }> {
        const hashedToken = createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.users.findFirst({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { gte: new Date() },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Token jest nieprawidłowy lub wygasł.');
        }

        const newHashedPassword = await bcrypt.hash(newPass, 12);
        await this.prisma.users.update({
            where: { id: user.id },
            data: {
                password_hash: newHashedPassword,
                password_reset_token: null,
                password_reset_expires: null,
            },
        });

        return { message: 'Hasło zostało pomyślnie zmienione.' };
    }
}