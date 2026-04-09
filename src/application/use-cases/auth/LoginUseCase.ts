import { AuthRepository } from '@application/ports/AuthRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { User } from '@domain/entities/User';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Demo-grade login. DOES NOT implement real security.
 * The password hash is a simple base64 encoding for demonstration purposes.
 */
export class LoginUseCase {
  constructor(
    private authRepo: AuthRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginResult> {
    const user = await this.authRepo.findByEmail(email.toLowerCase().trim());

    if (!user || !user.isActive) {
      await this.auditRepo.append({
        userId: null,
        userEmail: email,
        userRole: null,
        action: AuditAction.LOGIN_FAILED,
        details: 'Utilisateur inconnu ou inactif',
      });
      return { success: false, error: 'Identifiants invalides.' };
    }

    const expectedHash = btoa(password);
    if (user.passwordHash !== expectedHash) {
      await this.auditRepo.append({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        details: 'Mot de passe incorrect',
      });
      return { success: false, error: 'Identifiants invalides.' };
    }

    await this.auditRepo.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.LOGIN,
    });

    return { success: true, user };
  }
}
