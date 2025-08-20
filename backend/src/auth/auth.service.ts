import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private configService: ConfigService,
    ) {}

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
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
            sub: newUser.id,
            email: newUser.email,
            role: newUser.role,
            status: newUser.account_status,
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
}