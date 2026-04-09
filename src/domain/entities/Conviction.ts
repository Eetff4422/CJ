export enum ConvictionStatus {
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export interface Conviction {
  id: string;
  citizenId: string;
  court: string;
  decisionDate: string;
  offense: string;
  sentence: string;
  submittedBy: string; // agent penitentiaire user id
  submittedAt: string;
  status: ConvictionStatus;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}
