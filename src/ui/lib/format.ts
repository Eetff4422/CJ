import { Bulletin, BULLETIN_VALIDITY_MONTHS, BulletinStatus } from '@domain/entities/Bulletin';

export const BULLETIN_STATUS_LABEL: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]: 'En attente de paiement',
  [BulletinStatus.PENDING_PROCESSING]: 'En cours de traitement',
  [BulletinStatus.UNDER_DEEP_REVIEW]: 'Vérification approfondie en cours',
  [BulletinStatus.ISSUED]: 'Délivré',
  [BulletinStatus.REJECTED]: 'Rejeté',
};

export const BULLETIN_STATUS_BADGE: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]: 'bg-amber-100 text-amber-800 border-amber-200',
  [BulletinStatus.PENDING_PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BulletinStatus.UNDER_DEEP_REVIEW]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [BulletinStatus.ISSUED]: 'bg-green-100 text-green-800 border-green-200',
  [BulletinStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
};

/** Statuts qui bloquent la création d'une nouvelle demande du même type */
export const BLOCKING_BULLETIN_STATUSES: BulletinStatus[] = [
  BulletinStatus.PENDING_PAYMENT,
  BulletinStatus.PENDING_PROCESSING,
  BulletinStatus.UNDER_DEEP_REVIEW,
];

/** Calcule la date d'expiration d'un bulletin délivré (issuedAt + 6 mois) */
export function getBulletinExpiryDate(bulletin: Bulletin): Date | null {
  if (!bulletin.issuedAt) return null;
  const d = new Date(bulletin.issuedAt);
  d.setMonth(d.getMonth() + BULLETIN_VALIDITY_MONTHS);
  return d;
}

/** Vrai si le bulletin est délivré ET sa date d'expiration est passée */
export function isBulletinExpired(bulletin: Bulletin): boolean {
  if (bulletin.status !== BulletinStatus.ISSUED) return false;
  const expiry = getBulletinExpiryDate(bulletin);
  if (!expiry) return false;
  return new Date() > expiry;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}