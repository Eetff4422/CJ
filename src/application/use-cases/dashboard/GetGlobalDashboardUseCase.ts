import { BulletinRepository } from '@application/ports/BulletinRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { ConvictionStatus } from '@domain/entities/Conviction';

export interface DashboardStats {
  totalCitizens: number;
  totalBulletinRequests: number;
  bulletinsByStatus: Record<BulletinStatus, number>;
  issuedBulletins: number;
  pendingProcessing: number;
  totalRevenueFcfa: number;
  averageProcessingHours: number | null;
  totalConvictions: number;
  convictionsByStatus: Record<ConvictionStatus, number>;
}

const FEE_PER_BULLETIN = 5000;

export class GetGlobalDashboardUseCase {
  constructor(
    private bulletinRepo: BulletinRepository,
    private convictionRepo: ConvictionRepository,
    private citizenRepo: CitizenRepository
  ) {}

  async execute(): Promise<DashboardStats> {
    const [bulletins, convictions, citizens] = await Promise.all([
      this.bulletinRepo.listAll(),
      this.convictionRepo.listAll(),
      this.citizenRepo.listAll(),
    ]);

    const bulletinsByStatus: Record<BulletinStatus, number> = {
      [BulletinStatus.PENDING_PAYMENT]: 0,
      [BulletinStatus.PENDING_PROCESSING]: 0,
      [BulletinStatus.ISSUED]: 0,
      [BulletinStatus.REJECTED]: 0,
    };
    bulletins.forEach((b) => (bulletinsByStatus[b.status] += 1));

    const convictionsByStatus: Record<ConvictionStatus, number> = {
      [ConvictionStatus.PENDING_VALIDATION]: 0,
      [ConvictionStatus.VALIDATED]: 0,
      [ConvictionStatus.REJECTED]: 0,
    };
    convictions.forEach((c) => (convictionsByStatus[c.status] += 1));

    const paidBulletins = bulletins.filter((b) => b.paidAt);
    const totalRevenueFcfa = paidBulletins.length * FEE_PER_BULLETIN;

    const processedWithTimes = bulletins.filter((b) => b.paidAt && b.issuedAt);
    let averageProcessingHours: number | null = null;
    if (processedWithTimes.length > 0) {
      const totalMs = processedWithTimes.reduce((sum, b) => {
        return sum + (new Date(b.issuedAt!).getTime() - new Date(b.paidAt!).getTime());
      }, 0);
      averageProcessingHours =
        totalMs / processedWithTimes.length / (1000 * 60 * 60);
    }

    return {
      totalCitizens: citizens.length,
      totalBulletinRequests: bulletins.length,
      bulletinsByStatus,
      issuedBulletins: bulletinsByStatus[BulletinStatus.ISSUED],
      pendingProcessing: bulletinsByStatus[BulletinStatus.PENDING_PROCESSING],
      totalRevenueFcfa,
      averageProcessingHours,
      totalConvictions: convictions.length,
      convictionsByStatus,
    };
  }
}
