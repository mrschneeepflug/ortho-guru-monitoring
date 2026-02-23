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
