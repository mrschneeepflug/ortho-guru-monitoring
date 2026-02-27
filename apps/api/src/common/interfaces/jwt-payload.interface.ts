export interface DoctorJwtPayload {
  sub: string; // doctorId
  email: string;
  role: string;
  practiceId: string;
  type: 'doctor';
}

export interface PatientJwtPayload {
  sub: string; // patientId
  patientId: string;
  email: string;
  practiceId: string;
  type: 'patient';
}

export type JwtPayload = DoctorJwtPayload | PatientJwtPayload;

export function isDoctorPayload(p: JwtPayload): p is DoctorJwtPayload {
  return p.type === 'doctor' || !('type' in p); // backward compat for old tokens
}

export function isPatientPayload(p: JwtPayload): p is PatientJwtPayload {
  return p.type === 'patient';
}
