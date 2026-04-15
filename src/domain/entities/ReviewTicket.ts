export enum ReviewTicketStatus {
  OPEN = 'OPEN',
  ROUTED = 'ROUTED',
  CORRECTED = 'CORRECTED',
  PENDING_IDENTITY_VALIDATION = 'PENDING_IDENTITY_VALIDATION',
  MAINTAINED = 'MAINTAINED',
  CLOSED = 'CLOSED',
}

export type ReviewTicketKind = 'CONVICTION' | 'IDENTITY';

export interface IdentityPatch {
  lastName?: string;
  firstName?: string;
  birthDate?: string;
  birthPlace?: string;
  fatherName?: string;
  motherName?: string;
  gender?: 'M' | 'F';
  address?: string;
}

export interface ReviewTicket {
  id: string;
  kind: ReviewTicketKind;
  bulletinId: string;
  citizenId: string;
  convictionId?: string;          // requis si kind === 'CONVICTION'
  identityPatchProposed?: IdentityPatch; // rempli au moment de la correction (kind === 'IDENTITY')

  status: ReviewTicketStatus;

  openedBy: string;
  openedAt: string;
  openComment: string;

  routedBy?: string;
  routedAt?: string;

  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: 'CORRECTED' | 'MAINTAINED';
  maintainedComment?: string;

  validatedBy?: string;            // pour les corrections d'identité validées par superviseur
  validatedAt?: string;

  closedBy?: string;
  closedAt?: string;
}