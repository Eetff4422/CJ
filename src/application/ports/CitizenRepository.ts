import { Citizen } from '@domain/entities/Citizen';

export interface CitizenRepository {
  findById(id: string): Promise<Citizen | null>;
  findByNationalId(nationalId: string): Promise<Citizen | null>;
  create(citizen: Omit<Citizen, 'id' | 'createdAt'>): Promise<Citizen>;
  listAll(): Promise<Citizen[]>;
}
