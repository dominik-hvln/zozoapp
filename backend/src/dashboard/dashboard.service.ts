import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getClientDashboardSummary(userId: string) {
        const [
            recentChildren,
            activeTattoosCount,
            recentScans,
            recentAssignments,
        ] = await Promise.all([
            this.prisma.children.findMany({
                where: { user_id: userId },
                include: { _count: { select: { assignments: { where: { is_active: true } } } } },
                take: 4,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.assignments.count({
                where: { user_id: userId, is_active: true },
            }),
            this.prisma.scans.findMany({
                where: { assignments: { user_id: userId } },
                take: 5,
                orderBy: { scan_time: 'desc' },
                select: {
                    id: true,
                    scan_time: true,
                    latitude: true,
                    longitude: true,
                    assignments: {
                        include: {
                            // Używamy poprawnych nazw relacji z Twojej schemy
                            tattoo_instances: { select: { unique_code: true } },
                            children: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.assignments.findMany({
                where: { user_id: userId },
                take: 4,
                orderBy: { created_at: 'desc' },
                include: {
                    // Używamy poprawnych nazw relacji z Twojej schemy
                    children: { select: { name: true } },
                    tattoo_instances: { select: { unique_code: true } },
                },
            }),
        ]);

        return {
            recentChildren,
            activeTattoosCount,
            recentScans,
            recentAssignments,
        };
    }
}