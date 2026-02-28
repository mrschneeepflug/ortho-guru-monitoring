import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as webPush from 'web-push';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private configured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@orthomonitor.dev';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys not configured — push notifications disabled. ' +
          'Run "npx web-push generate-vapid-keys" and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.',
      );
      return;
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
    this.logger.log('Web push notifications configured');
  }

  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  async subscribe(
    patientId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        patientId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
      update: {
        patientId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });
  }

  async unsubscribe(patientId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { patientId, endpoint },
    });
  }

  async sendToPatient(
    patientId: string,
    payload: { title: string; body: string; url?: string; tag?: string },
  ) {
    if (!this.configured) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { patientId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          )
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              this.logger.log(
                `Removing stale subscription ${sub.endpoint.slice(0, 50)}...`,
              );
              await this.prisma.pushSubscription.delete({
                where: { id: sub.id },
              });
            }
            throw err;
          }),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        `Push: ${failed}/${subscriptions.length} notifications failed for patient ${patientId}`,
      );
    }
  }
}
