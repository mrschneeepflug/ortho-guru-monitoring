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

export interface DiscountTier {
  minRate: number;
  maxRate: number;
  discount: number;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minRate: 0, maxRate: 49.99, discount: 0 },
  { minRate: 50, maxRate: 69.99, discount: 10 },
  { minRate: 70, maxRate: 84.99, discount: 20 },
  { minRate: 85, maxRate: 100, discount: 30 },
];
