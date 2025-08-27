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

    @Post('register-device')
    async registerDevice(@Body() registerDeviceDto: { token: string }, @Request() req) {
        const userId = (req as any).user.userId;
        console.log(`[NOTIFICATIONS] Otrzymano żądanie rejestracji urządzenia z tokenem: ${registerDeviceDto.token}`);
        // Zapisz token na serwerze
        await this.notificationsService.saveToken(userId, registerDeviceDto.token);

        return { success: true, message: 'Token zarejestrowany pomyślnie' };
    }
}