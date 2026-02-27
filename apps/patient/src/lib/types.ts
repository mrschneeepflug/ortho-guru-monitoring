export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  treatmentType: string | null;
  alignerBrand: string | null;
  currentStage: number;
  totalStages: number | null;
  scanFrequency: number;
  status: string;
  doctorName: string;
  lastScanDate: string | null;
  nextScanDue: string | null;
}

export interface ScanSession {
  id: string;
  patientId: string;
  status: 'PENDING' | 'REVIEWED' | 'FLAGGED';
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  images?: ScanImage[];
}

export interface ScanImage {
  id: string;
  sessionId: string;
  imageType: 'FRONT' | 'LEFT' | 'RIGHT' | 'UPPER_OCCLUSAL' | 'LOWER_OCCLUSAL';
  s3Key: string | null;
  localPath: string | null;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  isActive: boolean;
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderType: 'DOCTOR' | 'PATIENT' | 'SYSTEM';
  senderId: string;
  content: string;
  attachments: unknown[];
  readAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface AuthResponse {
  accessToken: string;
  patient: {
    id: string;
    name: string;
    email: string;
    practiceId: string;
    status: string;
  };
}

export interface InviteValidation {
  valid: boolean;
  patientName: string;
  email: string | null;
}
