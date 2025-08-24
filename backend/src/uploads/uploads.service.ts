import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadsService {
    private supabase: SupabaseClient;
    constructor(private prisma: PrismaService) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new InternalServerErrorException('Supabase URL or Anon Key not configured.');
        }
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }

    async uploadAvatar(file: Express.Multer.File, userId: string, childId?: string) {
        // Unikalna ścieżka pliku
        const filePath = `${userId}/${childId || 'profile'}-${Date.now()}`;

        const { data, error } = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
            });

        if (error) {
            throw new InternalServerErrorException('Nie udało się wgrać awatara.');
        }

        const { data: { publicUrl } } = this.supabase.storage.from('avatars').getPublicUrl(data.path);

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
}