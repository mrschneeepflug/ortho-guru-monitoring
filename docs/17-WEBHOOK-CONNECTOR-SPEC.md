# OrthoMonitor → Bissig-Copilot Webhook Connector Spec

This document specifies the outbound webhook contract from OrthoMonitor, intended as the build spec for the receiving connector in the Bissig-Copilot repository.

---

## Overview

OrthoMonitor sends outbound webhooks whenever clinically relevant events occur (scan reviewed, scan flagged, message sent). The Copilot-side connector must receive these webhooks, verify the HMAC signature, and route them into Copilot's internal event system.

```
OrthoMonitor                              Bissig-Copilot
──────────                              ──────────────
ScansService emits event
       │
       ▼
WebhooksListener ──► WebhooksService
                         │
                    POST /api/webhooks/ortho-monitor
                    X-Webhook-Signature: sha256=<hex>
                    X-Webhook-Id: <uuid>
                    Content-Type: application/json
                         │
                         ▼
                   Connector receives ──► signature check
                                         ──► parse event
                                         ──► route internally
```

---

## Endpoint

| Field | Value |
|-------|-------|
| Method | `POST` |
| Path | `/api/webhooks/ortho-monitor` |
| Auth | Anonymous (signature-validated, no bearer token) |
| Content-Type | `application/json` |

The connector should expose this endpoint as part of Copilot's existing API routes. The `ortho-monitor` segment is the system name used in the `WEBHOOK_COPILOT_URL` config on the OrthoMonitor side.

---

## Headers

| Header | Format | Description |
|--------|--------|-------------|
| `X-Webhook-Signature` | `sha256=<64-char lowercase hex>` | HMAC-SHA256 of the raw JSON request body, computed with the shared secret. Always prefixed with `sha256=`. |
| `X-Webhook-Id` | UUID v4 (e.g. `550e8400-e29b-41d4-a716-446655440000`) | Unique idempotency key per delivery attempt. Same value across retries of the same event. |
| `Content-Type` | `application/json` | Always present. |

---

## Signature Verification

OrthoMonitor signs the **raw JSON body** (not parsed/re-serialized) using HMAC-SHA256 with a shared secret.

### Signing algorithm (OrthoMonitor side — for reference)

```typescript
import { createHmac } from 'crypto';

const signature = createHmac('sha256', WEBHOOK_COPILOT_SECRET)
  .update(rawJsonBody)
  .digest('hex');

// Sent as header: X-Webhook-Signature: sha256=<signature>
```

### Verification algorithm (Copilot side — to implement)

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifySignature(rawBody: string | Buffer, headerValue: string, secret: string): boolean {
  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const received = headerValue.replace(/^sha256=/, '');

  if (expected.length !== received.length) return false;

  return timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex'),
  );
}
```

**Important:** Use `timingSafeEqual` to prevent timing attacks. Verify against the raw request body bytes, not a re-serialized object.

### Response on invalid signature

Return `401 Unauthorized` with no body. Do not process the event.

---

## Request Body

All webhook payloads share the same envelope:

```json
{
  "event": "<event-type>",
  "timestamp": "2026-02-28T14:30:00.000Z",
  "webhookId": "550e8400-e29b-41d4-a716-446655440000",
  "data": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `event` | `string` | Event discriminator. One of the event types listed below. |
| `timestamp` | `string` (ISO 8601) | When the event was emitted by OrthoMonitor. |
| `webhookId` | `string` (UUID v4) | Same value as `X-Webhook-Id` header. Use for idempotency. |
| `data` | `object` | Event-specific payload. Shape varies by event type. |

The `event` field serves as the event discriminator. Copilot's `EventTypeMapping` config should map these to internal event types.

---

## Event Types

### `scan.reviewed`

Emitted when a doctor reviews a patient's scan session (adds a tag set).

```json
{
  "event": "scan.reviewed",
  "timestamp": "2026-02-28T14:30:00.000Z",
  "webhookId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "sessionId": "clxyz123abc",
    "patientId": "clxyz456def"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data.sessionId` | `string` | The scan session that was reviewed (OrthoMonitor `ScanSession.id`). |
| `data.patientId` | `string` | The patient who owns the scan (OrthoMonitor `Patient.id`). |

---

### `scan.flagged`

Emitted when a doctor flags a scan session as needing patient attention.

```json
{
  "event": "scan.flagged",
  "timestamp": "2026-02-28T14:30:00.000Z",
  "webhookId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "sessionId": "clxyz123abc",
    "patientId": "clxyz456def"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data.sessionId` | `string` | The flagged scan session. |
| `data.patientId` | `string` | The patient who owns the scan. |

---

### `message.sent`

Emitted when a doctor sends a message to a patient via the in-app messaging system.

```json
{
  "event": "message.sent",
  "timestamp": "2026-02-28T14:30:00.000Z",
  "webhookId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "threadId": "clxyz789ghi",
    "patientId": "clxyz456def",
    "preview": "Please schedule a follow-up appointment."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data.threadId` | `string` | The message thread (OrthoMonitor `MessageThread.id`). |
| `data.patientId` | `string` | The patient the message was sent to. |
| `data.preview` | `string` | Text preview of the message content. |

---

## Response Contract

The connector should respond promptly. OrthoMonitor uses a 10-second timeout per attempt.

| Status | Meaning | OrthoMonitor behavior |
|--------|---------|-----------------------|
| `200-299` | Success | Delivery confirmed. No further action. |
| `400-499` (except 429) | Client error (bad request, unauthorized, etc.) | **No retry.** Logged as warning on OrthoMonitor side. |
| `429` | Rate limited | Retried (up to 3 retries). |
| `500-599` | Server error | Retried (up to 3 retries). |

### Retry behavior (OrthoMonitor side — for awareness)

- Max 3 retries (4 total attempts) with exponential backoff: 1s → 3s → 9s
- Same `X-Webhook-Id` across all retry attempts for the same event
- Fire-and-forget: OrthoMonitor does not persist failed deliveries or offer replay

### Recommended responses

- `200 OK` on successful processing
- `401 Unauthorized` on signature verification failure
- `429 Too Many Requests` if rate limiting is needed (will be retried)
- `500 Internal Server Error` on transient failures (will be retried)

---

## Idempotency

The `webhookId` (present in both the body and `X-Webhook-Id` header) uniquely identifies each event. The same `webhookId` may arrive multiple times due to retries.

The connector **should** track recently seen `webhookId` values (e.g., in a TTL cache or database) and skip duplicate processing. A 1-hour TTL window is sufficient given the retry schedule.

---

## Configuration

The following shared secrets must be configured on both sides:

| Side | Variable | Description |
|------|----------|-------------|
| OrthoMonitor | `WEBHOOK_COPILOT_URL` | Full URL to the connector endpoint, e.g. `https://copilot.example.com/api/webhooks/ortho-monitor` |
| OrthoMonitor | `WEBHOOK_COPILOT_SECRET` | Shared HMAC signing secret |
| Copilot | (your choice) | The same shared secret for signature verification |

Generate a strong secret (e.g., `openssl rand -hex 32`) and keep it identical on both sides.

---

## EventTypeMapping (Copilot side)

The connector should map OrthoMonitor event names to Copilot's internal event types. Suggested config structure:

```typescript
const EventTypeMapping: Record<string, string> = {
  'scan.reviewed': 'ORTHO_SCAN_REVIEWED',
  'scan.flagged':  'ORTHO_SCAN_FLAGGED',
  'message.sent':  'ORTHO_MESSAGE_SENT',
};
```

Unknown event types should be logged and ignored (not rejected), so that new events can be added to OrthoMonitor without breaking the connector.

---

## Testing

### Manual testing with curl

```bash
SECRET="your-shared-secret"
BODY='{"event":"scan.reviewed","timestamp":"2026-02-28T14:30:00.000Z","webhookId":"test-001","data":{"sessionId":"s1","patientId":"p1"}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/api/webhooks/ortho-monitor \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -H "X-Webhook-Id: test-001" \
  -d "$BODY"
```

### Test cases for the connector

1. **Valid signature** → `200`, event processed
2. **Invalid signature** → `401`, event not processed
3. **Missing signature header** → `401`
4. **Unknown event type** → `200` (log and ignore, don't reject)
5. **Duplicate `webhookId`** → `200` (idempotent, skip re-processing)
6. **Malformed JSON body** → `400`

---

## Future Considerations

- Additional event types may be added (e.g., `patient.registered`, `invite.sent`). The connector should gracefully ignore unknown events.
- If delivery reliability becomes critical, OrthoMonitor may add a dead-letter queue and replay endpoint. The idempotency key contract ensures this is backwards-compatible.
- Webhook payload `data` fields may be extended with additional properties. The connector should not reject unknown fields.
