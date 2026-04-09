import { BulletinPdfGenerator } from '@infrastructure/pdf/BulletinPdfGenerator';
import { InMemoryAuditRepository } from '@infrastructure/repositories/InMemoryAuditRepository';
import { InMemoryAuthRepository } from '@infrastructure/repositories/InMemoryAuthRepository';
import { InMemoryBulletinRepository } from '@infrastructure/repositories/InMemoryBulletinRepository';
import { InMemoryCitizenRepository } from '@infrastructure/repositories/InMemoryCitizenRepository';
import { InMemoryConvictionRepository } from '@infrastructure/repositories/InMemoryConvictionRepository';

import { SEED_BULLETINS } from '@infrastructure/seed/seedBulletins';
import { CITIZEN_USER_LINKS, SEED_CITIZENS } from '@infrastructure/seed/seedCitizens';
import { SEED_CONVICTIONS } from '@infrastructure/seed/seedCondamnations';
import { SEED_USERS } from '@infrastructure/seed/seedUsers';

import { CreateAgentUseCase } from '@application/use-cases/admin/CreateAgentUseCase';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { ListCitizenBulletinsUseCase } from '@application/use-cases/bulletin/ListCitizenBulletinsUseCase';
import { ListPendingBulletinsUseCase } from '@application/use-cases/bulletin/ListPendingBulletinsUseCase';
import { PayBulletinRequestUseCase } from '@application/use-cases/bulletin/PayBulletinRequestUseCase';
import { ProcessBulletinRequestUseCase } from '@application/use-cases/bulletin/ProcessBulletinRequestUseCase';
import { SubmitBulletinRequestUseCase } from '@application/use-cases/bulletin/SubmitBulletinRequestUseCase';
import { VerifyBulletinUseCase } from '@application/use-cases/bulletin/VerifyBulletinUseCase';
import { RegisterCitizenUseCase } from '@application/use-cases/citizen/RegisterCitizenUseCase';
import { ListPendingConvictionsUseCase } from '@application/use-cases/conviction/ListPendingConvictionsUseCase';
import { SubmitConvictionUseCase } from '@application/use-cases/conviction/SubmitConvictionUseCase';
import { ValidateConvictionUseCase } from '@application/use-cases/conviction/ValidateConvictionUseCase';
import { GetGlobalDashboardUseCase } from '@application/use-cases/dashboard/GetGlobalDashboardUseCase';

// ── Injecter les liens citizenId dans les utilisateurs seed ─────────────────
const seededUsers = SEED_USERS.map(u => ({
  ...u,
  citizenId: CITIZEN_USER_LINKS[u.id] ?? undefined,
}));

// ── Repositories ─────────────────────────────────────────────────────────────
const authRepository       = new InMemoryAuthRepository(seededUsers);
const auditRepository      = new InMemoryAuditRepository();
const citizenRepository    = new InMemoryCitizenRepository(SEED_CITIZENS);
const bulletinRepository   = new InMemoryBulletinRepository(SEED_BULLETINS);
const convictionRepository = new InMemoryConvictionRepository(SEED_CONVICTIONS);
const pdfGenerator         = new BulletinPdfGenerator();

// ── Container (point d'entrée unique de toute la logique) ────────────────────
export const container = {
  // Repositories exposés (pour lecture directe depuis les pages UI)
  authRepository,
  auditRepository,
  citizenRepository,
  bulletinRepository,
  convictionRepository,

  // Auth
  loginUseCase:  new LoginUseCase(authRepository, auditRepository),
  logoutUseCase: new LogoutUseCase(auditRepository),

  // Citoyen
  registerCitizenUseCase: new RegisterCitizenUseCase(
    authRepository, citizenRepository, auditRepository
  ),

  // Bulletins
  submitBulletinRequestUseCase: new SubmitBulletinRequestUseCase(
    bulletinRepository, auditRepository
  ),
  payBulletinRequestUseCase: new PayBulletinRequestUseCase(
    bulletinRepository, auditRepository
  ),
  listCitizenBulletinsUseCase:  new ListCitizenBulletinsUseCase(bulletinRepository),
  listPendingBulletinsUseCase:  new ListPendingBulletinsUseCase(bulletinRepository),
  processBulletinRequestUseCase: new ProcessBulletinRequestUseCase(
    bulletinRepository, citizenRepository, convictionRepository,
    auditRepository, pdfGenerator
  ),
  verifyBulletinUseCase: new VerifyBulletinUseCase(
    bulletinRepository, citizenRepository
  ),

  // Condamnations
  submitConvictionUseCase: new SubmitConvictionUseCase(
    convictionRepository, citizenRepository, auditRepository
  ),
  validateConvictionUseCase: new ValidateConvictionUseCase(
    convictionRepository, auditRepository
  ),
  listPendingConvictionsUseCase: new ListPendingConvictionsUseCase(
    convictionRepository
  ),

  // Dashboard DG
  getGlobalDashboardUseCase: new GetGlobalDashboardUseCase(
    bulletinRepository, convictionRepository, citizenRepository
  ),

  // Admin
  createAgentUseCase: new CreateAgentUseCase(authRepository, auditRepository),
};