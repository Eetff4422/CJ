import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { ReviewTicket } from '@domain/entities/ReviewTicket';

export type ReviewListScope =
  | { kind: 'opened-by'; userId: string }       // agent casier : ses tickets
  | { kind: 'all' }                              // superviseurs : tout voir
  | { kind: 'routed-to'; userId: string };       // saisisseur : tickets qui le concernent

export class ListReviewTicketsUseCase {
  constructor(
    private tickets: ReviewTicketRepository,
    private convictions: ConvictionRepository,
  ) {}

  async execute(scope: ReviewListScope): Promise<ReviewTicket[]> {
    const all = await this.tickets.listAll();

    if (scope.kind === 'all') return all;

    if (scope.kind === 'opened-by') {
      return all.filter(t => t.openedBy === scope.userId);
    }

    // 'routed-to' : on retrouve les convictions dont submittedBy === userId
    const userConvIds = new Set(
      (await this.convictions.listAll())
        .filter(c => c.submittedBy === scope.userId)
        .map(c => c.id),
    );
    return all.filter(t => userConvIds.has(t.convictionId));
  }
}