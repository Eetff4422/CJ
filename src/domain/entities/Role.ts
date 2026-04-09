/**
 * Les 7 rôles du système SGCJ-Gabon, conformes à la section 7 de la note stratégique.
 * Chaque rôle est associé à un ensemble de permissions.
 */
export enum RoleId {
  CITIZEN = 'CITIZEN',
  AGENT_CASIER = 'AGENT_CASIER',
  SUPERVISEUR_CASIER = 'SUPERVISEUR_CASIER',
  DIRECTEUR_GENERAL = 'DIRECTEUR_GENERAL',
  AGENT_PENITENTIAIRE = 'AGENT_PENITENTIAIRE',
  SUPERVISEUR_CONDAMNATIONS = 'SUPERVISEUR_CONDAMNATIONS',
  ADMIN_TECHNIQUE = 'ADMIN_TECHNIQUE',
}

export enum Permission {
  // Citizen
  SUBMIT_BULLETIN_REQUEST = 'SUBMIT_BULLETIN_REQUEST',
  VIEW_OWN_REQUESTS = 'VIEW_OWN_REQUESTS',

  // Agent casier
  VIEW_BULLETIN_QUEUE = 'VIEW_BULLETIN_QUEUE',
  GENERATE_BULLETIN = 'GENERATE_BULLETIN',
  PROPOSE_IDENTITY_EDIT = 'PROPOSE_IDENTITY_EDIT',

  // Superviseur casier
  VALIDATE_IDENTITY_EDIT = 'VALIDATE_IDENTITY_EDIT',
  VIEW_CASIER_STATS = 'VIEW_CASIER_STATS',
  MANAGE_CASIER_TEAM = 'MANAGE_CASIER_TEAM',

  // DG
  VIEW_GLOBAL_DASHBOARD = 'VIEW_GLOBAL_DASHBOARD',
  VIEW_GLOBAL_AUDIT_LOG = 'VIEW_GLOBAL_AUDIT_LOG',

  // Agent pénitentiaire
  SUBMIT_CONVICTION = 'SUBMIT_CONVICTION',
  VIEW_RESTRICTED_FILES = 'VIEW_RESTRICTED_FILES',

  // Superviseur condamnations
  VALIDATE_CONVICTION = 'VALIDATE_CONVICTION',

  // Admin technique
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
}

export interface Role {
  id: RoleId;
  label: string;
  description: string;
  permissions: Permission[];
  homeRoute: string;
}

export const ROLES: Record<RoleId, Role> = {
  [RoleId.CITIZEN]: {
    id: RoleId.CITIZEN,
    label: 'Citoyen',
    description: 'Utilisateur du portail public — soumet ses demandes de Bulletin n°3',
    permissions: [Permission.SUBMIT_BULLETIN_REQUEST, Permission.VIEW_OWN_REQUESTS],
    homeRoute: '/citoyen',
  },
  [RoleId.AGENT_CASIER]: {
    id: RoleId.AGENT_CASIER,
    label: 'Agent du casier judiciaire',
    description: 'Traite les demandes citoyennes et génère les bulletins',
    permissions: [
      Permission.VIEW_BULLETIN_QUEUE,
      Permission.GENERATE_BULLETIN,
      Permission.PROPOSE_IDENTITY_EDIT,
    ],
    homeRoute: '/agent-casier',
  },
  [RoleId.SUPERVISEUR_CASIER]: {
    id: RoleId.SUPERVISEUR_CASIER,
    label: 'Superviseur du casier judiciaire',
    description: 'Valide les modifications sensibles et supervise l\u2019équipe casier',
    permissions: [
      Permission.VIEW_BULLETIN_QUEUE,
      Permission.VALIDATE_IDENTITY_EDIT,
      Permission.VIEW_CASIER_STATS,
      Permission.MANAGE_CASIER_TEAM,
    ],
    homeRoute: '/superviseur-casier',
  },
  [RoleId.DIRECTEUR_GENERAL]: {
    id: RoleId.DIRECTEUR_GENERAL,
    label: 'Directeur Général',
    description: 'Vue transversale, tableaux de bord consolidés, journal d\u2019audit global',
    permissions: [Permission.VIEW_GLOBAL_DASHBOARD, Permission.VIEW_GLOBAL_AUDIT_LOG],
    homeRoute: '/dg',
  },
  [RoleId.AGENT_PENITENTIAIRE]: {
    id: RoleId.AGENT_PENITENTIAIRE,
    label: 'Agent pénitentiaire',
    description: 'Saisit les condamnations prononcées (en attente de validation)',
    permissions: [Permission.SUBMIT_CONVICTION, Permission.VIEW_RESTRICTED_FILES],
    homeRoute: '/agent-penitentiaire',
  },
  [RoleId.SUPERVISEUR_CONDAMNATIONS]: {
    id: RoleId.SUPERVISEUR_CONDAMNATIONS,
    label: 'Superviseur des condamnations',
    description: 'Valide les condamnations saisies par les agents pénitentiaires',
    permissions: [Permission.VALIDATE_CONVICTION],
    homeRoute: '/superviseur-condamnations',
  },
  [RoleId.ADMIN_TECHNIQUE]: {
    id: RoleId.ADMIN_TECHNIQUE,
    label: 'Administrateur technique',
    description: 'Gère les comptes, les paramètres généraux et le support',
    permissions: [Permission.MANAGE_USERS, Permission.MANAGE_SYSTEM_SETTINGS],
    homeRoute: '/admin',
  },
};

export function hasPermission(role: RoleId, permission: Permission): boolean {
  return ROLES[role].permissions.includes(permission);
}
