export type RecordStatus = "ACTIVE" | "INACTIVE" | "PENDING";
export type MembershipStatus = "ACTIVE" | "PENDING" | "OVERDUE" | "CANCELLED";
export type Gender = "FEMALE" | "MALE" | "OTHER";

export interface Membership {
  id: string;
  planName: string;
  monthlyPrice: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  academyId: string;
  birthDate: string | null;
  gender: Gender | null;
  heightCm: number | null;
  goal: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: RecordStatus;
    createdAt: string;
    avatarUrl: string | null;
  };
  memberships: Membership[];
}

export interface StudentFormValues {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  heightCm?: number;
  goal?: string;
  planName?: string;
  monthlyPrice?: number;
}

export interface CreateStudentResult {
  student: Student;
  tempPassword: string;
  emailSent: boolean;
}
