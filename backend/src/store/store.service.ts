import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StoreService {
    constructor(private prisma: PrismaService) {}

    getAvailableProducts() {
        return this.prisma.products.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'asc' },
        });
    }
}