export const USER_ROLES = ['SUPER_ADMIN','ACADEMY_ADMIN','TRAINER','NUTRITIONIST','RECEPTIONIST','STUDENT'] as const;
export type UserRole = typeof USER_ROLES[number];
export const STAFF_ROLES: UserRole[] = ['SUPER_ADMIN','ACADEMY_ADMIN','TRAINER','NUTRITIONIST','RECEPTIONIST'];
export const APP_NAME = 'Shape Full';

export interface AcademyBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  academyId: string | null;
  phone: string | null;
  avatarUrl: string | null;
}
