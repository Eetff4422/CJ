import { CitizenRepository } from '@application/ports/CitizenRepository';
import { Citizen } from '@domain/entities/Citizen';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'citizens';

export class InMemoryCitizenRepository implements CitizenRepository {
  private citizens: Citizen[];

  constructor(seed: Citizen[] = []) {
  this.citizens = storage.get<Citizen[]>(KEY) ?? seed;
}

  async findById(id: string): Promise<Citizen | null> {
    return this.citizens.find((c) => c.id === id) ?? null;
  }

  async findByNationalId(nationalId: string): Promise<Citizen | null> {
    return this.citizens.find((c) => c.nationalId === nationalId) ?? null;
  }
  async update(id: string, patch: Partial<Citizen>): Promise<Citizen> {
  const idx = this.citizens.findIndex(c => c.id === id);
  if (idx === -1) throw new Error(`Citizen not found: ${id}`);
  this.citizens[idx] = { ...this.citizens[idx], ...patch };
  storage.set(KEY, this.citizens);
  return this.citizens[idx];
}
  async create(input: Omit<Citizen, 'id' | 'createdAt'>): Promise<Citizen> {
    const citizen: Citizen = {
      ...input,
      id: 'cit_' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.citizens.push(citizen);
    storage.set(KEY, this.citizens);
    return citizen;
  }

  async listAll(): Promise<Citizen[]> {
    return [...this.citizens];
  }
}
