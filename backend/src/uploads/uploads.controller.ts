import { Controller, Post, UploadedFile, UseInterceptors, Request, Body, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post('avatar')
    @UseInterceptors(FileInterceptor('file'))
    uploadAvatar(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Request() req,
        @Body('childId') childId?: string,
    ) {
        return this.uploadsService.uploadAvatar(file, req.user.userId, childId);
    }

    @Post('product/:productId')
    @UseInterceptors(FileInterceptor('file'))
    uploadProductImage(
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
            ],
        })) file: Express.Multer.File,
        @Param('productId') productId: string,
    ) {
        return this.uploadsService.uploadProductImage(file, productId);
    }
}