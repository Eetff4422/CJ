import { BulletinRepository } from '@application/ports/BulletinRepository';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';

export class ListPendingBulletinsUseCase {
  constructor(private bulletinRepo: BulletinRepository) {}

  async execute(): Promise<Bulletin[]> {
    const all = await this.bulletinRepo.listAll();
    return all
      .filter((b) => b.status === BulletinStatus.PENDING_PROCESSING)
      .sort((a, b) => (a.paidAt ?? '').localeCompare(b.paidAt ?? ''));
  }
}
