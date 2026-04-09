import { Citizen } from '@domain/entities/Citizen';

export const SEED_CITIZENS: Citizen[] = [
  {
    id: 'c_001',
    nationalId: 'GA-2026-001234',
    lastName: 'NDONG',
    firstName: 'Jean',
    birthDate: '1985-03-14',
    birthPlace: 'Libreville',
    fatherName: 'Pierre NDONG',
    motherName: 'Cécile MBOUMBA',
    gender: 'M',
    address: '12 avenue du Bord de Mer, Libreville',
    isDiaspora: false,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'c_002',
    nationalId: 'GA-2026-005678',
    lastName: 'ONDO',
    firstName: 'Patricia',
    birthDate: '1990-07-22',
    birthPlace: 'Port-Gentil',
    fatherName: 'André ONDO',
    motherName: 'Gisèle NZAMBA',
    gender: 'F',
    address: '47 rue des Cocotiers, Port-Gentil',
    isDiaspora: false,
    createdAt: '2026-02-03T11:00:00Z',
  },
  {
    id: 'c_003',
    nationalId: 'GA-2024-009999',
    lastName: 'MBOUMBA',
    firstName: 'Serge',
    birthDate: '1978-11-05',
    birthPlace: 'Franceville',
    fatherName: 'Joseph MBOUMBA',
    motherName: 'Thérèse NGUEMA',
    gender: 'M',
    address: '8 rue de la Paix, Paris 75010, France',
    isDiaspora: true,
    createdAt: '2026-01-28T14:00:00Z',
  },
];

// Link : utilisateur citoyen@demo.ga (u_citizen_001) → profil civil c_001
export const CITIZEN_USER_LINKS: Record<string, string> = {
  'u_citizen_001': 'c_001',
};