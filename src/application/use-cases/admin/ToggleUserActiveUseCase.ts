import { AuditRepository } from '@application/ports/AuditRepository';
import { AuthRepository } from '@application/ports/AuthRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { User } from '@domain/entities/User';

export interface ToggleUserActiveInput {
  admin: User;
  targetUserId: string;
}

export class ToggleUserActiveUseCase {
  constructor(
    private authRepo: AuthRepository,
    private auditRepo: AuditRepository,
  ) {}

  async execute(input: ToggleUserActiveInput) {
    const target = await this.authRepo.findById(input.targetUserId);
    if (!target) return { success: false, error: 'Compte introuvable.' };
    if (target.id === input.admin.id) {
      return { success: false, error: 'Vous ne pouvez pas désactiver votre propre compte.' };
    }

    const newState = !target.isActive;
    const updated = await this.authRepo.update(target.id, { isActive: newState });

    await this.auditRepo.append({
      userId: input.admin.id,
      userEmail: input.admin.email,
      userRole: input.admin.role,
      action: AuditAction.TOGGLE_USER_ACTIVE,
      targetType: 'User',
      targetId: target.id,
      details: `Compte ${target.email} ${newState ? 'activé' : 'désactivé'}`,
    });

    return { success: true, user: updated };
  }
}