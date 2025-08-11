import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { TattoosService } from './tattoos.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tattoos')
export class TattoosController {
    constructor(private readonly tattoosService: TattoosService) {}

    @Post('activate')
    activate(@Body() body: { uniqueCode: string; childId: string }, @Request() req) {
        const userId = req.user.userId;
        return this.tattoosService.activateTattoo(body.uniqueCode, body.childId, userId);
    }

    @Get()
    findAll(@Request() req) {
        const userId = req.user.userId;
        return this.tattoosService.findAllForUser(userId);
    }
}