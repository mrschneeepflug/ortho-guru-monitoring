import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import {
  ScanReviewedEvent,
  ScanFlaggedEvent,
  MessageSentEvent,
} from './events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('scan.reviewed')
  async handleScanReviewed(event: ScanReviewedEvent) {
    this.logger.log(`Scan reviewed: session=${event.sessionId}`);
    await this.notifications.sendToPatient(event.patientId, {
      title: 'Scan Reviewed',
      body: 'Your doctor has reviewed your latest scan. Tap to see the results.',
      url: '/home',
      tag: `scan-${event.sessionId}`,
    });
  }

  @OnEvent('scan.flagged')
  async handleScanFlagged(event: ScanFlaggedEvent) {
    this.logger.log(`Scan flagged: session=${event.sessionId}`);
    await this.notifications.sendToPatient(event.patientId, {
      title: 'Action Needed',
      body: 'Your doctor has flagged your scan and may need you to take action.',
      url: '/home',
      tag: `scan-${event.sessionId}`,
    });
  }

  @OnEvent('message.sent')
  async handleMessageSent(event: MessageSentEvent) {
    this.logger.log(`Message sent: thread=${event.threadId}`);
    await this.notifications.sendToPatient(event.patientId, {
      title: 'New Message',
      body: event.preview,
      url: '/messages',
      tag: `msg-${event.threadId}`,
    });
  }
}
