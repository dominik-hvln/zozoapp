import { Controller, Get, Post, Request, UseGuards, Body, Query, Req, Param, Injectable, ExecutionContext } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest<TUser = any>(err: any, user: any, info: any, _context: ExecutionContext, _status?: any): TUser {
        if (err || info) {
            return null as TUser;
        }
        return user as TUser;
    }
}

class ShippingAddressDto {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    phoneNumber?: string;
}

class CreateCheckoutDto {
    items: { priceId: string, quantity: number }[];
    platform: 'web' | 'mobile';
    couponCode?: string;
    customerEmail?: string;
    shippingMethodId: string;
    shippingAddress: ShippingAddressDto; // <-- DODANE POLE
    inpostLocker?: {
        id: string;
        name?: string;
        address?: string;
        postcode?: string;
        city?: string;
        raw?: unknown;
    };
}

@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) {}

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

    @Post('checkout/payment')
    @UseGuards(OptionalJwtAuthGuard)
    createCheckoutSession(@Req() req: Request, @Body() checkoutDto: CreateCheckoutDto) {
        const userId = (req as any).user?.userId ?? null;
        return this.storeService.createOneTimePaymentCheckoutSession(userId, checkoutDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('customer-portal')
    createCustomerPortal(@Request() req) {
        return this.storeService.createCustomerPortalSession(req.user.userId);
    }

    @Post('validate-promo')
    validatePromoCode(@Body('code') code: string) {
        return this.storeService.validatePromoCode(code);
    }

    @Get('shipping')
    getShipping() {
        return this.storeService.getActiveShippingMethods();
    }

    @Get('inpost/points')
    getInpostPoints(
        @Query('name') name?: string,
        @Query('type') type?: string,
        @Query('functions') functions?: string,
        @Query('relative_point') relativePoint?: string,
        @Query('relative_post_code') relativePostCode?: string,
        @Query('max_distance') maxDistance?: string,
        @Query('sort_by') sortBy?: string,
        @Query('sort_order') sortOrder?: string,
        @Query('page') page?: string,
        @Query('per_page') perPage?: string,
    ) {
        return this.storeService.getInpostPoints({
            name,
            type,
            functions,
            relative_point: relativePoint,
            relative_post_code: relativePostCode,
            max_distance: maxDistance,
            sort_by: sortBy,
            sort_order: sortOrder,
            page,
            per_page: perPage,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/orders')
    getOrders() {
        return this.storeService.getOrders();
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/orders/:orderId/inpost/shipment')
    getInpostShipment(@Param('orderId') orderId: string) {
        return this.storeService.getInpostShipmentForOrder(orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/orders/:orderId/inpost/label')
    getInpostLabel(
        @Param('orderId') orderId: string,
        @Query('accept') accept?: string,
    ) {
        return this.storeService.getInpostLabelForOrder(orderId, accept);
    }

    @UseGuards(JwtAuthGuard)
    @Post('admin/orders/:orderId/inpost/shipment')
    createInpostShipment(@Param('orderId') orderId: string) {
        return this.storeService.createInpostShipmentForOrder(orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('admin/orders/:orderId/inpost/sync-status')
    syncInpostStatus(@Param('orderId') orderId: string) {
        return this.storeService.syncInpostStatusForOrder(orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('admin/orders/:orderId/inpost/dispatch-order')
    createDispatchOrder(@Param('orderId') orderId: string) {
        return this.storeService.createDispatchOrderForOrder(orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders/by-session/:sessionId')
    getOrderBySessionId(@Param('sessionId') sessionId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.storeService.getAndUpdateOrderBySessionId(sessionId, userId);
    }

    @Get('orders/public/by-session/:sessionId')
    getPublicOrderBySessionId(@Param('sessionId') sessionId: string, @Query('token') token?: string) {
        return this.storeService.getAndUpdateOrderBySessionId(sessionId, undefined, token);
    }
}