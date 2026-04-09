import { useEffect, useState, FormEvent } from 'react';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { container } from '@infrastructure/container';
import { User } from '@domain/entities/User';
import { RoleId, ROLES } from '@domain/entities/Role';

const AGENT_ROLES: RoleId[] = [
  RoleId.AGENT_CASIER,
  RoleId.SUPERVISEUR_CASIER,
  RoleId.AGENT_PENITENTIAIRE,
  RoleId.SUPERVISEUR_CONDAMNATIONS,
  RoleId.DIRECTEUR_GENERAL,
  RoleId.ADMIN_TECHNIQUE,
];

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleId>(RoleId.AGENT_CASIER);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const list = await container.authRepository.listAll();
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    const r = await container.createAgentUseCase.execute({
      admin: user,
      email,
      fullName,
      password,
      role,
    });
    setSubmitting(false);
    if (!r.success) {
      setFormError(r.error ?? 'Erreur');
      return;
    }
    setFormSuccess(`Compte créé : ${email}`);
    setEmail('');
    setFullName('');
    setPassword('');
    load();
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Administrateur technique
        </div>
        <h1 className="text-3xl font-bold text-slate-800">
          Gestion des utilisateurs
        </h1>
        <p className="text-slate-500 mt-1">
          Création et supervision des comptes agents du système.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Comptes enregistrés</h2>
            <span className="text-sm text-slate-500">{users.length}</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400">Chargement…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-6 py-3">Nom complet</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Rôle</th>
                  <th className="text-left px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {u.fullName}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {ROLES[u.role].label}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full border ${
                          u.isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {u.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-fit"
        >
          <h2 className="font-semibold text-slate-800 mb-4">
            Créer un compte agent
          </h2>
          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Nom complet
              </span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Mot de passe initial
              </span>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Rôle
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleId)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {AGENT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formError && (
            <div className="mt-3 text-xs text-red-600">{formError}</div>
          )}
          {formSuccess && (
            <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
              ✔ {formSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full bg-gabon-primary hover:bg-gabon-accent text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
