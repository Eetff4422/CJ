import { AuditRepository } from '@application/ports/AuditRepository';
import { BulletinRepository } from '@application/ports/BulletinRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface OpenIdentityReviewTicketInput {
  bulletinId: string;
  citizenId: string;
  openedBy: string;
  openedByEmail: string;
  openedByRole: string;
  openComment: string;
}

export class OpenIdentityReviewTicketUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private citizens: CitizenRepository,
    private bulletins: BulletinRepository,
    private audit: AuditRepository,
  ) {}

  async execute(input: OpenIdentityReviewTicketInput): Promise<ReviewTicket> {
    if (!input.openComment?.trim()) {
      throw new Error('Le motif de la relecture est obligatoire.');
    }

    const citizen = await this.citizens.findById(input.citizenId);
    if (!citizen) throw new Error('Citoyen introuvable.');

    const bulletin = await this.bulletins.findById(input.bulletinId);
    if (!bulletin) throw new Error('Bulletin introuvable.');

    // Règle 5 maintenue : un seul ticket actif par bulletin (peu importe le type)
    const existingOnBul = await this.tickets.findByBulletinId(input.bulletinId);
    const activeOnBul = existingOnBul.find(t => t.status !== ReviewTicketStatus.CLOSED);
    if (activeOnBul) {
      throw new Error('Une relecture est déjà en cours sur ce bulletin.');
    }

    await this.bulletins.update(input.bulletinId, { status: BulletinStatus.UNDER_DEEP_REVIEW });

    const ticket = await this.tickets.create({
      kind: 'IDENTITY',
      bulletinId: input.bulletinId,
      citizenId: input.citizenId,
      openedBy: input.openedBy,
      openComment: input.openComment.trim(),
    });

    await this.audit.append({
      userId: input.openedBy,
      userEmail: input.openedByEmail,
      userRole: input.openedByRole,
      action: AuditAction.OPEN_IDENTITY_REVIEW_TICKET,
      targetType: 'ReviewTicket',
      targetId: ticket.id,
      details: `Ticket identité ouvert sur citoyen ${input.citizenId} — motif : ${input.openComment.trim()}`,
    });

    return ticket;
  }
}