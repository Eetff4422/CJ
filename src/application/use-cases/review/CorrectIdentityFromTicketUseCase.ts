import { AuditRepository } from '@application/ports/AuditRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { IdentityPatch, ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface CorrectIdentityFromTicketInput {
  ticketId: string;
  correctedBy: string;
  correctedByEmail: string;
  correctedByRole: string;
  patch: IdentityPatch;
}

export class CorrectIdentityFromTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: CorrectIdentityFromTicketInput): Promise<ReviewTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.kind !== 'IDENTITY') throw new Error('Ce ticket ne concerne pas une identité.');
    if (ticket.status !== ReviewTicketStatus.ROUTED) {
      throw new Error('Ce ticket n\'est pas en attente de correction.');
    }

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.PENDING_IDENTITY_VALIDATION,
      resolvedBy: input.correctedBy,
      resolvedAt: new Date().toISOString(),
      identityPatchProposed: input.patch,
    });

    await this.audit.append({
      userId: input.correctedBy,
      userEmail: input.correctedByEmail,
      userRole: input.correctedByRole,
      action: AuditAction.CORRECT_IDENTITY_FROM_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Correction identité proposée — en attente de validation superviseur`,
    });

    return updated;
  }
}