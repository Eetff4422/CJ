import { AuditRepository } from '@application/ports/AuditRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { ConvictionStatus } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface MaintainConvictionFromTicketInput {
  ticketId: string;
  maintainedBy: string;
  maintainedByEmail: string;
  maintainedByRole: string;
  maintainedComment: string;
}

export class MaintainConvictionFromTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private convictions: ConvictionRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: MaintainConvictionFromTicketInput): Promise<ReviewTicket> {
    if (!input.maintainedComment?.trim()) {
      throw new Error('La justification du maintien est obligatoire.');
    }
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.status !== ReviewTicketStatus.ROUTED) {
      throw new Error('Ce ticket n\'est pas en attente de décision.');
    }
    const conv = await this.convictions.findById(ticket.convictionId);
    if (!conv) throw new Error('Condamnation introuvable.');
    if (conv.submittedBy !== input.maintainedBy) {
      throw new Error('Seul le saisisseur d\'origine peut maintenir cette saisie.');
    }

    // Maintien : la condamnation revient directement validée
    await this.convictions.update(ticket.convictionId, { status: ConvictionStatus.VALIDATED });

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
      action: AuditAction.MAINTAIN_CONVICTION_FROM_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Maintien justifié : ${input.maintainedComment.trim()}`,
    });

    return updated;
  }
}