import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { EventsModule } from 'src/events/events.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [
        EventsModule,
        MailModule
    ],
  controllers: [WebhooksController],
  providers: [WebhooksService]
})
export class WebhooksModule {}
