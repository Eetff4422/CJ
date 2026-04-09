export interface Citizen {
  id: string;
  nationalId: string; // numéro d'identification national
  lastName: string;
  firstName: string;
  birthDate: string; // ISO
  birthPlace: string;
  fatherName: string;
  motherName: string;
  gender: 'M' | 'F';
  address: string;
  isDiaspora: boolean;
  createdAt: string;
}
