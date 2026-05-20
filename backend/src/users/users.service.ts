import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Prisma } from '@prisma/client';
import { isAppStoreReviewMode } from 'src/common/app-review';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async create(dto: Omit<RegisterDto, 'password'> & { password_hash: string }) {
        const reviewMode = isAppStoreReviewMode(this.configService);
        const trialExpires = new Date();
        trialExpires.setDate(trialExpires.getDate() + 14);

        try {
            return await this.prisma.users.create({
                data: {
                    email: dto.email,
                    password_hash: dto.password_hash,
                    first_name: dto.firstName,
                    last_name: dto.lastName,
                    phone: dto.phone?.trim() || null,
                    trial_expires_at: reviewMode ? null : trialExpires,
                    account_status: reviewMode ? 'ACTIVE' : 'TRIAL',
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