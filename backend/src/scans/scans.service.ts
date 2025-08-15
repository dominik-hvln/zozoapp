import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ScansService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) {}

    async processScan(uniqueCode: string, ip: string, userAgent: string) {
        const assignment = await this.prisma.assignments.findFirst({
            where: {
                is_active: true,
                tattoo_instances: {
                    unique_code: uniqueCode,
                    status: 'active',
                },
            },
            include: {
                children: true,
                users: true,
            },
        });

        if (!assignment) {
            throw new NotFoundException(
                'Nie znaleziono aktywnego tatuażu dla tego kodu.',
            );
        }

        const newScan = await this.prisma.scans.create({
            data: {
                assignment_id: assignment.id,
                ip_address: ip,
                user_agent: userAgent,
            },
        });

        this.mailService.sendScanNotification(
            assignment.users.email,
            assignment.users.first_name ?? 'Opiekunie',
            assignment.children.name,
        );

        return {
            scanId: newScan.id,
            childName: assignment.children.name,
            parentName: assignment.users.first_name,
            parentPhone: assignment.users.phone,
            message: assignment.custom_message,
        };
    }

    async addLocationToScan(scanId: string, lat: number, lon: number) {
        return this.prisma.scans.update({
            where: { id: scanId },
            data: {
                latitude: lat,
                longitude: lon,
            },
        });
    }
}