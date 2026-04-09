import { BulletinRepository } from '@application/ports/BulletinRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';

export interface VerifyBulletinResult {
  valid: boolean;
  bulletin?: Bulletin;
  citizen?: Citizen;
  error?: string;
}

/**
 * Public verification of a bulletin via its verification code (encoded in the QR).
 * Returns limited information — only what a third party needs to confirm authenticity.
 */
export class VerifyBulletinUseCase {
  constructor(
    private bulletinRepo: BulletinRepository,
    private citizenRepo: CitizenRepository
  ) {}

  async execute(code: string): Promise<VerifyBulletinResult> {
    const all = await this.bulletinRepo.listAll();
    const bulletin = all.find(
      (b) =>
        b.verificationCode.toUpperCase() === code.trim().toUpperCase() &&
        b.status === BulletinStatus.ISSUED
    );

    if (!bulletin) {
      return {
        valid: false,
        error: "Aucun bulletin valide ne correspond à ce code de vérification.",
      };
    }

    const citizen = await this.citizenRepo.findById(bulletin.citizenId);
    if (!citizen) {
      return { valid: false, error: 'Dossier citoyen introuvable.' };
    }

    return { valid: true, bulletin, citizen };
  }
}
