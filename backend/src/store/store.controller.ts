import { Controller, Get, UseGuards } from '@nestjs/common';
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
}