import { BulletinRepository } from '@application/ports/BulletinRepository';
import { Bulletin } from '@domain/entities/Bulletin';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'bulletins';
const COUNTER_KEY = 'bulletin_counter';

export class InMemoryBulletinRepository implements BulletinRepository {
  private bulletins: Bulletin[];

  constructor(seed: Bulletin[] = []) {
  this.bulletins = storage.get<Bulletin[]>(KEY) ?? seed;
}

  private nextRequestNumber(): string {
    const current = storage.get<number>(COUNTER_KEY) ?? 0;
    const next = current + 1;
    storage.set(COUNTER_KEY, next);
    const year = new Date().getFullYear();
    return `B3-${year}-${next.toString().padStart(5, '0')}`;
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 12; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  async findById(id: string): Promise<Bulletin | null> {
    return this.bulletins.find((b) => b.id === id) ?? null;
  }

  async findByCitizenId(citizenId: string): Promise<Bulletin[]> {
    return this.bulletins
      .filter((b) => b.citizenId === citizenId)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }

  async create(
    input: Omit<Bulletin, 'id' | 'requestNumber' | 'requestedAt' | 'verificationCode'>
  ): Promise<Bulletin> {
    const bulletin: Bulletin = {
      ...input,
      id: 'b_' + crypto.randomUUID(),
      requestNumber: this.nextRequestNumber(),
      requestedAt: new Date().toISOString(),
      verificationCode: this.generateVerificationCode(),
    };
    this.bulletins.push(bulletin);
    storage.set(KEY, this.bulletins);
    return bulletin;
  }

  async update(id: string, patch: Partial<Bulletin>): Promise<Bulletin> {
    const idx = this.bulletins.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Bulletin not found: ${id}`);
    this.bulletins[idx] = { ...this.bulletins[idx], ...patch };
    storage.set(KEY, this.bulletins);
    return this.bulletins[idx];
  }

  async listAll(): Promise<Bulletin[]> {
    return [...this.bulletins].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt)
    );
  }
}
