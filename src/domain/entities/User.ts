import { RoleId } from './Role';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: RoleId;
  /** For demo purposes only — a real system would never store plain passwords. */
  passwordHash: string;
  createdAt: string;
  isActive: boolean;
}
