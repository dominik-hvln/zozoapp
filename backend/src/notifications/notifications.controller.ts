import { Body, Controller, Get, Param, Patch, Request, UseGuards, Req, Post } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    findAll(@Request() req) {
        return this.notificationsService.findAllForUser(req.user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.notificationsService.getUnreadCount(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') notificationId: string, @Request() req) {
        return this.notificationsService.markAsRead(notificationId, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register-device')
    async registerDevice(@Body() registerDeviceDto: RegisterDeviceDto, @Req() req: Request) {
        const userId = (req as any).user.userId;
        console.log(`[NOTIFICATIONS] Rejestracja urządzenia dla użytkownika: ${userId}`);
        console.log(`[NOTIFICATIONS] Token FCM: ${registerDeviceDto.token.substring(0, 20)}...`);

        try {
            await this.notificationsService.saveToken(userId, registerDeviceDto.token);
            console.log(`[NOTIFICATIONS] Pomyślnie zarejestrowano urządzenie dla użytkownika: ${userId}`);
            return { success: true, message: 'Device token registered successfully' };
        } catch (error) {
            console.error(`[NOTIFICATIONS] Błąd podczas rejestracji urządzenia:`, error);
            throw error;
        }
    }
}