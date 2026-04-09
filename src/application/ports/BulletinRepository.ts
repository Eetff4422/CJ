import { Bulletin } from '@domain/entities/Bulletin';

export interface BulletinRepository {
  findById(id: string): Promise<Bulletin | null>;
  findByCitizenId(citizenId: string): Promise<Bulletin[]>;
  create(
    bulletin: Omit<Bulletin, 'id' | 'requestNumber' | 'requestedAt' | 'verificationCode'>
  ): Promise<Bulletin>;
  update(id: string, patch: Partial<Bulletin>): Promise<Bulletin>;
  listAll(): Promise<Bulletin[]>;
}
