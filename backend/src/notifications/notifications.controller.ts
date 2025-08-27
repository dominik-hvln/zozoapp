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
        console.log(`[NOTIFICATIONS] Otrzymano żądanie rejestracji urządzenia`);
        console.log(`[NOTIFICATIONS] Użytkownik ID: ${userId}`);
        console.log(`[NOTIFICATIONS] Token FCM: ${registerDeviceDto.token.substring(0, 20)}...`);
        console.log(`[NOTIFICATIONS] Pełny token FCM: ${registerDeviceDto.token}`);

        try {
            await this.notificationsService.saveToken(userId, registerDeviceDto.token);
            console.log(`[NOTIFICATIONS] ✅ Pomyślnie zarejestrowano urządzenie dla użytkownika: ${userId}`);
            const response = {
                success: true,
                message: 'Device token registered successfully',
                userId: userId,
                tokenPreview: registerDeviceDto.token.substring(0, 20) + '...'
            };
            console.log(`[NOTIFICATIONS] Odpowiedź do klienta:`, response);
            return response;
        } catch (error) {
            console.error(`[NOTIFICATIONS] ❌ Błąd podczas rejestracji urządzenia:`, error);
            console.error(`[NOTIFICATIONS] Stack trace:`, error.stack);
            throw error;
        }
    }
}