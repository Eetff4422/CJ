import { AuditRepository } from '@application/ports/AuditRepository';
import { AuditLogEntry } from '@domain/entities/AuditLog';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'audit_log';

export class InMemoryAuditRepository implements AuditRepository {
  private entries: AuditLogEntry[];

  constructor() {
    this.entries = storage.get<AuditLogEntry[]>(KEY) ?? [];
  }

  async append(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<AuditLogEntry> {
    const full: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.entries.push(full);
    storage.set(KEY, this.entries);
    return full;
  }

  async listAll(): Promise<AuditLogEntry[]> {
    return [...this.entries].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }

  async listForUser(userId: string): Promise<AuditLogEntry[]> {
    return this.entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
