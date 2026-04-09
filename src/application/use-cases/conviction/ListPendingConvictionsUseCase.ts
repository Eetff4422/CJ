import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';

export class ListPendingConvictionsUseCase {
  constructor(private convictionRepo: ConvictionRepository) {}

  async execute(): Promise<Conviction[]> {
    return this.convictionRepo.findByStatus(ConvictionStatus.PENDING_VALIDATION);
  }
}
