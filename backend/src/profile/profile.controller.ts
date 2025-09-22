import { Body, Controller, Get, Patch, Post, Request, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get('me')
    getProfile(@Request() req) {
        return this.profileService.getFullProfile(req.user.userId);
    }

    @Patch('me')
    updateProfile(@Request() req, @Body() body: { firstName: string, lastName: string, avatar_url: string, phone: string }) {
        return this.profileService.updateProfile(req.user.userId, body);
    }

    @Post('me/change-password')
    changePassword(@Request() req, @Body() body: { oldPass: string, newPass: string }) {
        return this.profileService.changePassword(req.user.userId, body.oldPass, body.newPass);
    }

    @Delete('me/delete-account')
    deleteAccount(@Request() req, @Body('password') passwordConfirmation: string) {
        return this.profileService.deleteAccount(req.user.userId, passwordConfirmation);
    }
}