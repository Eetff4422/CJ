import { AuditRepository } from '@application/ports/AuditRepository';
import { BulletinRepository } from '@application/ports/BulletinRepository';
import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { ConvictionStatus } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface OpenReviewTicketInput {
  bulletinId: string;
  convictionId: string;
  openedBy: string;
  openedByEmail: string;
  openedByRole: string;
  openComment: string;
}

export class OpenReviewTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private convictions: ConvictionRepository,
    private bulletins: BulletinRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: OpenReviewTicketInput): Promise<ReviewTicket> {
    if (!input.openComment?.trim()) {
      throw new Error('Le motif de la relecture est obligatoire.');
    }

    const conviction = await this.convictions.findById(input.convictionId);
    if (!conviction) throw new Error('Condamnation introuvable.');

    const bulletin = await this.bulletins.findById(input.bulletinId);
    if (!bulletin) throw new Error('Bulletin introuvable.');

    // Règle 4 : une seule relecture active par condamnation
    const existingOnConv = await this.tickets.findByConvictionId(input.convictionId);
    const activeOnConv = existingOnConv.find(t => t.status !== ReviewTicketStatus.CLOSED);
    if (activeOnConv) {
      throw new Error('Une relecture est déjà en cours sur cette condamnation.');
    }

    // Règle 5 : un seul ticket actif par bulletin
    const existingOnBul = await this.tickets.findByBulletinId(input.bulletinId);
    const activeOnBul = existingOnBul.find(t => t.status !== ReviewTicketStatus.CLOSED);
    if (activeOnBul) {
      throw new Error('Une relecture est déjà en cours sur ce bulletin.');
    }

    // Transitions
    await this.convictions.update(input.convictionId, { status: ConvictionStatus.UNDER_REVIEW });
    await this.bulletins.update(input.bulletinId, { status: BulletinStatus.UNDER_DEEP_REVIEW });

    const ticket = await this.tickets.create({
      bulletinId: input.bulletinId,
      convictionId: input.convictionId,
      openedBy: input.openedBy,
      openComment: input.openComment.trim(),
    });

    await this.audit.append({
      userId: input.openedBy,
      userEmail: input.openedByEmail,
      userRole: input.openedByRole,
      action: AuditAction.OPEN_REVIEW_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Ticket ouvert sur condamnation ${input.convictionId} — motif : ${input.openComment.trim()}`,
    });

    return ticket;
  }
}