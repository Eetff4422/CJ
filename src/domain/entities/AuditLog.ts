export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  VIEW_FILE = 'VIEW_FILE',
  SUBMIT_BULLETIN_REQUEST = 'SUBMIT_BULLETIN_REQUEST',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  GENERATE_BULLETIN = 'GENERATE_BULLETIN',
  SUBMIT_CONVICTION = 'SUBMIT_CONVICTION',
  VALIDATE_CONVICTION = 'VALIDATE_CONVICTION',
  REJECT_CONVICTION = 'REJECT_CONVICTION',
  PROPOSE_IDENTITY_EDIT = 'PROPOSE_IDENTITY_EDIT',
  VALIDATE_IDENTITY_EDIT = 'VALIDATE_IDENTITY_EDIT',
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  details?: string;
}
