/** Single source of truth for tag options used by both backend and frontend */

export const TAG_SCORES = {
  GOOD: 1,
  FAIR: 2,
  POOR: 3,
} as const;

export const TAG_LABELS: Record<number, string> = {
  [TAG_SCORES.GOOD]: 'Good',
  [TAG_SCORES.FAIR]: 'Fair',
  [TAG_SCORES.POOR]: 'Poor',
};

export const TAG_CATEGORIES = {
  OVERALL_TRACKING: 'overallTracking',
  ALIGNER_FIT: 'alignerFit',
  ORAL_HYGIENE: 'oralHygiene',
} as const;

export const DETAIL_TAG_OPTIONS = [
  'Attachment missing',
  'Aligner not seating',
  'Spacing issue',
  'Crowding',
  'Open bite',
  'Crossbite',
  'Gingival inflammation',
  'Plaque buildup',
  'Decalcification',
  'Elastic wear compliance',
  'IPR needed',
  'Refinement needed',
] as const;

export const IMAGE_TYPES = [
  'FRONT',
  'LEFT',
  'RIGHT',
  'UPPER_OCCLUSAL',
  'LOWER_OCCLUSAL',
] as const;

export const IMAGE_TYPE_LABELS: Record<string, string> = {
  FRONT: 'Front',
  LEFT: 'Left',
  RIGHT: 'Right',
  UPPER_OCCLUSAL: 'Upper Occlusal',
  LOWER_OCCLUSAL: 'Lower Occlusal',
};
