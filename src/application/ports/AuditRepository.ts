import { AuditLogEntry } from '@domain/entities/AuditLog';

export interface AuditRepository {
  append(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
  listAll(): Promise<AuditLogEntry[]>;
  listForUser(userId: string): Promise<AuditLogEntry[]>;
}
