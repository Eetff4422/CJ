import { AuditRepository } from '@application/ports/AuditRepository';
import { BulletinRepository } from '@application/ports/BulletinRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface CloseReviewTicketInput {
  ticketId: string;
  closedBy: string;
  closedByEmail: string;
  closedByRole: string;
}

export class CloseReviewTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private bulletins: BulletinRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: CloseReviewTicketInput): Promise<ReviewTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.status !== ReviewTicketStatus.CORRECTED && ticket.status !== ReviewTicketStatus.MAINTAINED) {
      throw new Error('Ce ticket n\'est pas prêt à être clôturé.');
    }

    // Le bulletin retourne en file de traitement standard pour l'agent casier
    await this.bulletins.update(ticket.bulletinId, { status: BulletinStatus.PENDING_PROCESSING });

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.CLOSED,
      closedBy: input.closedBy,
      closedAt: new Date().toISOString(),
    });

    await this.audit.append({
      userId: input.closedBy,
      userEmail: input.closedByEmail,
      userRole: input.closedByRole,
      action: AuditAction.CLOSE_REVIEW_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Ticket clôturé après résolution : ${ticket.resolution}`,
    });

    return updated;
  }
}