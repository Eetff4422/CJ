import { AuditRepository } from '@application/ports/AuditRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { User } from '@domain/entities/User';

export class LogoutUseCase {
  constructor(private auditRepo: AuditRepository) {}

  async execute(user: User): Promise<void> {
    await this.auditRepo.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.LOGOUT,
    });
  }
}
