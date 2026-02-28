import { Test } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { createHmac } from 'crypto';

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [WebhooksService],
    }).compile();

    service = module.get(WebhooksService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.WEBHOOK_COPILOT_URL;
    delete process.env.WEBHOOK_COPILOT_SECRET;
  });

  describe('onModuleInit', () => {
    it('should warn and stay disabled when env vars are missing', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
    });

    it('should configure when both env vars are set', () => {
      process.env.WEBHOOK_COPILOT_URL = 'https://copilot.test/api/webhooks/ortho-monitor';
      process.env.WEBHOOK_COPILOT_SECRET = 'test-secret';
      const logSpy = jest.spyOn((service as any).logger, 'log');

      service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('configured'),
      );
    });
  });

  describe('send (unconfigured)', () => {
    it('should no-op without making any HTTP calls', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      service.onModuleInit();

      await service.send('scan.reviewed', { sessionId: 's1', patientId: 'p1' });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('send (configured)', () => {
    beforeEach(() => {
      process.env.WEBHOOK_COPILOT_URL = 'https://copilot.test/api/webhooks/ortho-monitor';
      process.env.WEBHOOK_COPILOT_SECRET = 'test-secret';
      service.onModuleInit();
    });

    it('should POST with correct headers and signature', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 200 }),
      );

      await service.send('scan.reviewed', { sessionId: 's1', patientId: 'p1' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://copilot.test/api/webhooks/ortho-monitor');
      expect(opts!.method).toBe('POST');
      const headers = opts!.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Webhook-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(headers['X-Webhook-Id']).toBeDefined();

      // Verify signature is correct
      const body = opts!.body as string;
      const expectedSig = createHmac('sha256', 'test-secret').update(body).digest('hex');
      expect(headers['X-Webhook-Signature']).toBe(`sha256=${expectedSig}`);

      // Verify body structure
      const parsed = JSON.parse(body);
      expect(parsed.event).toBe('scan.reviewed');
      expect(parsed.data).toEqual({ sessionId: 's1', patientId: 'p1' });
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.webhookId).toBeDefined();
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 400 }),
      );

      await service.send('test.event', { key: 'value' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx errors up to 3 times', async () => {
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 500 }),
      );

      await service.send('test.event', { key: 'value' });

      expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should retry on 429 errors', async () => {
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      const fetchSpy = jest.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(null, { status: 429 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      await service.send('test.event', { key: 'value' });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      const fetchSpy = jest.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      await service.send('test.event', { key: 'value' });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should never throw even after all retries fail', async () => {
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.send('test.event', { key: 'value' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sign', () => {
    it('should produce correct HMAC-SHA256 hex', () => {
      process.env.WEBHOOK_COPILOT_URL = 'https://copilot.test/api/webhooks/ortho-monitor';
      process.env.WEBHOOK_COPILOT_SECRET = 'my-secret';
      service.onModuleInit();

      const payload = '{"event":"test"}';
      const expected = createHmac('sha256', 'my-secret')
        .update(payload)
        .digest('hex');

      expect(service.sign(payload)).toBe(expected);
    });
  });
});
