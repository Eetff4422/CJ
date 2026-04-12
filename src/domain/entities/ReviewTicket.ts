export enum ReviewTicketStatus {
  OPEN = 'OPEN',
  ROUTED = 'ROUTED',
  CORRECTED = 'CORRECTED',
  MAINTAINED = 'MAINTAINED',
  CLOSED = 'CLOSED',
}

export interface ReviewTicket {
  id: string;
  bulletinId: string;
  convictionId: string;
  status: ReviewTicketStatus;

  openedBy: string;          // user id agent casier
  openedAt: string;
  openComment: string;       // motif de la contestation (obligatoire)

  routedBy?: string;         // user id superviseur condamnations
  routedAt?: string;

  resolvedBy?: string;       // user id saisisseur d'origine
  resolvedAt?: string;
  resolution?: 'CORRECTED' | 'MAINTAINED';
  maintainedComment?: string; // justification (obligatoire si MAINTAINED)

  closedBy?: string;         // user id agent casier
  closedAt?: string;
}