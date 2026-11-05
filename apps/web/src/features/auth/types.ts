import type { AcademyBranding, AuthenticatedUser } from "@fitness360/shared";

export interface SessionResponse {
  user: AuthenticatedUser;
  academy: AcademyBranding | null;
}

export interface LoginResponse extends SessionResponse {
  accessToken: string;
}

export type { AcademyBranding, AuthenticatedUser };
