import { describe, it, expect } from 'vitest';
import {
  TAG_SCORES,
  TAG_LABELS,
  TAG_CATEGORIES,
  DETAIL_TAG_OPTIONS,
  IMAGE_TYPES,
  IMAGE_TYPE_LABELS,
  DISCOUNT_TIERS,
} from '../constants/tags';

describe('TAG_SCORES', () => {
  it('should have GOOD=1, FAIR=2, POOR=3', () => {
    expect(TAG_SCORES.GOOD).toBe(1);
    expect(TAG_SCORES.FAIR).toBe(2);
    expect(TAG_SCORES.POOR).toBe(3);
  });
});

describe('TAG_LABELS', () => {
  it('should have labels for all scores', () => {
    expect(TAG_LABELS[1]).toBe('Good');
    expect(TAG_LABELS[2]).toBe('Fair');
    expect(TAG_LABELS[3]).toBe('Poor');
  });
});

describe('DISCOUNT_TIERS', () => {
  it('should have 4 tiers', () => {
    expect(DISCOUNT_TIERS).toHaveLength(4);
  });

  it('should cover the full 0-100 range with no gaps', () => {
    // First tier starts at 0
    expect(DISCOUNT_TIERS[0].minRate).toBe(0);

    // Last tier ends at 100
    expect(DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].maxRate).toBe(100);

    // Each tier's minRate should be close to previous tier's maxRate
    for (let i = 1; i < DISCOUNT_TIERS.length; i++) {
      const prev = DISCOUNT_TIERS[i - 1];
      const curr = DISCOUNT_TIERS[i];
      const gap = curr.minRate - prev.maxRate;
      expect(gap).toBeLessThanOrEqual(0.02); // Allow tiny floating point gap
    }
  });

  it('should have ascending discount values', () => {
    for (let i = 1; i < DISCOUNT_TIERS.length; i++) {
      expect(DISCOUNT_TIERS[i].discount).toBeGreaterThan(DISCOUNT_TIERS[i - 1].discount);
    }
  });

  it('should match expected discount percentages', () => {
    expect(DISCOUNT_TIERS[0].discount).toBe(0);
    expect(DISCOUNT_TIERS[1].discount).toBe(10);
    expect(DISCOUNT_TIERS[2].discount).toBe(20);
    expect(DISCOUNT_TIERS[3].discount).toBe(30);
  });
});

describe('DETAIL_TAG_OPTIONS', () => {
  it('should have 12 options', () => {
    expect(DETAIL_TAG_OPTIONS).toHaveLength(12);
  });

  it('should have no duplicate tags', () => {
    const unique = new Set(DETAIL_TAG_OPTIONS);
    expect(unique.size).toBe(DETAIL_TAG_OPTIONS.length);
  });
});

describe('IMAGE_TYPES', () => {
  it('should have 5 image types', () => {
    expect(IMAGE_TYPES).toHaveLength(5);
  });

  it('should have labels for all types', () => {
    for (const type of IMAGE_TYPES) {
      expect(IMAGE_TYPE_LABELS[type]).toBeDefined();
    }
  });
});

describe('TAG_CATEGORIES', () => {
  it('should have the three scoring categories', () => {
    expect(TAG_CATEGORIES.OVERALL_TRACKING).toBe('overallTracking');
    expect(TAG_CATEGORIES.ALIGNER_FIT).toBe('alignerFit');
    expect(TAG_CATEGORIES.ORAL_HYGIENE).toBe('oralHygiene');
  });
});
