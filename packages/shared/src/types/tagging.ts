export interface TagSet {
  id: string;
  sessionId: string;
  taggedById: string;
  overallTracking: number; // 1-3: good, fair, poor
  alignerFit: number | null; // 1-3: good, fair, poor (null for non-aligner)
  oralHygiene: number; // 1-3: good, fair, poor
  detailTags: string[];
  actionTaken: string | null;
  notes: string | null;
  aiSuggested: boolean;
  aiOverridden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagAnalytics {
  taggingRate: number;
  discountPercent: number;
  totalSessions: number;
  taggedSessions: number;
  period: string;
}

