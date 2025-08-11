import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const userData = {
            ...dto,
            password: hashedPassword,
        };
        const newUser = await this.usersService.create(userData);
        const { password_hash, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
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
            role: user.role
        };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
        };
    }
}