export interface Practice {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  subscriptionTier: string;
  taggingRate: number;
  discountPercent: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'HYGIENIST';
  credentials: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  practiceId: string;
  doctorId: string;
  name: string;
  dateOfBirth: string | null;
  treatmentType: string | null;
  alignerBrand: string | null;
  currentStage: number;
  totalStages: number | null;
  scanFrequency: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED';
  createdAt: string;
  updatedAt: string;
}

export interface ScanSession {
  id: string;
  patientId: string;
  status: 'PENDING' | 'REVIEWED' | 'FLAGGED';
  imageCount: number;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { name: string };
  images?: ScanImage[];
  tagSet?: TagSet | null;
}

export interface ScanImage {
  id: string;
  sessionId: string;
  imageType: 'FRONT' | 'LEFT' | 'RIGHT' | 'UPPER_OCCLUSAL' | 'LOWER_OCCLUSAL';
  s3Key: string | null;
  thumbnailKey: string | null;
  localPath: string | null;
  qualityScore: number | null;
  createdAt: string;
}

export interface TagSet {
  id: string;
  sessionId: string;
  taggedById: string;
  overallTracking: number;
  alignerFit: number | null;
  oralHygiene: number;
  detailTags: string[];
  actionTaken: string | null;
  notes: string | null;
  aiSuggested: boolean;
  aiOverridden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  id: string;
  patientId: string;
  subject: string;
  isActive: boolean;
  lastMessage?: Message | null;
  unreadCount?: number;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface DashboardSummary {
  pendingScans: number;
  totalPatients: number;
  compliancePercentage: number;
  taggingRate: number;
}

export interface ComplianceStats {
  totalActive: number;
  onTimeCount: number;
  overdueCount: number;
  compliancePercentage: number;
  overduePatients: Array<{ id: string; name: string; daysSinceLastScan: number | null }>;
}

export interface TagAnalytics {
  taggingRate: number;
  discountPercent: number;
  totalSessions: number;
  taggedSessions: number;
  period: string;
}
