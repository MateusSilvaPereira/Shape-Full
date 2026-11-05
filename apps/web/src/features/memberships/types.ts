export type MembershipStatus = "ACTIVE" | "PENDING" | "OVERDUE" | "CANCELLED";

export interface Membership {
  id: string;
  academyId: string;
  studentId: string;
  planName: string;
  monthlyPrice: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  student: {
    id: string;
    user: { id: string; name: string; email: string };
  };
}

export interface MembershipFormValues {
  studentId: string;
  planName: string;
  monthlyPrice: number;
  status?: MembershipStatus;
  startDate?: string;
  endDate?: string;
}
