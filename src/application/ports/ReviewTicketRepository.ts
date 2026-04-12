import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';

export interface ReviewTicketRepository {
  findById(id: string): Promise<ReviewTicket | null>;
  findByConvictionId(convictionId: string): Promise<ReviewTicket[]>;
  findByBulletinId(bulletinId: string): Promise<ReviewTicket[]>;
  findByStatus(status: ReviewTicketStatus): Promise<ReviewTicket[]>;
  findRoutedToUser(userId: string): Promise<ReviewTicket[]>;
  create(t: Omit<ReviewTicket, 'id' | 'openedAt' | 'status'>): Promise<ReviewTicket>;
  update(id: string, patch: Partial<ReviewTicket>): Promise<ReviewTicket>;
  listAll(): Promise<ReviewTicket[]>;
}