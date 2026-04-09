import { BulletinRepository } from '@application/ports/BulletinRepository';
import { Bulletin } from '@domain/entities/Bulletin';
import { User } from '@domain/entities/User';

export class ListCitizenBulletinsUseCase {
  constructor(private bulletinRepo: BulletinRepository) {}

  async execute(user: User): Promise<Bulletin[]> {
    if (!user.citizenId) return [];
    return this.bulletinRepo.findByCitizenId(user.citizenId);
  }
}
