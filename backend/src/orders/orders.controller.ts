import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('success')
    processOrder(@Body('sessionId') sessionId: string, @Request() req) {
        return this.ordersService.processSuccessfulOrder(sessionId, req.user.userId);
    }

    @Get(':id')
    getOrder(@Param('id') orderId: string, @Request() req) {
        return this.ordersService.getOrderDetails(orderId, req.user.userId);
    }
}