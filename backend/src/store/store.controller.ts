import { Controller, Get, Post, Request, UseGuards, Body, Query, Req } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

class CreateCheckoutDto {
    items: { priceId: string, quantity: number }[];
    platform: 'web' | 'mobile';
    couponCode?: string;
    shippingMethodId: string;
}

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
    createCheckoutSession(@Req() req: Request, @Body() checkoutDto: CreateCheckoutDto) {
        const userId = (req as any).user.userId;

        return this.storeService.createOneTimePaymentCheckoutSession(userId, checkoutDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('customer-portal')
    createCustomerPortal(@Request() req) {
        return this.storeService.createCustomerPortalSession(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('validate-promo')
    validatePromoCode(@Body('code') code: string) {
        return this.storeService.validatePromoCode(code);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shipping')
    getShipping() {
        return this.storeService.getActiveShippingMethods();
    }
}