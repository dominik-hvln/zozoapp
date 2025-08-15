import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get('me')
    getProfile(@Request() req) {
        return this.profileService.getProfile(req.user.userId);
    }

    @Patch('me')
    updateProfile(@Request() req, @Body() body: { firstName: string, lastName: string, phone: string }) {
        return this.profileService.updateProfile(req.user.userId, body);
    }

    @Post('me/change-password')
    changePassword(@Request() req, @Body() body: { oldPass: string, newPass: string }) {
        return this.profileService.changePassword(req.user.userId, body.oldPass, body.newPass);
    }
}