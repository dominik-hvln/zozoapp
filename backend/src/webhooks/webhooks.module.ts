import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { EventsModule } from 'src/events/events.module';
import { MailModule } from 'src/mail/mail.module';
import { InpostService } from 'src/store/inpost.service';

@Module({
    imports: [
        EventsModule,
        MailModule
    ],
  controllers: [WebhooksController],
  providers: [WebhooksService, InpostService]
})
export class WebhooksModule {}
