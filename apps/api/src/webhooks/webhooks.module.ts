import { Global, Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksListener } from './webhooks.listener';

@Global()
@Module({
  providers: [WebhooksService, WebhooksListener],
  exports: [WebhooksService],
})
export class WebhooksModule {}
