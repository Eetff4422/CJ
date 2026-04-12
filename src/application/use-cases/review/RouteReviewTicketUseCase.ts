import { AuditRepository } from '@application/ports/AuditRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface RouteReviewTicketInput {
  ticketId: string;
  routedBy: string;        // user id superviseur condamnations
  routedByEmail: string;
  routedByRole: string;
}

export class RouteReviewTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private convictions: ConvictionRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: RouteReviewTicketInput): Promise<ReviewTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.status !== ReviewTicketStatus.OPEN) {
      throw new Error('Ce ticket ne peut plus être routé.');
    }

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.ROUTED,
      routedBy: input.routedBy,
      routedAt: new Date().toISOString(),
    });

    await this.audit.append({
      userId: input.routedBy,
      userEmail: input.routedByEmail,
      userRole: input.routedByRole,
      action: AuditAction.ROUTE_REVIEW_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Ticket routé vers le saisisseur d'origine`,
    });

    return updated;
  }
}