import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { container } from '@infrastructure/container';

const REASONS = [
  "Procédure administrative au Gabon",
  "Procédure administrative à l'étranger",
  'Candidature à la fonction publique',
  'Demande de visa',
  'Procédure d\u2019adoption',
  'Démarche professionnelle',
  'Autre',
];

export function NewBulletinRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [identityDocument, setIdentityDocument] = useState(false);
  const [proofOfAddress, setProofOfAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const finalReason = reason === 'Autre' ? customReason : reason;
    const result = await container.submitBulletinRequestUseCase.execute({
      user,
      reason: finalReason,
      justifications: { identityDocument, proofOfAddress },
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Erreur');
      return;
    }
    if (result.bulletin) {
      navigate(`/citoyen/paiement/${result.bulletin.id}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            to="/citoyen"
            className="text-sm text-gabon-accent hover:underline"
          >
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Nouvelle demande de Bulletin n°3
          </h1>
          <p className="text-slate-500 mt-1">
            Renseignez le motif de la demande et confirmez vos pièces justificatives.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Motif de la demande <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gabon-accent"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reason === 'Autre' && (
              <input
                placeholder="Précisez le motif"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gabon-accent"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pièces justificatives <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={identityDocument}
                  onChange={(e) => setIdentityDocument(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="text-sm">
                  <div className="font-medium text-slate-800">
                    Pièce d'identité en cours de validité
                  </div>
                  <div className="text-slate-500 text-xs">
                    CNI, passeport ou titre de séjour. Sera vérifiée par l'agent du
                    casier.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proofOfAddress}
                  onChange={(e) => setProofOfAddress(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="text-sm">
                  <div className="font-medium text-slate-800">
                    Justificatif de domicile
                  </div>
                  <div className="text-slate-500 text-xs">
                    Facture, attestation de résidence, etc.
                  </div>
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              💡 Dans cette version de démonstration, vous confirmez simplement la
              possession des pièces. Le vrai téléversement sera ajouté dans une
              version ultérieure.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/citoyen"
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gabon-primary hover:bg-gabon-accent text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Envoi…' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
