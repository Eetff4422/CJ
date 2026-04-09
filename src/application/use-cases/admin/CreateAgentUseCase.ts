import { UserRepository } from '@application/ports/UserRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { RoleId, ROLES } from '@domain/entities/Role';
import { User } from '@domain/entities/User';
import { AuditAction } from '@domain/entities/AuditLog';

export interface CreateAgentInput {
  admin: User;
  email: string;
  password: string;
  fullName: string;
  role: RoleId;
}

export class CreateAgentUseCase {
  constructor(
    private userRepo: UserRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute(input: CreateAgentInput) {
    if (input.role === RoleId.CITIZEN) {
      return { success: false, error: "L'administrateur ne crée pas de comptes citoyens." };
    }
    const email = input.email.toLowerCase().trim();
    const existing = await this.userRepo.findByEmail(email);
    if (existing) return { success: false, error: 'Email déjà utilisé.' };
    if (input.password.length < 6) {
      return { success: false, error: 'Mot de passe trop court (6 caractères min).' };
    }

    const user = await this.userRepo.create({
      email,
      fullName: input.fullName.trim(),
      role: input.role,
      passwordHash: btoa(input.password),
      isActive: true,
    });

    await this.auditRepo.append({
      userId: input.admin.id,
      userEmail: input.admin.email,
      userRole: input.admin.role,
      action: AuditAction.VALIDATE_IDENTITY_EDIT, // reused generic admin action
      targetType: 'User',
      targetId: user.id,
      details: `Création compte ${ROLES[input.role].label} — ${user.email}`,
    });

    return { success: true, user };
  }
}
