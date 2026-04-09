import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';

export const SEED_CONVICTIONS: Conviction[] = [
  // ── Condamnation validée (apparaît dans le bulletin de c_003) ─────────────
  {
    id: 'cv_001',
    citizenId: 'c_003',
    court: 'Tribunal de Grande Instance de Franceville',
    decisionDate: '2022-06-15',
    offense: 'Conduite sous l\'emprise de l\'alcool — récidive',
    sentence: 'Amende de 500 000 XAF et suspension du permis de conduire 18 mois',
    submittedBy: 'u_agent_peni_001',
    submittedAt: '2026-01-20T09:00:00Z',
    status: ConvictionStatus.VALIDATED,
    validatedBy: 'u_superviseur_cond_001',
    validatedAt: '2026-01-20T15:30:00Z',
  },
  // ── Condamnation en attente de validation (dashboard superviseur) ─────────
  {
    id: 'cv_002',
    citizenId: 'c_002',
    court: 'Tribunal Correctionnel de Port-Gentil',
    decisionDate: '2026-03-28',
    offense: 'Escroquerie — article 228 du Code pénal gabonais',
    sentence: 'Emprisonnement de 6 mois avec sursis — amende de 200 000 XAF',
    submittedBy: 'u_agent_peni_001',
    submittedAt: '2026-04-02T10:00:00Z',
    status: ConvictionStatus.PENDING_VALIDATION,
  },
  // ── Condamnation en attente de validation (deuxième entrée) ──────────────
  {
    id: 'cv_003',
    citizenId: 'c_003',
    court: 'Cour d\'Appel de Libreville',
    decisionDate: '2026-02-10',
    offense: 'Violation de domicile — article 174 CP',
    sentence: 'Amende de 150 000 XAF',
    submittedBy: 'u_agent_peni_001',
    submittedAt: '2026-04-05T14:00:00Z',
    status: ConvictionStatus.PENDING_VALIDATION,
  },
];