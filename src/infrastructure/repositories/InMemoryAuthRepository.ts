import { AuthRepository } from '@application/ports/AuthRepository';
import { User } from '@domain/entities/User';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'users';

export class InMemoryAuthRepository implements AuthRepository {
  private users: User[];

  constructor(seed: User[]) {
  const stored = storage.get<User[]>(KEY);
  if (stored && stored.length > 0) {
    // Fusion : on garde les users persistés (créés à l'exécution),
    // mais pour les seed users on ré-applique les liens du seed
    // au cas où ils auraient évolué (ex: ajout de citizenId).
    const seedById = new Map(seed.map(u => [u.id, u]));
    this.users = stored.map(u => {
      const s = seedById.get(u.id);
      return s ? { ...u, ...s } : u;
    });
    // Ajoute les seed users qui n'existeraient pas encore en cache
    for (const s of seed) {
      if (!stored.some(u => u.id === s.id)) {
        this.users.push(s);
      }
    }
    storage.set(KEY, this.users);
  } else {
    this.users = seed;
    storage.set(KEY, this.users);
  }
}

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async update(id: string, patch: Partial<User>): Promise<User> {
  const idx = this.users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error(`User not found: ${id}`);
  this.users[idx] = { ...this.users[idx], ...patch };
  storage.set(KEY, this.users);
  return this.users[idx];
}
  async listAll(): Promise<User[]> {
    return [...this.users];
  }
}
