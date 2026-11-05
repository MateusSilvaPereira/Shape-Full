export interface AcademySettings {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  primaryColor: string;
  status: string;
  createdAt: string;
}

export interface UpdateAcademyInput {
  name?: string;
  email?: string;
  phone?: string;
  primaryColor?: string;
}
