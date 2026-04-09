import { User } from '@domain/entities/User';
import { RoleId } from '@domain/entities/Role';

/**
 * Demo users — one per role.
 * Default password for ALL demo accounts: "demo2026"
 * (base64-encoded below — this is NOT production security)
 */
const DEMO_PASSWORD_HASH = btoa('demo2026');

export const SEED_USERS: User[] = [
  {
    id: 'u_citizen_001',
    email: 'citoyen@demo.ga',
    fullName: 'Jean NDONG',
    role: RoleId.CITIZEN,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-15T09:00:00Z',
    isActive: true,
  },
  {
    id: 'u_agent_casier_001',
    email: 'agent.casier@justice.ga',
    fullName: 'Marie OBAME',
    role: RoleId.AGENT_CASIER,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: 'u_superviseur_casier_001',
    email: 'superviseur.casier@justice.ga',
    fullName: 'Paul MBA',
    role: RoleId.SUPERVISEUR_CASIER,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: 'u_dg_001',
    email: 'dg@justice.ga',
    fullName: 'Sylvie NZENG',
    role: RoleId.DIRECTEUR_GENERAL,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: 'u_agent_peni_001',
    email: 'agent.penitentiaire@justice.ga',
    fullName: 'Éric BIYOGHÉ',
    role: RoleId.AGENT_PENITENTIAIRE,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: 'u_superviseur_cond_001',
    email: 'superviseur.condamnations@justice.ga',
    fullName: 'Clarisse ONDO',
    role: RoleId.SUPERVISEUR_CONDAMNATIONS,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: 'u_admin_001',
    email: 'admin@justice.ga',
    fullName: 'Admin Technique',
    role: RoleId.ADMIN_TECHNIQUE,
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: '2026-01-10T08:00:00Z',
    isActive: true,
  },
];
