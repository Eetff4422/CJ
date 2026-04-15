import { AuditRepository } from '@application/ports/AuditRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface ValidateIdentityCorrectionInput {
  ticketId: string;
  validatedBy: string;
  validatedByEmail: string;
  validatedByRole: string;
}

export class ValidateIdentityCorrectionUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private citizens: CitizenRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: ValidateIdentityCorrectionInput): Promise<ReviewTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.kind !== 'IDENTITY') throw new Error('Ce ticket ne concerne pas une identité.');
    if (ticket.status !== ReviewTicketStatus.PENDING_IDENTITY_VALIDATION) {
      throw new Error('Ce ticket n\'est pas en attente de validation.');
    }
    if (!ticket.identityPatchProposed) {
      throw new Error('Aucune correction proposée.');
    }

    // Application effective du patch sur le citoyen
    await this.citizens.update?.(ticket.citizenId, ticket.identityPatchProposed);

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.CORRECTED,
      resolution: 'CORRECTED',
      validatedBy: input.validatedBy,
      validatedAt: new Date().toISOString(),
    });

    await this.audit.append({
      userId: input.validatedBy,
      userEmail: input.validatedByEmail,
      userRole: input.validatedByRole,
      action: AuditAction.VALIDATE_IDENTITY_CORRECTION,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Correction d'identité validée et appliquée sur citoyen ${ticket.citizenId}`,
    });

    return updated;
  }
}