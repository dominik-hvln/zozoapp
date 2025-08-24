import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
  controllers: [ProfileController],
  providers: [ProfileService]
})
export class ProfileModule {}
