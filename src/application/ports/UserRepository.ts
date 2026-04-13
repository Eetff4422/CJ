import { User } from '@domain/entities/User';

/**
 * Extends the read-only AuthRepository concept with write operations
 * needed by registration flows.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, patch: Partial<User>): Promise<User>;
  listAll(): Promise<User[]>;
}
