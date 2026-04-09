import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@ui/contexts/AuthContext';
import { ROLES, RoleId } from '@domain/entities/Role';
import { SEED_USERS } from '@infrastructure/seed/seedUsers';
import { container } from '@infrastructure/container';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      // Use the resolved user from auth context — covers both seed and registered users
      const u = await container.authRepository.findByEmail(email.toLowerCase().trim());
      navigate(u ? ROLES[u.role].homeRoute : '/');
    } else {
      setError(result.error ?? 'Erreur de connexion.');
    }
  };

  const quickLogin = (roleId: RoleId) => {
    const demoUser = SEED_USERS.find((u) => u.role === roleId);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword('demo2026');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left column — branding */}
        <div className="bg-gabon-primary text-white p-10 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/60 mb-2">
              République Gabonaise · Ministère de la Justice
            </div>
            <h1 className="text-4xl font-bold mb-2">SGCJ-Gabon</h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Système de Gestion du Casier Judiciaire
            </p>
            <div className="text-xs text-white/60 italic border-l-2 border-white/30 pl-4">
              Centralisation des données — Digitalisation du service — Souveraineté
              numérique
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/20 text-xs text-white/60">
            <div className="font-semibold text-white/80 mb-1">
              MVP de présentation
            </div>
            <div>Version 0.1 · Avril 2026 · Esno Poly Services</div>
          </div>
        </div>

        {/* Right column — login form */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Connexion</h2>
          <p className="text-sm text-slate-500 mb-6">
            Identifiez-vous pour accéder au système.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gabon-accent focus:border-transparent"
                placeholder="exemple@justice.ga"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gabon-accent focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gabon-primary hover:bg-gabon-accent text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="text-center text-sm text-slate-500 pt-1">
              Pas encore de compte ?{' '}
              <Link
                to="/inscription"
                className="text-gabon-accent hover:underline font-medium"
              >
                Créer un compte citoyen
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Comptes de démonstration
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Cliquez sur un rôle pour pré-remplir les identifiants. Mot de passe
              unique : <code className="bg-slate-100 px-1.5 py-0.5 rounded">demo2026</code>
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(ROLES).map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => quickLogin(role.id)}
                  className="text-left px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                >
                  <span className="font-medium text-slate-700">{role.label}</span>
                  <span className="text-slate-400 ml-2">
                    {SEED_USERS.find((u) => u.role === role.id)?.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
