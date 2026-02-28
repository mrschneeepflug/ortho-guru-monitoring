import { Test } from '@nestjs/testing';
import { WebhooksListener } from './webhooks.listener';
import { WebhooksService } from './webhooks.service';
import {
  ScanReviewedEvent,
  ScanFlaggedEvent,
  MessageSentEvent,
} from '../notifications/events';

describe('WebhooksListener', () => {
  let listener: WebhooksListener;
  let webhooksService: { send: jest.Mock };

  beforeEach(async () => {
    webhooksService = { send: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        WebhooksListener,
        { provide: WebhooksService, useValue: webhooksService },
      ],
    }).compile();

    listener = module.get(WebhooksListener);
  });

  describe('handleScanReviewed', () => {
    it('should forward scan.reviewed event to webhooks service', async () => {
      const event = new ScanReviewedEvent('session-1', 'patient-1');

      await listener.handleScanReviewed(event);

      expect(webhooksService.send).toHaveBeenCalledWith('scan.reviewed', {
        sessionId: 'session-1',
        patientId: 'patient-1',
      });
    });
  });

  describe('handleScanFlagged', () => {
    it('should forward scan.flagged event to webhooks service', async () => {
      const event = new ScanFlaggedEvent('session-2', 'patient-2');

      await listener.handleScanFlagged(event);

      expect(webhooksService.send).toHaveBeenCalledWith('scan.flagged', {
        sessionId: 'session-2',
        patientId: 'patient-2',
      });
    });
  });

  describe('handleMessageSent', () => {
    it('should forward message.sent event with preview to webhooks service', async () => {
      const event = new MessageSentEvent('thread-1', 'patient-3', 'Hello there');

      await listener.handleMessageSent(event);

      expect(webhooksService.send).toHaveBeenCalledWith('message.sent', {
        threadId: 'thread-1',
        patientId: 'patient-3',
        preview: 'Hello there',
      });
    });
  });
});
