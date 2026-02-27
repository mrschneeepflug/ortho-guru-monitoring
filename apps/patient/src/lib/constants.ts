export const IMAGE_TYPE_LABELS: Record<string, string> = {
  FRONT: 'Front',
  LEFT: 'Left',
  RIGHT: 'Right',
  UPPER_OCCLUSAL: 'Upper Occlusal',
  LOWER_OCCLUSAL: 'Lower Occlusal',
};

export const IMAGE_TYPES = [
  'FRONT',
  'LEFT',
  'RIGHT',
  'UPPER_OCCLUSAL',
  'LOWER_OCCLUSAL',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  PENDING: 'Pending Review',
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

export const ANGLE_INSTRUCTIONS: Record<string, { title: string; description: string }> = {
  FRONT: {
    title: 'Front View',
    description: 'Smile wide and take a photo straight on, showing all your front teeth.',
  },
  LEFT: {
    title: 'Left Side',
    description: 'Turn your head slightly right and capture your left side bite.',
  },
  RIGHT: {
    title: 'Right Side',
    description: 'Turn your head slightly left and capture your right side bite.',
  },
  UPPER_OCCLUSAL: {
    title: 'Upper Teeth',
    description: 'Tilt your head back and photograph the biting surface of your upper teeth.',
  },
  LOWER_OCCLUSAL: {
    title: 'Lower Teeth',
    description: 'Tilt your head forward and photograph the biting surface of your lower teeth.',
  },
};
