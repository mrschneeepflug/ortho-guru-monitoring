export type SenderType = 'DOCTOR' | 'PATIENT' | 'SYSTEM';

export interface MessageThread {
  id: string;
  patientId: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  attachments: unknown[];
  readAt: string | null;
  createdAt: string;
}
