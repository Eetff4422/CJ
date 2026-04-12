import { ReviewTicketRepository } from '@application/ports/ReviewTicketRepository';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';

const KEY = 'review_tickets';

export class InMemoryReviewTicketRepository implements ReviewTicketRepository {
  private tickets: ReviewTicket[];

  constructor(seed: ReviewTicket[] = []) {
    this.tickets = storage.get<ReviewTicket[]>(KEY) ?? seed;
  }

  async findById(id: string) {
    return this.tickets.find(t => t.id === id) ?? null;
  }

  async findByConvictionId(convictionId: string) {
    return this.tickets.filter(t => t.convictionId === convictionId);
  }

  async findByBulletinId(bulletinId: string) {
    return this.tickets.filter(t => t.bulletinId === bulletinId);
  }

  async findByStatus(status: ReviewTicketStatus) {
    return this.tickets.filter(t => t.status === status);
  }

  async findRoutedToUser(_userId: string) {
    // Le filtrage par saisisseur se fait via ListReviewTicketsUseCase qui croise avec convictions.
    // Cette méthode est volontairement laissée simple ici.
    return this.tickets.filter(t => t.status === ReviewTicketStatus.ROUTED);
  }

  async create(input: Omit<ReviewTicket, 'id' | 'openedAt' | 'status'>): Promise<ReviewTicket> {
    const t: ReviewTicket = {
      ...input,
      id: 'rt_' + crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      status: ReviewTicketStatus.OPEN,
    };
    this.tickets.push(t);
    storage.set(KEY, this.tickets);
    return t;
  }

  async update(id: string, patch: Partial<ReviewTicket>): Promise<ReviewTicket> {
    const idx = this.tickets.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('ReviewTicket not found');
    this.tickets[idx] = { ...this.tickets[idx], ...patch };
    storage.set(KEY, this.tickets);
    return this.tickets[idx];
  }

  async listAll(): Promise<ReviewTicket[]> {
    return [...this.tickets].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }
}