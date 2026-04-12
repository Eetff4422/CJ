import { AuditRepository } from '@application/ports/AuditRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface CorrectConvictionFromTicketInput {
  ticketId: string;
  correctedBy: string;
  correctedByEmail: string;
  correctedByRole: string;
  patch: Partial<Pick<Conviction, 'court' | 'decisionDate' | 'offense' | 'sentence'>>;
}

export class CorrectConvictionFromTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private convictions: ConvictionRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: CorrectConvictionFromTicketInput): Promise<ReviewTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) throw new Error('Ticket introuvable.');
    if (ticket.status !== ReviewTicketStatus.ROUTED) {
      throw new Error('Ce ticket n\'est pas en attente de correction.');
    }
    // Sécurité : seul le saisisseur d'origine peut corriger
    const conv = await this.convictions.findById(ticket.convictionId);
    if (!conv) throw new Error('Condamnation introuvable.');
    if (conv.submittedBy !== input.correctedBy) {
      throw new Error('Seul le saisisseur d\'origine peut corriger cette saisie.');
    }

    // Correction + retour en file de validation
    const before = { court: conv.court, decisionDate: conv.decisionDate, offense: conv.offense, sentence: conv.sentence };
    await this.convictions.update(ticket.convictionId, {
      ...input.patch,
      status: ConvictionStatus.PENDING_VALIDATION,
    });

    const updated = await this.tickets.update(input.ticketId, {
      status: ReviewTicketStatus.CORRECTED,
      resolvedBy: input.correctedBy,
      resolvedAt: new Date().toISOString(),
      resolution: 'CORRECTED',
    });

    await this.audit.append({
      userId: input.correctedBy,
      userEmail: input.correctedByEmail,
      userRole: input.correctedByRole,
      action: AuditAction.CORRECT_CONVICTION_FROM_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Avant : ${JSON.stringify(before)} — Après : ${JSON.stringify(input.patch)}`,
    });

    return updated;
  }
}