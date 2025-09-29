import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running cron job to expire tattoos...');

    const now = new Date();

    const expiredTattoos = await this.prisma.tattoo_instances.findMany({
      where: {
        status: 'active',
        expires_at: {
          lt: now,
        },
      },
    });

    if (expiredTattoos.length === 0) {
      this.logger.log('No tattoos to expire.');
      return;
    }

    const expiredTattooIds = expiredTattoos.map((tattoo) => tattoo.id);

    try {
      await this.prisma.$transaction([
        this.prisma.tattoo_instances.updateMany({
          where: {
            id: {
              in: expiredTattooIds,
            },
          },
          data: {
            status: 'inactive',
          },
        }),
        this.prisma.assignments.updateMany({
          where: {
            tattoo_instance_id: {
              in: expiredTattooIds,
            },
          },
          data: {
            is_active: false,
          },
        }),
      ]);

      this.logger.log(`Successfully expired ${expiredTattoos.length} tattoos.`);
    } catch (error) {
      this.logger.error('Error expiring tattoos', error);
    }
  }
}