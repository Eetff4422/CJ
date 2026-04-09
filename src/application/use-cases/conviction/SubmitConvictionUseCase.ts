import { ConvictionRepository } from '@application/ports/ConvictionRepository';
import { CitizenRepository } from '@application/ports/CitizenRepository';
import { AuditRepository } from '@application/ports/AuditRepository';
import { Conviction } from '@domain/entities/Conviction';
import { User } from '@domain/entities/User';
import { AuditAction } from '@domain/entities/AuditLog';

export interface SubmitConvictionInput {
  agent: User;
  nationalIdOrCitizenId: string;
  court: string;
  decisionDate: string;
  offense: string;
  sentence: string;
}

export interface SubmitConvictionResult {
  success: boolean;
  conviction?: Conviction;
  error?: string;
}

export class SubmitConvictionUseCase {
  constructor(
    private convictionRepo: ConvictionRepository,
    private citizenRepo: CitizenRepository,
    private auditRepo: AuditRepository
  ) {}

  async execute(input: SubmitConvictionInput): Promise<SubmitConvictionResult> {
    // Resolve citizen by ID or national ID
    let citizen = await this.citizenRepo.findById(input.nationalIdOrCitizenId);
    if (!citizen) {
      citizen = await this.citizenRepo.findByNationalId(
        input.nationalIdOrCitizenId
      );
    }
    if (!citizen) {
      return { success: false, error: 'Citoyen introuvable.' };
    }

    if (
      !input.court.trim() ||
      !input.offense.trim() ||
      !input.sentence.trim() ||
      !input.decisionDate
    ) {
      return { success: false, error: 'Tous les champs sont obligatoires.' };
    }

    const conviction = await this.convictionRepo.create({
      citizenId: citizen.id,
      court: input.court.trim(),
      decisionDate: input.decisionDate,
      offense: input.offense.trim(),
      sentence: input.sentence.trim(),
      submittedBy: input.agent.id,
    });

    await this.auditRepo.append({
      userId: input.agent.id,
      userEmail: input.agent.email,
      userRole: input.agent.role,
      action: AuditAction.SUBMIT_CONVICTION,
      targetType: 'Conviction',
      targetId: conviction.id,
      details: `Saisie condamnation pour ${citizen.firstName} ${citizen.lastName} (${citizen.nationalId}) — en attente de validation`,
    });

    return { success: true, conviction };
  }
}
