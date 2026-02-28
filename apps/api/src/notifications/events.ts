export class ScanReviewedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly patientId: string,
  ) {}
}

export class ScanFlaggedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly patientId: string,
  ) {}
}

export class MessageSentEvent {
  constructor(
    public readonly threadId: string,
    public readonly patientId: string,
    public readonly preview: string,
  ) {}
}
