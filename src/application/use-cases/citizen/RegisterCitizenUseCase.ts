import { UserRepository } from '@application/ports/UserRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { RoleId } from '@domain/entities/Role';
import { User } from '@domain/entities/User';
import { Citizen } from '@domain/entities/Citizen';
import { NationalId } from '@domain/value-objects/NationalId';
import { AuditAction } from '@domain/entities/AuditLog';

export interface RegisterCitizenInput {
  email: string;
  password: string;
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

export interface RegisterCitizenResult {
  success: boolean;
  user?: User;
  citizen?: Citizen;
  error?: string;
}

/**
 * MVP-only flow: a citizen self-registers and creates both their User account
 * and their Citizen record. In production, citizens would be pre-existing in
 * the national database (created by an agent) and would only "activate" their
 * account using their existing national ID.
 */
export class RegisterCitizenUseCase {
  constructor(
    private userRepo: UserRepository,
    private citizenRepo: CitizenRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute(input: RegisterCitizenInput): Promise<RegisterCitizenResult> {
    const email = input.email.toLowerCase().trim();

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cet email.' };
    }

    if (input.password.length < 6) {
      return {
        success: false,
        error: 'Le mot de passe doit comporter au moins 6 caractères.',
      };
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

    const user = await this.userRepo.create({
      email,
      fullName: `${input.firstName.trim()} ${input.lastName.trim().toUpperCase()}`,
      role: RoleId.CITIZEN,
      passwordHash: btoa(input.password),
      isActive: true,
      citizenId: citizen.id,
    });

    await this.auditRepo.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.LOGIN,
      details: `Inscription citoyen — ${citizen.nationalId}`,
    });

    return { success: true, user, citizen };
  }
}
