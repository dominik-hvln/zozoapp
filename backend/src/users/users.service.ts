import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async create(dto: RegisterDto) {
        return this.prisma.users.create({
            data: {
                email: dto.email,
                password_hash: dto.password,
                name: dto.name,
            },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.users.findUnique({
            where: {
                email: email,
            },
        });
    }
}