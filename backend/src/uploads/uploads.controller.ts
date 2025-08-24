import { Controller, Post, UploadedFile, UseInterceptors, Request, Body, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post('avatar')
    @UseInterceptors(FileInterceptor('file')) // Przechwytujemy plik o nazwie 'file'
    uploadAvatar(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Max 5MB
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Request() req,
        @Body('childId') childId?: string,
    ) {
        return this.uploadsService.uploadAvatar(file, req.user.userId, childId);
    }
}