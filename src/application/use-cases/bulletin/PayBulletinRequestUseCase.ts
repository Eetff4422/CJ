import { BulletinRepository } from '@application/ports/BulletinRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { User } from '@domain/entities/User';
import { AuditAction } from '@domain/entities/AuditLog';

export type PaymentMethod =
  | 'AIRTEL_MONEY'
  | 'MOOV_MONEY'
  | 'VISA'
  | 'MASTERCARD'
  | 'PAYPAL'
  | 'APPLE_PAY';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  AIRTEL_MONEY: 'Airtel Money',
  MOOV_MONEY: 'Moov Money',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  PAYPAL: 'PayPal',
  APPLE_PAY: 'Apple Pay',
};

export interface PayBulletinInput {
  user: User;
  bulletinId: string;
  method: PaymentMethod;
}

export interface PayBulletinResult {
  success: boolean;
  bulletin?: Bulletin;
  error?: string;
}

/**
 * Simulated payment. No real payment gateway integration in the MVP —
 * a 2-second delay represents the round-trip with the provider.
 */
export class PayBulletinRequestUseCase {
  constructor(
    private bulletinRepo: BulletinRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute({
    user,
    bulletinId,
    method,
  }: PayBulletinInput): Promise<PayBulletinResult> {
    const bulletin = await this.bulletinRepo.findById(bulletinId);
    if (!bulletin) return { success: false, error: 'Demande introuvable.' };
    if (bulletin.citizenId !== user.citizenId) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à régler cette demande.",
      };
    }
    if (bulletin.status !== BulletinStatus.PENDING_PAYMENT) {
      return { success: false, error: 'Cette demande n\u2019est pas en attente de paiement.' };
    }

    await new Promise((r) => setTimeout(r, 2000));

    const updated = await this.bulletinRepo.update(bulletinId, {
      status: BulletinStatus.PENDING_PROCESSING,
      paymentMethod: method,
      paidAt: new Date().toISOString(),
    });

    await this.auditRepo.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.PROCESS_PAYMENT,
      targetType: 'Bulletin',
      targetId: bulletin.id,
      details: `Paiement simulé via ${PAYMENT_METHOD_LABELS[method]} pour ${bulletin.requestNumber}`,
    });

    return { success: true, bulletin: updated };
  }
}
