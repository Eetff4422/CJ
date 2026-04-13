import { AuditAction } from '@domain/entities/AuditLog';
import { RoleId, ROLES } from '@domain/entities/Role';
import { User } from '@domain/entities/User';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { formatDateTime } from '@ui/lib/format';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AGENT_ROLES: RoleId[] = [
  RoleId.AGENT_CASIER,
  RoleId.SUPERVISEUR_CASIER,
  RoleId.AGENT_PENITENTIAIRE,
  RoleId.SUPERVISEUR_CONDAMNATIONS,
  RoleId.DIRECTEUR_GENERAL,
  RoleId.ADMIN_TECHNIQUE,
];

export function AdminAccountProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [target, setTarget] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Édition
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<RoleId>(RoleId.AGENT_CASIER);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    if (!userId || !currentUser) return;
    setLoading(true);
    const u = await container.authRepository.findById(userId);
    if (!u) { setNotFound(true); setLoading(false); return; }
    setTarget(u);
    setEditName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role);
    setLoading(false);
  };

  // Audit log obligatoire à chaque ouverture
  useEffect(() => {
    if (!userId || !currentUser) return;
    container.auditRepository.append({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: AuditAction.VIEW_USER_PROFILE,
      targetType: 'User',
      targetId: userId,
      details: 'Profil compte consulté',
    });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUser]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !target) return;
    setSubmitting(true);
    try {
      const result = await container.updateUserUseCase.execute({
        admin: currentUser,
        targetUserId: target.id,
        fullName: editName,
        email: editEmail,
        role: editRole,
      });
      if (!result.success) {
        setNotice({ type: 'err', msg: result.error ?? 'Erreur inconnue.' });
      } else {
        setNotice({ type: 'ok', msg: '✔ Modifications enregistrées.' });
        await load();
      }
    } catch (err: any) {
      setNotice({ type: 'err', msg: err.message ?? 'Erreur inattendue.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!currentUser || !target) return;
    setToggling(true);
    try {
      const result = await container.toggleUserActiveUseCase.execute({
        admin: currentUser,
        targetUserId: target.id,
      });
      if (!result.success) {
        setNotice({ type: 'err', msg: result.error ?? 'Erreur inconnue.' });
      } else {
        setNotice({ type: 'ok', msg: result.user?.isActive ? '✔ Compte réactivé.' : '✔ Compte désactivé.' });
        await load();
      }
    } catch (err: any) {
      setNotice({ type: 'err', msg: err.message ?? 'Erreur inattendue.' });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Layout><div className="text-slate-400 text-sm">Chargement…</div></Layout>;

  if (notFound || !target) {
    return (
      <Layout>
        <button onClick={() => navigate('/admin')} className="text-sm text-gabon-primary hover:underline mb-4">
          ← Retour à la liste
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Compte introuvable.
        </div>
      </Layout>
    );
  }

  const isSelf = currentUser?.id === target.id;
  const isCitizen = target.role === RoleId.CITIZEN;

  return (
    <Layout>
      <button
        onClick={() => navigate('/admin')}
        className="text-sm text-gabon-primary hover:underline mb-4"
      >
        ← Retour à la liste
      </button>

      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Profil compte
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{target.fullName}</h1>
        <div className="text-slate-500 text-sm mt-1">{target.email}</div>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          notice.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>{notice.msg}</div>
      )}

      {/* ── Bandeau identité ────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Informations du compte</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><span className="text-slate-500">Rôle actuel :</span> <span className="font-semibold">{ROLES[target.role].label}</span></div>
          <div>
            <span className="text-slate-500">Statut :</span>{' '}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              target.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {target.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="col-span-2"><span className="text-slate-500">Créé le :</span> {formatDateTime(target.createdAt)}</div>
          {target.citizenId && (
            <div className="col-span-2">
              <span className="text-slate-500">Dossier citoyen rattaché :</span>{' '}
              <span className="font-mono">{target.citizenId}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Édition ────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Modifier les informations</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet *</label>
            <input
              type="text" value={editName} onChange={e => setEditName(e.target.value)} required
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
            <input
              type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle *</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value as RoleId)}
              disabled={isCitizen}
              title={isCitizen ? 'Les comptes citoyens ne changent pas de rôle' : ''}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent disabled:bg-slate-50 disabled:text-slate-400"
            >
              {isCitizen ? (
                <option value={RoleId.CITIZEN}>{ROLES[RoleId.CITIZEN].label}</option>
              ) : (
                AGENT_ROLES.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)
              )}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-gabon-primary hover:bg-gabon-accent disabled:opacity-50 text-white text-sm font-semibold"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Activation / désactivation ─────────────────────────── */}
      {!isSelf && (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Statut du compte</h2>
          <p className="text-xs text-slate-500 mb-4">
            {target.isActive
              ? 'La désactivation empêche la connexion mais conserve l\'historique du compte.'
              : 'La réactivation restaure l\'accès au compte sans modifier son historique.'}
          </p>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-5 py-2 rounded-lg disabled:opacity-50 text-white text-sm font-semibold ${
              target.isActive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {toggling
              ? 'Traitement…'
              : target.isActive
                ? 'Désactiver le compte'
                : 'Réactiver le compte'}
          </button>
        </section>
      )}

      {isSelf && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Vous consultez votre propre profil — l'activation/désactivation est bloquée par sécurité.
        </section>
      )}
    </Layout>
  );
}