import { Body, Controller, Get, Post, UseGuards, Param, Res, Put } from '@nestjs/common';
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

    @Get('tattoos/:id/qr-content')
    getTattooQrCodeContent(@Param('id') tattooId: string) {
        return this.adminService.getQrCodeContentForTattoo(tattooId);
    }

    @Get('products')
    getProducts() {
        return this.adminService.getAllProducts();
    }

    @Post('products')
    createProduct(@Body() body: { name: string, description?: string, categoryIds: string[] }) {
        return this.adminService.createProduct(body);
    }

    @Put('products/:id')
    updateProduct(@Param('id') productId: string, @Body() body: { name?: string, description?: string, isActive?: boolean }) {
        return this.adminService.updateProduct(productId, body);
    }

    @Post('products/:id/variants')
    addVariant(@Param('id') productId: string, @Body() body: { quantity: number; price: number; }) {
        return this.adminService.addVariantToProduct(productId, body);
    }

    @Put('products/variants/:variantId')
    updateVariant(@Param('variantId') variantId: string, @Body() body: { quantity: number; price: number; }) {
        return this.adminService.updateVariant(variantId, body);
    }

    @Get('categories')
    getCategories() {
        return this.adminService.getAllCategories();
    }

    @Post('categories')
    createCategory(@Body('name') name: string) {
        return this.adminService.createCategory(name);
    }
}