import { Body, Controller, Get, Post, UseGuards, Param, Res } from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { Response } from 'express';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('users')
    getUsers() {
        return this.adminService.getAllUsers();
    }

    @Get('users/:id')
    getUserDetails(@Param('id') userId: string) {
        return this.adminService.getUserDetails(userId);
    }

    @Post('tattoos/generate')
    generateTattoos(@Body('count') count: number) {
        const safeCount = Math.max(1, Math.min(count || 10, 500));
        return this.adminService.generateAndStoreRandomCodes(safeCount);
    }

    @Get('assignments')
    getAssignments() {
        return this.adminService.getActiveAssignments();
    }

    @Post('assignments/:id/deactivate')
    deactivateAssignment(@Param('id') assignmentId: string) {
        return this.adminService.deactivateAssignment(assignmentId);
    }

    @Get('tattoos/new')
    getNewTattoos() {
        return this.adminService.getNewTattooCodes();
    }

    @Get('stats')
    getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('products')
    getProducts() {
        return this.adminService.getAllProducts();
    }

    @Post('products')
    createProduct(@Body() body: { name: string, description?: string, price: number }) {
        return this.adminService.createProduct(body);
    }

    @Post('products/:id/variants')
    addVariant(@Param('id') productId: string, @Body() body: { quantity: number; price: number; }) {
        return this.adminService.addVariantToProduct(productId, body);
    }

    @Get('tattoos/:id/qr-content')
    getTattooQrCodeContent(@Param('id') tattooId: string) {
        return this.adminService.getQrCodeContentForTattoo(tattooId);
    }
}