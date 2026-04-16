export type UserRole = "landlord" | "";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole;
}
