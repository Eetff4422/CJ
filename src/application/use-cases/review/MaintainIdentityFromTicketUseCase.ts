import { AuditRepository } from '@application/ports/AuditRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface MaintainIdentityFromTicketInput {
  ticketId: string;
  maintainedBy: string;
  maintainedByEmail: string;
  maintainedByRole: string;
  maintainedComment: string;
}

export class MaintainIdentityFromTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: MaintainIdentityFromTicketInput): Promise<ReviewTicket> {
    if (!input.maintainedComment?.trim()) {
      throw new Error('La justification du maintien est obligatoire.');
    }
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.kind !== 'IDENTITY') throw new Error('Ce ticket ne concerne pas une identité.');
    if (ticket.status !== ReviewTicketStatus.ROUTED) {
      throw new Error('Ce ticket n\'est pas en attente de décision.');
    }

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.MAINTAINED,
      resolvedBy: input.maintainedBy,
      resolvedAt: new Date().toISOString(),
      resolution: 'MAINTAINED',
      maintainedComment: input.maintainedComment.trim(),
    });

    await this.audit.append({
      userId: input.maintainedBy,
      userEmail: input.maintainedByEmail,
      userRole: input.maintainedByRole,
      action: AuditAction.MAINTAIN_IDENTITY_FROM_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Identité maintenue — ${input.maintainedComment.trim()}`,
    });

    return updated;
  }
}