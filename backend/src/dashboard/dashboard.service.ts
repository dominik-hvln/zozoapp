import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getClientDashboardSummary(userId: string) {
        const recentChildren = await this.prisma.children.findMany({
            where: { user_id: userId },
            take: 4,
            orderBy: { created_at: 'desc' },
        });

        const activeTattoosCount = await this.prisma.assignments.count({
            where: {
                user_id: userId,
                is_active: true,
            },
        });

        const recentScans = await this.prisma.scans.findMany({
            where: {
                assignments: {
                    user_id: userId,
                },
            },
            take: 5,
            orderBy: { scan_time: 'desc' },
            select: {
                id: true,
                scan_time: true,
                latitude: true,
                longitude: true,
                assignments: {
                    include: {
                        tattoo_instances: { select: { unique_code: true } },
                        children: { select: { name: true } },
                    },
                },
            },
        });

        return {
            recentChildren,
            activeTattoosCount,
            recentScans,
        };
    }
}