import { Controller, Get, Post, Request, UseGuards, Body, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) {}

    @UseGuards(JwtAuthGuard)
    @Get('products')
    getProducts(
        @Query('search') searchTerm?: string,
        @Query('sortBy') sortBy?: 'price' | 'name',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        return this.storeService.getAvailableProducts(searchTerm, sortBy, sortOrder);
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/subscription')
    createSubscriptionCheckout(@Request() req, @Body() body: { platform: 'web' | 'mobile' }) {
        return this.storeService.createSubscriptionCheckoutSession(req.user.userId, body.platform);
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/payment')
    createPaymentCheckout(@Request() req, @Body() body: { items: { priceId: string, quantity: number }[] }) {
        return this.storeService.createOneTimePaymentCheckoutSession(body.items, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('customer-portal')
    createCustomerPortal(@Request() req) {
        return this.storeService.createCustomerPortalSession(req.user.userId);
    }
}