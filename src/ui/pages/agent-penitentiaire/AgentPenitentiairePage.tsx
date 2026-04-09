import { useState, FormEvent } from 'react';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { container } from '@infrastructure/container';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';

export function AgentPenitentiairePage() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [existingConvictions, setExistingConvictions] = useState<Conviction[]>([]);

  const [court, setCourt] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [offense, setOffense] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setCitizen(null);
    setExistingConvictions([]);
    const found = await container.citizenRepository.findByNationalId(
      searchInput.trim()
    );
    if (!found) {
      setSearchError('Aucun citoyen trouvé avec ce numéro d\u2019identification.');
      return;
    }
    setCitizen(found);
    const convs = await container.convictionRepository.findByCitizenId(found.id);
    setExistingConvictions(convs);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !citizen) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);
    const result = await container.submitConvictionUseCase.execute({
      agent: user,
      nationalIdOrCitizenId: citizen.id,
      court,
      decisionDate,
      offense,
      sentence,
    });
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error ?? 'Erreur');
      return;
    }
    setSubmitSuccess(
      `Condamnation enregistrée — en attente de validation par un superviseur.`
    );
    setCourt('');
    setDecisionDate('');
    setOffense('');
    setSentence('');
    // Refresh conviction list
    const convs = await container.convictionRepository.findByCitizenId(citizen.id);
    setExistingConvictions(convs);
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Agent pénitentiaire
        </div>
        <h1 className="text-3xl font-bold text-slate-800">
          Saisie des condamnations
        </h1>
        <p className="text-slate-500 mt-1">
          Recherchez un citoyen par son numéro d'identification national puis
          enregistrez la condamnation prononcée.
        </p>
      </div>

      {/* Search box */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6"
      >
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Numéro d'identification national
        </label>
        <div className="flex gap-2">
          <input
            required
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="GA-2026-000001"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-gabon-accent"
          />
          <button
            type="submit"
            className="bg-gabon-primary hover:bg-gabon-accent text-white font-medium px-5 rounded-lg"
          >
            Rechercher
          </button>
        </div>
        {searchError && (
          <div className="mt-3 text-sm text-red-600">{searchError}</div>
        )}
      </form>

      {citizen && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <div className="font-semibold text-blue-900 mb-2">Citoyen identifié</div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-blue-800">
              <div>
                <span className="text-blue-600">Nom complet :</span>{' '}
                <span className="font-semibold">
                  {citizen.firstName} {citizen.lastName}
                </span>
              </div>
              <div>
                <span className="text-blue-600">N° national :</span>{' '}
                <span className="font-mono font-semibold">{citizen.nationalId}</span>
              </div>
              <div>
                <span className="text-blue-600">Né(e) le :</span> {citizen.birthDate}{' '}
                à {citizen.birthPlace}
              </div>
              <div>
                <span className="text-blue-600">Filiation :</span>{' '}
                {citizen.fatherName} & {citizen.motherName}
              </div>
            </div>
          </div>

          {existingConvictions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
              <h3 className="font-semibold text-slate-800 mb-3">
                Condamnations déjà enregistrées ({existingConvictions.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {existingConvictions.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-3 py-2 border-t border-slate-100"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{c.offense}</div>
                      <div className="text-xs text-slate-500">
                        {c.court} — {new Date(c.decisionDate).toLocaleDateString('fr-FR')}{' '}
                        — {c.sentence}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                        c.status === ConvictionStatus.VALIDATED
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : c.status === ConvictionStatus.PENDING_VALIDATION
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {c.status === ConvictionStatus.VALIDATED
                        ? 'Validée'
                        : c.status === ConvictionStatus.PENDING_VALIDATION
                          ? 'En attente'
                          : 'Rejetée'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
          >
            <h3 className="font-semibold text-slate-800 mb-2">
              Nouvelle condamnation à enregistrer
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Juridiction <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder="Tribunal de première instance de Libreville"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Date de décision <span className="text-red-500">*</span>
                </span>
                <input
                  type="date"
                  required
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Infraction <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={offense}
                  onChange={(e) => setOffense(e.target.value)}
                  placeholder="Vol avec violence"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Peine prononcée <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="2 ans d'emprisonnement"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </label>
            </div>

            {submitError && (
              <div className="text-sm text-red-600">{submitError}</div>
            )}
            {submitSuccess && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                ✔ {submitSuccess}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gabon-primary hover:bg-gabon-accent text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? 'Enregistrement…' : 'Soumettre pour validation'}
              </button>
            </div>
          </form>
        </>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
        <strong>Circuit de validation :</strong> cette saisie entre en file d'attente
        et n'apparaîtra sur aucun bulletin tant qu'un superviseur des condamnations
        ne l'aura pas validée.
      </div>
    </Layout>
  );
}
