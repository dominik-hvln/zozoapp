import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [MailModule],
  controllers: [ScansController],
  providers: [ScansService]
})
export class ScansModule {}
