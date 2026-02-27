export const TAG_LABELS: Record<number, string> = {
  1: 'Good',
  2: 'Fair',
  3: 'Poor',
};

export const TAG_COLORS: Record<number, string> = {
  1: 'bg-tag-green text-white',
  2: 'bg-tag-yellow text-black',
  3: 'bg-tag-red text-white',
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  FLAGGED: 'Flagged',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  DROPPED: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-orange-100 text-orange-800',
  REVIEWED: 'bg-green-100 text-green-800',
  FLAGGED: 'bg-red-100 text-red-800',
};

export const IMAGE_TYPE_LABELS: Record<string, string> = {
  FRONT: 'Front',
  LEFT: 'Left',
  RIGHT: 'Right',
  UPPER_OCCLUSAL: 'Upper Occlusal',
  LOWER_OCCLUSAL: 'Lower Occlusal',
};

export { DETAIL_TAG_OPTIONS } from 'shared';
