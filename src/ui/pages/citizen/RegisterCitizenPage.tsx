import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { container } from '@infrastructure/container';
import { useAuth } from '@ui/contexts/AuthContext';

export function RegisterCitizenPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    lastName: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    fatherName: '',
    motherName: '',
    gender: 'M' as 'M' | 'F',
    address: '',
    isDiaspora: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await container.registerCitizenUseCase.execute(form);
    if (!result.success) {
      setError(result.error ?? 'Une erreur est survenue.');
      setSubmitting(false);
      return;
    }
    // Auto-login after registration
    const loginResult = await login(form.email, form.password);
    setSubmitting(false);
    if (loginResult.ok) navigate('/citoyen');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gabon-primary text-white px-8 py-6">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
            République Gabonaise · Ministère de la Justice
          </div>
          <h1 className="text-2xl font-bold">Création d'un compte citoyen</h1>
          <p className="text-sm text-white/80 mt-1">
            Renseignez vos informations pour pouvoir demander votre Bulletin n°3 en ligne.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gabon-accent uppercase tracking-wider mb-3">
              Identifiants de connexion
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Adresse email" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Mot de passe (≥ 6 caractères)" required>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gabon-accent uppercase tracking-wider mb-3">
              État civil
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom" required>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Prénom" required>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Date de naissance" required>
                <input
                  type="date"
                  required
                  value={form.birthDate}
                  onChange={(e) => set('birthDate', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Lieu de naissance" required>
                <input
                  required
                  value={form.birthPlace}
                  onChange={(e) => set('birthPlace', e.target.value)}
                  className={inputClass}
                  placeholder="Libreville"
                />
              </Field>
              <Field label="Nom du père" required>
                <input
                  required
                  value={form.fatherName}
                  onChange={(e) => set('fatherName', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Nom de la mère" required>
                <input
                  required
                  value={form.motherName}
                  onChange={(e) => set('motherName', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Sexe" required>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value as 'M' | 'F')}
                  className={inputClass}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </Field>
              <Field label="Adresse" required>
                <input
                  required
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDiaspora}
                onChange={(e) => set('isDiaspora', e.target.checked)}
                className="rounded"
              />
              Je réside à l'étranger (diaspora)
            </label>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/login"
              className="text-sm text-gabon-accent hover:underline"
            >
              ← Retour à la connexion
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gabon-primary hover:bg-gabon-accent text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Création…' : 'Créer mon compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gabon-accent focus:border-transparent text-sm';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
