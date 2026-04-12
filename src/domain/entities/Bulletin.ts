export enum BulletinStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_PROCESSING = 'PENDING_PROCESSING',
  UNDER_DEEP_REVIEW = 'UNDER_DEEP_REVIEW',
  ISSUED = 'ISSUED',
  REJECTED = 'REJECTED',
}

export interface Bulletin {
  id: string;
  requestNumber: string; // numéro de demande visible par le citoyen
  citizenId: string;
  requestedAt: string;
  status: BulletinStatus;
  paymentMethod?: string;
  paidAt?: string;
  processedBy?: string; // agent casier user id
  issuedAt?: string;
  verificationCode: string; // encoded in the QR code
}
export const BULLETIN_VALIDITY_MONTHS = 6;
