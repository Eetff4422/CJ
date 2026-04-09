import { AuditRepository } from '@application/ports/AuditRepository';
import { BulletinRepository } from '@application/ports/BulletinRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { User } from '@domain/entities/User';

export interface ProcessBulletinInput {
  agent: User;
  bulletinId: string;
}

export interface ProcessBulletinResult {
  success: boolean;
  error?: string;
}

/**
 * Valide une demande de bulletin côté agent.
 * Change le statut en ISSUED et enregistre l'audit.
 * Le PDF est généré à la demande du citoyen (pas ici).
 */
export class ProcessBulletinRequestUseCase {
  constructor(
    private bulletinRepo: BulletinRepository,
    private citizenRepo: CitizenRepository,
    private convictionRepo: ConvictionRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute({ agent, bulletinId }: ProcessBulletinInput): Promise<ProcessBulletinResult> {
    const bulletin = await this.bulletinRepo.findById(bulletinId);
    if (!bulletin) return { success: false, error: 'Demande introuvable.' };

    if (bulletin.status !== BulletinStatus.PENDING_PROCESSING) {
      return { success: false, error: 'Cette demande n\'est pas en attente de traitement.' };
    }

    const citizen = await this.citizenRepo.findById(bulletin.citizenId);
    if (!citizen) return { success: false, error: 'Dossier citoyen introuvable.' };

    await this.bulletinRepo.update(bulletinId, {
      status: BulletinStatus.ISSUED,
      processedBy: agent.id,
      issuedAt: new Date().toISOString(),
    });

    await this.auditRepo.append({
      userId: agent.id,
      userEmail: agent.email,
      userRole: agent.role,
      action: AuditAction.GENERATE_BULLETIN,
      targetType: 'Bulletin',
      targetId: bulletin.id,
      details: `Bulletin ${bulletin.requestNumber} validé pour ${citizen.firstName} ${citizen.lastName}`,
    });

    return { success: true };
  }
}