import { Body, Controller, Get, Post, Request, UseGuards, Put, Delete, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChildrenService } from './children.service';

@UseGuards(JwtAuthGuard)
@Controller('api/children')
export class ChildrenController {
    constructor(private readonly childrenService: ChildrenService) {}

    @Post()
    create(@Body('name') name: string, @Request() req) {
        const userId = req.user.userId;
        return this.childrenService.create(name, userId);
    }

    @Get()
    findAll(@Request() req) {
        const userId = req.user.userId;
        return this.childrenService.findAllForUser(userId);
    }

    @Put(':id')
    update(@Param('id') childId: string, @Body('name') name: string, @Request() req) {
        const userId = req.user.userId;
        return this.childrenService.update(childId, name, userId);
    }

    @Delete(':id')
    remove(@Param('id') childId: string, @Request() req) {
        const userId = req.user.userId;
        return this.childrenService.remove(childId, userId);
    }
}