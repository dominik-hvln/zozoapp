import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadsService {
    private supabase: SupabaseClient;
    private readonly bucketName: string;
    constructor(private prisma: PrismaService) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new InternalServerErrorException('Supabase URL or key not configured.');
        }
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'avatars';
    }

    async uploadAvatar(file: Express.Multer.File, userId: string, childId?: string) {
        // Unikalna ścieżka pliku
        const filePath = `${userId}/${childId || 'profile'}-${Date.now()}`;

        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            console.error('[UPLOAD][AVATAR] Supabase upload error:', error);
            throw new InternalServerErrorException(`Nie udało się wgrać awatara: ${error.message}`);
        }

        const { data: { publicUrl } } = this.supabase.storage.from(this.bucketName).getPublicUrl(data.path);

        if (childId) {
            await this.prisma.children.updateMany({
                where: { id: childId, user_id: userId },
                data: { avatar_url: publicUrl },
            });
        } else {
            await this.prisma.users.update({
                where: { id: userId },
                data: { avatar_url: publicUrl },
            });
        }

        return { url: publicUrl };
    }

    async uploadProductImage(file: Express.Multer.File, productId: string) {
        const filePath = `products/${productId}-${Date.now()}`;

        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

        if (error) {
            console.error('[UPLOAD][PRODUCT] Supabase upload error:', error);
            throw new InternalServerErrorException(`Nie udało się wgrać zdjęcia produktu: ${error.message}`);
        }

        const { data: { publicUrl } } = this.supabase.storage.from(this.bucketName).getPublicUrl(data.path);

        await this.prisma.products.update({
            where: { id: productId },
            data: { image_url: publicUrl },
        });

        return { url: publicUrl };
    }
}