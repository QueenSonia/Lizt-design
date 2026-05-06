export type UserRole = "landlord" | "facility-manager" | "admin" | "";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole;
}
