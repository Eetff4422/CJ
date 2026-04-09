import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'convictions';

export class InMemoryConvictionRepository implements ConvictionRepository {
  private convictions: Conviction[];

  constructor(seed: Conviction[] = []) {
  this.convictions = storage.get<Conviction[]>(KEY) ?? seed;
}

  async findById(id: string): Promise<Conviction | null> {
    return this.convictions.find((c) => c.id === id) ?? null;
  }

  async findByCitizenId(citizenId: string): Promise<Conviction[]> {
    return this.convictions
      .filter((c) => c.citizenId === citizenId)
      .sort((a, b) => b.decisionDate.localeCompare(a.decisionDate));
  }

  async findByStatus(status: ConvictionStatus): Promise<Conviction[]> {
    return this.convictions
      .filter((c) => c.status === status)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  async create(
    input: Omit<Conviction, 'id' | 'submittedAt' | 'status'>
  ): Promise<Conviction> {
    const c: Conviction = {
      ...input,
      id: 'conv_' + crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      status: ConvictionStatus.PENDING_VALIDATION,
    };
    this.convictions.push(c);
    storage.set(KEY, this.convictions);
    return c;
  }

  async update(id: string, patch: Partial<Conviction>): Promise<Conviction> {
    const idx = this.convictions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Conviction not found');
    this.convictions[idx] = { ...this.convictions[idx], ...patch };
    storage.set(KEY, this.convictions);
    return this.convictions[idx];
  }

  async listAll(): Promise<Conviction[]> {
    return [...this.convictions].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt)
    );
  }
}
