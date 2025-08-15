import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) {}

    @UseGuards(JwtAuthGuard)
    @Get('products')
    getProducts() {
        return this.storeService.getAvailableProducts();
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/subscription')
    createSubscriptionCheckout(@Request() req) {
        return this.storeService.createSubscriptionCheckoutSession(req.user.userId);
    }
}