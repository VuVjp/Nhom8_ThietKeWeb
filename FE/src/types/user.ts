import type { Role } from './rbac';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface UpsertUserPayload {
  fullName: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
}
