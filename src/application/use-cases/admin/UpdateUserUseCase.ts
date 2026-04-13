import { AuditRepository } from '@application/ports/AuditRepository';
import { AuthRepository } from '@application/ports/AuthRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { RoleId } from '@domain/entities/Role';
import { User } from '@domain/entities/User';

export interface UpdateUserInput {
  admin: User;
  targetUserId: string;
  fullName?: string;
  email?: string;
  role?: RoleId;
}

export interface UpdateUserResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class UpdateUserUseCase {
  constructor(
    private authRepo: AuthRepository,
    private auditRepo: AuditRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserResult> {
    const target = await this.authRepo.findById(input.targetUserId);
    if (!target) return { success: false, error: 'Compte introuvable.' };

    const patch: Partial<User> = {};
    const changes: string[] = [];

    if (input.fullName !== undefined && input.fullName.trim() !== target.fullName) {
      patch.fullName = input.fullName.trim();
      changes.push(`nom: "${target.fullName}" → "${patch.fullName}"`);
    }

    if (input.email !== undefined) {
      const newEmail = input.email.toLowerCase().trim();
      if (newEmail !== target.email) {
        const existing = await this.authRepo.findByEmail(newEmail);
        if (existing && existing.id !== target.id) {
          return { success: false, error: 'Cet email est déjà utilisé.' };
        }
        patch.email = newEmail;
        changes.push(`email: "${target.email}" → "${newEmail}"`);
      }
    }

    if (input.role !== undefined && input.role !== target.role) {
      // L'admin ne peut pas transformer un compte en citoyen ou inversement
      if (input.role === RoleId.CITIZEN || target.role === RoleId.CITIZEN) {
        return { success: false, error: 'Les comptes citoyens ne peuvent pas changer de rôle.' };
      }
      patch.role = input.role;
      changes.push(`rôle: "${target.role}" → "${input.role}"`);
    }

    if (Object.keys(patch).length === 0) {
      return { success: true, user: target };
    }

    const updated = await this.authRepo.update(target.id, patch);

    await this.auditRepo.append({
      userId: input.admin.id,
      userEmail: input.admin.email,
      userRole: input.admin.role,
      action: AuditAction.UPDATE_USER,
      targetType: 'User',
      targetId: target.id,
      details: `Modification compte ${target.email} — ${changes.join(', ')}`,
    });

    return { success: true, user: updated };
  }
}