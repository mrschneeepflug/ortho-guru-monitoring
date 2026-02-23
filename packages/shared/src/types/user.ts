export type DoctorRole = 'ADMIN' | 'DOCTOR' | 'HYGIENIST';

export interface User {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  role: DoctorRole;
  credentials: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: DoctorRole;
  practiceId: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  practiceId: string;
}
