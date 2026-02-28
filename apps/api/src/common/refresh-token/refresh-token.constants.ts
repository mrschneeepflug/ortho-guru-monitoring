export const REFRESH_TOKEN_CONFIG = {
  doctor: {
    accessTokenExpiry: '15m',
    refreshTokenTtlSeconds: 7 * 24 * 60 * 60, // 7 days
    familyMaxSeconds: 30 * 24 * 60 * 60, // 30 days
    cookieName: 'ortho_refresh',
    cookiePath: '/api/v1/auth',
  },
  patient: {
    accessTokenExpiry: '1h',
    refreshTokenTtlSeconds: 30 * 24 * 60 * 60, // 30 days
    familyMaxSeconds: 90 * 24 * 60 * 60, // 90 days
    cookieName: 'patient_refresh',
    cookiePath: '/api/v1/patient-auth',
  },
} as const;

export type UserType = 'doctor' | 'patient';
