import { RoleId, ROLES } from '@domain/entities/Role';
import { User } from '@domain/entities/User';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Rôles sélectionnables pour la création de comptes agents (exclut CITIZEN)
const AGENT_ROLES: RoleId[] = [
  RoleId.AGENT_CASIER,
  RoleId.SUPERVISEUR_CASIER,
  RoleId.AGENT_PENITENTIAIRE,
  RoleId.SUPERVISEUR_CONDAMNATIONS,
  RoleId.DIRECTEUR_GENERAL,
];

type CreateMode = null | 'AGENT';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Modales de création
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form agent
  const [agEmail, setAgEmail] = useState('');
  const [agPassword, setAgPassword] = useState('');
  const [agFullName, setAgFullName] = useState('');
  const [agRole, setAgRole] = useState<RoleId>(RoleId.AGENT_CASIER);


  const load = async () => {
    setLoading(true);
    const all = await container.authRepository.listAll();
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const closeModal = () => {
  setCreateMode(null);
  setAgEmail(''); setAgPassword(''); setAgFullName(''); setAgRole(RoleId.AGENT_CASIER);
};

  const handleCreateAgent = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const result = await container.createAgentUseCase.execute({
        admin: user,
        email: agEmail,
        password: agPassword,
        fullName: agFullName,
        role: agRole,
      });
      if (!result.success) {
        setNotice({ type: 'err', msg: result.error ?? 'Erreur inconnue.' });
      } else {
        setNotice({ type: 'ok', msg: `✔ Compte ${ROLES[agRole].label} créé — ${agEmail}` });
        closeModal();
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  // Filtrage live
  const q = search.trim().toLowerCase();
  const filtered = q === ''
    ? users
    : users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        ROLES[u.role].label.toLowerCase().includes(q)
      );

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Administration technique
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Gestion des comptes et du référentiel</h1>
        <p className="text-slate-500 mt-1">
          Administrez les comptes et alimentez le référentiel national.
        </p>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          notice.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>{notice.msg}</div>
      )}

      {/* ── Zone 1 : Action de création ──────────────────────────── */}
<div className="mb-6">
  <button
    onClick={() => setCreateMode('AGENT')}
    className="bg-gabon-primary hover:bg-gabon-accent text-white font-semibold px-5 py-3 rounded-lg transition-colors"
  >
    + Créer un compte agent
  </button>
</div>

      {/* ── Zone 2 : Recherche + liste comptes ───────────────────── */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom, email ou rôle…"
        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gabon-accent"
      />

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          Aucun compte ne correspond.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
            <span>Comptes</span>
            <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[32rem] overflow-y-auto">
            {filtered.map(u => (
              <li key={u.id}>
                <button
                  onClick={() => navigate(`/admin/compte/${u.id}`)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{u.fullName}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-600">{ROLES[u.role].label}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Modale création agent ───────────────────────────────── */}
      {createMode === 'AGENT' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Créer un compte agent</h3>
            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet *</label>
                <input type="text" value={agFullName} onChange={e => setAgFullName(e.target.value)} required
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" value={agEmail} onChange={e => setAgEmail(e.target.value)} required
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe *</label>
                <input type="text" value={agPassword} onChange={e => setAgPassword(e.target.value)} required minLength={6}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle *</label>
                <select value={agRole} onChange={e => setAgRole(e.target.value as RoleId)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent">
                  {AGENT_ROLES.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100">Annuler</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gabon-primary hover:bg-gabon-accent disabled:opacity-50 text-white text-sm font-semibold">
                  {submitting ? 'Création…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}