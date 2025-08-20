import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ScansService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) {}

    private calculateAge(dob: Date | null): number | null {
        if (!dob) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    async processScan(uniqueCode: string, ip: string, userAgent: string) {
        const assignment = await this.prisma.assignments.findFirst({
            where: {
                is_active: true,
                tattoo_instances: { unique_code: uniqueCode, status: 'active' },
            },
            include: { children: true, users: true },
        });

        if (!assignment) {
            throw new NotFoundException('Nie znaleziono aktywnego tatuażu dla tego kodu.');
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
            child: {
                name: assignment.children.name,
                age: this.calculateAge(assignment.children.date_of_birth),
                avatar_url: assignment.children.avatar_url,
                important_info: assignment.children.important_info,
                illnesses: assignment.children.illnesses,
                allergies: assignment.children.allergies,
            },
            parent: {
                fullName: `${assignment.users.first_name || ''} ${assignment.users.last_name || ''}`.trim(),
                phone: assignment.users.phone,
            }
        };
    }

    async addLocationToScan(scanId: string, lat: number, lon: number) {
        return this.prisma.scans.update({
            where: { id: scanId },
            data: { latitude: lat, longitude: lon },
        });
    }
}