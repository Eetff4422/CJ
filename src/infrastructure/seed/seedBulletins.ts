import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';

export const SEED_BULLETINS: Bulletin[] = [
  // ── Demande émise (bulletin disponible) ──────────────────────────────────
  {
    id: 'b_001',
    requestNumber: 'B3-2026-LBV-00001',
    citizenId: 'c_001',
    requestedAt: '2026-03-01T08:30:00Z',
    status: BulletinStatus.ISSUED,
    paymentMethod: 'AIRTEL_MONEY',
    paidAt: '2026-03-01T08:35:00Z',
    processedBy: 'u_agent_casier_001',
    issuedAt: '2026-03-01T14:20:00Z',
    verificationCode: 'SGCJ-VERIF-A1B2C3D4',
  },
  // ── Demande en cours de traitement ───────────────────────────────────────
  {
    id: 'b_002',
    requestNumber: 'B3-2026-LBV-00002',
    citizenId: 'c_001',
    requestedAt: '2026-04-07T10:15:00Z',
    status: BulletinStatus.PENDING_PROCESSING,
    paymentMethod: 'MOOV_MONEY',
    paidAt: '2026-04-07T10:18:00Z',
    verificationCode: 'SGCJ-VERIF-E5F6G7H8',
  },
  // ── Demande en attente de paiement ───────────────────────────────────────
  {
    id: 'b_003',
    requestNumber: 'B3-2026-LBV-00003',
    citizenId: 'c_002',
    requestedAt: '2026-04-08T09:00:00Z',
    status: BulletinStatus.PENDING_PAYMENT,
    verificationCode: 'SGCJ-VERIF-I9J0K1L2',
  },
  // ── Demande rejetée ───────────────────────────────────────────────────────
  {
    id: 'b_004',
    requestNumber: 'B3-2026-LBV-00004',
    citizenId: 'c_003',
    requestedAt: '2026-03-15T16:00:00Z',
    status: BulletinStatus.REJECTED,
    paymentMethod: 'CARTE_BANCAIRE',
    paidAt: '2026-03-15T16:05:00Z',
    processedBy: 'u_agent_casier_001',
    verificationCode: 'SGCJ-VERIF-M3N4O5P6',
  },
  // ── Autre demande en attente de traitement (pour le dashboard agent) ─────
  {
    id: 'b_005',
    requestNumber: 'B3-2026-PGT-00001',
    citizenId: 'c_002',
    requestedAt: '2026-04-08T11:30:00Z',
    status: BulletinStatus.PENDING_PROCESSING,
    paymentMethod: 'AIRTEL_MONEY',
    paidAt: '2026-04-08T11:32:00Z',
    verificationCode: 'SGCJ-VERIF-Q7R8S9T0',
  },
];