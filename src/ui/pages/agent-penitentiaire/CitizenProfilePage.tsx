import { AuditAction } from '@domain/entities/AuditLog';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CONVICTION_STATUS_LABEL: Record<ConvictionStatus, string> = {
  [ConvictionStatus.PENDING_VALIDATION]: 'En attente de validation',
  [ConvictionStatus.VALIDATED]: 'Validée',
  [ConvictionStatus.REJECTED]: 'Rejetée',
  [ConvictionStatus.UNDER_REVIEW]: 'Vérification approfondie',
};

const CONVICTION_STATUS_COLOR: Record<ConvictionStatus, string> = {
  [ConvictionStatus.PENDING_VALIDATION]: 'bg-blue-100 text-blue-800',
  [ConvictionStatus.VALIDATED]: 'bg-green-100 text-green-800',
  [ConvictionStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ConvictionStatus.UNDER_REVIEW]: 'bg-amber-100 text-amber-800',
};

export function CitizenProfilePage() {
  const { citizenId } = useParams<{ citizenId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [convictions, setConvictions] = useState<Conviction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Formulaire ajout
  const [showForm, setShowForm] = useState(false);
  const [court, setCourt] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [offense, setOffense] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    if (!citizenId || !user) return;
    setLoading(true);
    const c = await container.citizenRepository.findById(citizenId);
    if (!c) { setNotFound(true); setLoading(false); return; }
    setCitizen(c);
    const convs = await container.convictionRepository.findByCitizenId(citizenId);
    setConvictions(convs);
    setLoading(false);
  };

  // Audit log obligatoire à chaque ouverture
  useEffect(() => {
    if (!citizenId || !user) return;
    container.auditRepository.append({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.VIEW_CITIZEN_PROFILE,
      targetType: 'Citizen',
      targetId: citizenId,
      details: `Profil citoyen consulté`,
    });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenId, user]);

  const resetForm = () => {
    setCourt(''); setDecisionDate(''); setOffense(''); setSentence('');
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!user || !citizen) return;
  if (!court.trim() || !decisionDate || !offense.trim() || !sentence.trim()) {
    setNotice({ type: 'err', msg: 'Tous les champs sont obligatoires.' });
    return;
  }
  setSubmitting(true);
  try {
    const result = await container.submitConvictionUseCase.execute({
      agent: user,
      nationalIdOrCitizenId: citizen.id,
      court: court.trim(),
      decisionDate,
      offense: offense.trim(),
      sentence: sentence.trim(),
    });
    if (!result.success) {
      setNotice({ type: 'err', msg: result.error ?? 'Erreur lors de la soumission.' });
    } else {
      setNotice({ type: 'ok', msg: '✔ Condamnation soumise — en attente de validation.' });
      resetForm();
      setShowForm(false);
      await load();
    }
  } catch (err: any) {
    setNotice({ type: 'err', msg: err.message ?? 'Erreur inattendue.' });
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <Layout><div className="text-slate-400 text-sm">Chargement…</div></Layout>;

  if (notFound || !citizen) {
    return (
      <Layout>
        <button onClick={() => navigate('/agent-penitentiaire')} className="text-sm text-gabon-primary hover:underline mb-4">
          ← Retour à la base
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Citoyen introuvable.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        onClick={() => navigate('/agent-penitentiaire')}
        className="text-sm text-gabon-primary hover:underline mb-4"
      >
        ← Retour à la base
      </button>

      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Profil citoyen
        </div>
        <h1 className="text-3xl font-bold text-slate-800">
          {citizen.lastName.toUpperCase()} {citizen.firstName}
        </h1>
        <div className="font-mono text-sm text-slate-500 mt-1">{citizen.nationalId}</div>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          notice.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>{notice.msg}</div>
      )}

      {/* ── Identité civile ────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Identité civile</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><span className="text-slate-500">Nom :</span> <span className="font-semibold">{citizen.lastName}</span></div>
          <div><span className="text-slate-500">Prénom :</span> <span className="font-semibold">{citizen.firstName}</span></div>
          <div><span className="text-slate-500">Sexe :</span> {citizen.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
          <div><span className="text-slate-500">Date de naissance :</span> {citizen.birthDate}</div>
          <div><span className="text-slate-500">Lieu de naissance :</span> {citizen.birthPlace}</div>
          <div><span className="text-slate-500">N° national :</span> <span className="font-mono">{citizen.nationalId}</span></div>
          <div><span className="text-slate-500">Père :</span> {citizen.fatherName}</div>
          <div><span className="text-slate-500">Mère :</span> {citizen.motherName}</div>
          <div className="col-span-2"><span className="text-slate-500">Adresse :</span> {citizen.address}</div>
        </div>
      </section>

      {/* ── Condamnations ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Condamnations ({convictions.length})
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gabon-primary hover:bg-gabon-accent text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Ajouter une condamnation
            </button>
          )}
        </div>

        {/* Formulaire inline */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Juridiction *</label>
                <input
                  type="text" value={court} onChange={e => setCourt(e.target.value)}
                  placeholder="Tribunal de Libreville"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date de décision *</label>
                <input
                  type="date" value={decisionDate} onChange={e => setDecisionDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Infraction *</label>
                <input
                  type="text" value={offense} onChange={e => setOffense(e.target.value)}
                  placeholder="Vol simple"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peine *</label>
                <input
                  type="text" value={sentence} onChange={e => setSentence(e.target.value)}
                  placeholder="6 mois avec sursis"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); setNotice(null); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-gabon-primary hover:bg-gabon-accent disabled:opacity-50 text-white text-sm font-semibold"
              >
                {submitting ? 'Soumission…' : 'Soumettre la condamnation'}
              </button>
            </div>
          </form>
        )}

        {/* Liste */}
        {convictions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aucune condamnation enregistrée pour ce citoyen.
          </div>
        ) : (
          <div className="space-y-2">
            {convictions.map(cv => (
              <div key={cv.id} className="border border-slate-200 rounded-lg p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{cv.offense}</div>
                    <div className="text-slate-600 mt-0.5">{cv.court} — {cv.decisionDate}</div>
                    <div className="text-slate-600">Peine : {cv.sentence}</div>
                  </div>
                  <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${CONVICTION_STATUS_COLOR[cv.status]}`}>
                    {CONVICTION_STATUS_LABEL[cv.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}