import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';

@Injectable()
export class WebhooksService implements OnModuleInit {
  private readonly logger = new Logger(WebhooksService.name);
  private url: string | null = null;
  private secret: string | null = null;

  onModuleInit() {
    const url = process.env.WEBHOOK_COPILOT_URL;
    const secret = process.env.WEBHOOK_COPILOT_SECRET;

    if (!url || !secret) {
      this.logger.warn(
        'WEBHOOK_COPILOT_URL / WEBHOOK_COPILOT_SECRET not configured — outbound webhooks disabled.',
      );
      return;
    }

    this.url = url;
    this.secret = secret;
    this.logger.log(`Outbound webhooks configured → ${url}`);
  }

  async send(eventType: string, data: Record<string, unknown>): Promise<void> {
    if (!this.url || !this.secret) return;

    const webhookId = randomUUID();
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      webhookId,
      data,
    });

    const signature = this.sign(body);

    await this.dispatch(body, signature, webhookId);
  }

  sign(payload: string): string {
    return createHmac('sha256', this.secret!)
      .update(payload)
      .digest('hex');
  }

  private async dispatch(
    body: string,
    signature: string,
    webhookId: string,
  ): Promise<void> {
    const delays = [1000, 3000, 9000];
    const maxAttempts = 4; // 1 initial + 3 retries

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(this.url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-Id': webhookId,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          this.logger.debug(
            `Webhook delivered: event=${webhookId} status=${response.status}`,
          );
          return;
        }

        // Don't retry client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          this.logger.warn(
            `Webhook rejected (${response.status}): id=${webhookId} — not retrying`,
          );
          return;
        }

        // 5xx or 429 — retry if attempts remain
        if (attempt < maxAttempts) {
          this.logger.warn(
            `Webhook failed (${response.status}): id=${webhookId} — retry ${attempt}/${maxAttempts - 1}`,
          );
          await this.sleep(delays[attempt - 1]);
        } else {
          this.logger.error(
            `Webhook exhausted retries: id=${webhookId} status=${response.status}`,
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts) {
          this.logger.warn(
            `Webhook network error: id=${webhookId} — retry ${attempt}/${maxAttempts - 1}: ${message}`,
          );
          await this.sleep(delays[attempt - 1]);
        } else {
          this.logger.error(
            `Webhook exhausted retries: id=${webhookId} error=${message}`,
          );
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
