export type PatientStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED';

export interface Patient {
  id: string;
  practiceId: string;
  doctorId: string;
  name: string;
  dateOfBirth: string | null;
  treatmentType: string | null;
  alignerBrand: string | null;
  currentStage: number;
  totalStages: number | null;
  scanFrequency: number;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}
