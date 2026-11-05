export type RecordStatus = "ACTIVE" | "INACTIVE" | "PENDING";
export type StaffRole = "ACADEMY_ADMIN" | "TRAINER" | "NUTRITIONIST" | "RECEPTIONIST";

export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  status: RecordStatus;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ProfessionalFormValues {
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
}

export interface CreateProfessionalResult {
  professional: Professional;
  tempPassword: string;
  emailSent: boolean;
}
