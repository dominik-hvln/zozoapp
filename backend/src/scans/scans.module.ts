import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { MailModule } from 'src/mail/mail.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
    imports: [MailModule, NotificationsModule],
  controllers: [ScansController],
  providers: [ScansService]
})
export class ScansModule {}
