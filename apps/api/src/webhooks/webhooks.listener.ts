import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';
import {
  ScanReviewedEvent,
  ScanFlaggedEvent,
  MessageSentEvent,
} from '../notifications/events';

@Injectable()
export class WebhooksListener {
  private readonly logger = new Logger(WebhooksListener.name);

  constructor(private readonly webhooks: WebhooksService) {}

  @OnEvent('scan.reviewed')
  async handleScanReviewed(event: ScanReviewedEvent) {
    this.logger.debug(`Forwarding scan.reviewed: session=${event.sessionId}`);
    await this.webhooks.send('scan.reviewed', {
      sessionId: event.sessionId,
      patientId: event.patientId,
    });
  }

  @OnEvent('scan.flagged')
  async handleScanFlagged(event: ScanFlaggedEvent) {
    this.logger.debug(`Forwarding scan.flagged: session=${event.sessionId}`);
    await this.webhooks.send('scan.flagged', {
      sessionId: event.sessionId,
      patientId: event.patientId,
    });
  }

  @OnEvent('message.sent')
  async handleMessageSent(event: MessageSentEvent) {
    this.logger.debug(`Forwarding message.sent: thread=${event.threadId}`);
    await this.webhooks.send('message.sent', {
      threadId: event.threadId,
      patientId: event.patientId,
      preview: event.preview,
    });
  }
}
