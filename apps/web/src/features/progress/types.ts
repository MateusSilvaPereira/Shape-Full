export interface ProgressEntry {
  id: string;
  academyId: string;
  studentId: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  waistCm: number | null;
  notes: string | null;
  measuredAt: string;
}

export interface ProgressFormValues {
  studentId: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  notes?: string;
  measuredAt?: string;
}
