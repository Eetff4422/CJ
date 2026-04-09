import { BulletinStatus } from '@domain/entities/Bulletin';

export const BULLETIN_STATUS_LABEL: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]: 'En attente de paiement',
  [BulletinStatus.PENDING_PROCESSING]: 'En cours de traitement',
  [BulletinStatus.ISSUED]: 'Délivré',
  [BulletinStatus.REJECTED]: 'Rejeté',
};

export const BULLETIN_STATUS_BADGE: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]: 'bg-amber-100 text-amber-800 border-amber-200',
  [BulletinStatus.PENDING_PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BulletinStatus.ISSUED]: 'bg-green-100 text-green-800 border-green-200',
  [BulletinStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
};

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
