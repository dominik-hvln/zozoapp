import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [MailModule],
  controllers: [StoreController],
  providers: [StoreService]
})
export class StoreModule {}
