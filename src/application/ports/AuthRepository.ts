import { User } from '@domain/entities/User';

/**
 * Port for authentication. The infrastructure layer provides the implementation.
 */
export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listAll(): Promise<User[]>;
  update(id: string, patch: Partial<User>): Promise<User>;
}
