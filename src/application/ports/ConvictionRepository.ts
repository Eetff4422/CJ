import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';

export interface ConvictionRepository {
  findById(id: string): Promise<Conviction | null>;
  findByCitizenId(citizenId: string): Promise<Conviction[]>;
  findByStatus(status: ConvictionStatus): Promise<Conviction[]>;
  create(
    c: Omit<Conviction, 'id' | 'submittedAt' | 'status'>
  ): Promise<Conviction>;
  update(id: string, patch: Partial<Conviction>): Promise<Conviction>;
  listAll(): Promise<Conviction[]>;
}
