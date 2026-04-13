import { AuditRepository } from '@application/ports/AuditRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { AuditAction } from '@domain/entities/AuditLog';
import { User } from '@domain/entities/User';
import { NationalId } from '@domain/value-objects/NationalId';

export interface CreateCitizenByAdminInput {
  admin: User;
  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  fatherName: string;
  motherName: string;
  gender: 'M' | 'F';
  address: string;
  isDiaspora: boolean;
}

export class CreateCitizenByAdminUseCase {
  constructor(
    private citizenRepo: CitizenRepository,
    private auditRepo: AuditRepository,
  ) {}

  async execute(input: CreateCitizenByAdminInput) {
    if (!input.lastName.trim() || !input.firstName.trim() || !input.birthDate
      || !input.birthPlace.trim() || !input.fatherName.trim() || !input.motherName.trim()
      || !input.address.trim()) {
      return { success: false, error: 'Tous les champs sont obligatoires.' };
    }

    const citizen = await this.citizenRepo.create({
      nationalId: NationalId.generate(),
      lastName: input.lastName.trim().toUpperCase(),
      firstName: input.firstName.trim(),
      birthDate: input.birthDate,
      birthPlace: input.birthPlace.trim(),
      fatherName: input.fatherName.trim(),
      motherName: input.motherName.trim(),
      gender: input.gender,
      address: input.address.trim(),
      isDiaspora: input.isDiaspora,
    });

    await this.auditRepo.append({
      userId: input.admin.id,
      userEmail: input.admin.email,
      userRole: input.admin.role,
      action: AuditAction.CREATE_CITIZEN_BY_ADMIN,
      targetType: 'Citizen',
      targetId: citizen.id,
      details: `Création entrée référentiel : ${citizen.firstName} ${citizen.lastName} — ${citizen.nationalId}`,
    });

    return { success: true, citizen };
  }
}