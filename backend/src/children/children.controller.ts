import { Body, Controller, Get, Post, Put, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChildrenService } from './children.service';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
    constructor(private readonly childrenService: ChildrenService) {}

    @Post()
    create(@Body() data: Prisma.childrenUncheckedCreateInput, @Request() req) {
        // POPRAWKA: Przekazujemy dane i ID użytkownika jako osobne argumenty
        return this.childrenService.create(data, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        const userId = req.user.userId;
        return this.childrenService.findAllForUser(userId);
    }

    @Get(':id')
    findOne(@Param('id') childId: string, @Request() req) {
        return this.childrenService.findOneById(childId, req.user.userId);
    }

    @Put(':id')
    update(@Param('id') childId: string, @Body() data: Prisma.childrenUncheckedUpdateInput, @Request() req) {
        const userId = req.user.userId;
        return this.childrenService.update(childId, data, userId);
    }

    @Delete(':id')
    remove(@Param('id') childId: string, @Request() req) {
        const userId = req.user.userId;
        return this.childrenService.remove(childId, userId);
    }
}