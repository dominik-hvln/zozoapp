import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

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
}