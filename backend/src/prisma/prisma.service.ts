import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Pomyślnie połączono z bazą danych Prisma.');
        } catch (error) {
            this.logger.error('Nie udało się połączyć z bazą danych na start z powodu błędu sieciowego, ale serwer zostaje uruchomiony dalej.', error);
        }
    }
}