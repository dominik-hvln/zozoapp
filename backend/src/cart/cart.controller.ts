import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    getCart(@Request() req) {
        return this.cartService.getCart(req.user.userId);
    }

    @Post('items')
    addItem(@Request() req, @Body() body: { productId: string; quantity: number, image_url: string }) {
        return this.cartService.addItem(req.user.userId, body.productId, body.quantity, body.image_url);
    }

    @Put('items/:itemId')
    updateItem(@Request() req, @Param('itemId') itemId: string, @Body() body: { quantity: number }) {
        return this.cartService.updateItemQuantity(req.user.userId, itemId, body.quantity);
    }

    @Delete('items/:itemId')
    removeItem(@Request() req, @Param('itemId') itemId: string) {
        return this.cartService.removeItem(req.user.userId, itemId);
    }
}