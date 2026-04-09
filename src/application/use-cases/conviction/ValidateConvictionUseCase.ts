import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { ConvictionStatus } from '@domain/entities/Conviction';
import { User } from '@domain/entities/User';
import { AuditAction } from '@domain/entities/AuditLog';

export interface ValidateConvictionInput {
  supervisor: User;
  convictionId: string;
  approve: boolean;
  rejectionReason?: string;
}

export class ValidateConvictionUseCase {
  constructor(
    private convictionRepo: ConvictionRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute({
    supervisor,
    convictionId,
    approve,
    rejectionReason,
  }: ValidateConvictionInput) {
    const conviction = await this.convictionRepo.findById(convictionId);
    if (!conviction) return { success: false, error: 'Condamnation introuvable.' };
    if (conviction.status !== ConvictionStatus.PENDING_VALIDATION) {
      return { success: false, error: 'Cette condamnation a déjà été traitée.' };
    }
    if (!approve && !rejectionReason?.trim()) {
      return { success: false, error: 'Un motif de rejet est requis.' };
    }

    const updated = await this.convictionRepo.update(convictionId, {
      status: approve ? ConvictionStatus.VALIDATED : ConvictionStatus.REJECTED,
      validatedBy: supervisor.id,
      validatedAt: new Date().toISOString(),
      rejectionReason: approve ? undefined : rejectionReason?.trim(),
    });

    await this.auditRepo.append({
      userId: supervisor.id,
      userEmail: supervisor.email,
      userRole: supervisor.role,
      action: approve ? AuditAction.VALIDATE_CONVICTION : AuditAction.REJECT_CONVICTION,
      targetType: 'Conviction',
      targetId: conviction.id,
      details: approve
        ? `Condamnation validée — ${conviction.offense}`
        : `Condamnation rejetée — motif : ${rejectionReason}`,
    });

    return { success: true, conviction: updated };
  }
}
