import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async create(dto: Omit<RegisterDto, 'password'> & { password_hash: string }) {
        const trialExpires = new Date();
        trialExpires.setDate(trialExpires.getDate() + 14); // Ustawiamy datę wygaśnięcia na 14 dni w przyszłości

        try {
            return await this.prisma.users.create({
                data: {
                    email: dto.email,
                    password_hash: dto.password_hash,
                    first_name: dto.firstName,
                    last_name: dto.lastName,
                    phone: dto.phone,
                    trial_expires_at: trialExpires,
                    account_status: 'TRIAL',
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' // Kod błędu dla unikalności
            ) {
                throw new ConflictException('Użytkownik o tym adresie email już istnieje.');
            }
            throw error;
        }
    }

    async findByEmail(email: string) {
        return this.prisma.users.findUnique({
            where: {
                email: email,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.users.findUnique({
            where: { id },
        });
    }
}