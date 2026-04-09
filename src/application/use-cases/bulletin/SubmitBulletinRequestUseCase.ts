import { BulletinRepository } from '@application/ports/BulletinRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { Bulletin, BulletinStatus, BulletinJustifications } from '@domain/entities/Bulletin';
import { User } from '@domain/entities/User';
import { AuditAction } from '@domain/entities/AuditLog';

export interface SubmitBulletinInput {
  user: User;
  reason: string;
  justifications: BulletinJustifications;
}

export interface SubmitBulletinResult {
  success: boolean;
  bulletin?: Bulletin;
  error?: string;
}

export class SubmitBulletinRequestUseCase {
  constructor(
    private bulletinRepo: BulletinRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute({
    user,
    reason,
    justifications,
  }: SubmitBulletinInput): Promise<SubmitBulletinResult> {
    if (!user.citizenId) {
      return {
        success: false,
        error: "Ce compte n'est pas rattaché à un dossier citoyen.",
      };
    }
    if (!justifications.identityDocument || !justifications.proofOfAddress) {
      return {
        success: false,
        error:
          'Veuillez confirmer la fourniture de toutes les pièces justificatives requises.',
      };
    }
    if (!reason.trim()) {
      return { success: false, error: 'Veuillez préciser le motif de la demande.' };
    }

    const bulletin = await this.bulletinRepo.create({
      citizenId: user.citizenId,
      status: BulletinStatus.PENDING_PAYMENT,
      reason: reason.trim(),
      justifications,
    });

    await this.auditRepo.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.SUBMIT_BULLETIN_REQUEST,
      targetType: 'Bulletin',
      targetId: bulletin.id,
      details: `Demande ${bulletin.requestNumber} créée`,
    });

    return { success: true, bulletin };
  }
}
