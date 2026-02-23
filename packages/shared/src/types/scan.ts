export type ScanStatus = 'PENDING' | 'REVIEWED' | 'FLAGGED';

export type ImageType = 'FRONT' | 'LEFT' | 'RIGHT' | 'UPPER_OCCLUSAL' | 'LOWER_OCCLUSAL';

export interface ScanSession {
  id: string;
  patientId: string;
  status: ScanStatus;
  imageCount: number;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScanImage {
  id: string;
  sessionId: string;
  imageType: ImageType;
  s3Key: string | null;
  thumbnailKey: string | null;
  localPath: string | null;
  qualityScore: number | null;
  createdAt: string;
}
