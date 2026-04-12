import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { ConvictionStatus } from '@domain/entities/Conviction';
import { container } from '@infrastructure/container';
import { BulletinPdfGenerator } from '@infrastructure/pdf/BulletinPdfGenerator';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import {
  BLOCKING_BULLETIN_STATUSES,
  formatDate,
  formatDateTime,
  getBulletinExpiryDate,
  isBulletinExpired,
} from '@ui/lib/format';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
const STATUS_LABELS: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]:    'En attente de paiement',
  [BulletinStatus.PENDING_PROCESSING]: 'En cours de traitement',
  [BulletinStatus.UNDER_DEEP_REVIEW]:  'Vérification approfondie en cours',
  [BulletinStatus.ISSUED]:             'Délivré',
  [BulletinStatus.REJECTED]:           'Rejeté',
};

const STATUS_COLORS: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]:    'bg-yellow-100 text-yellow-800',
  [BulletinStatus.PENDING_PROCESSING]: 'bg-blue-100 text-blue-800',
  [BulletinStatus.UNDER_DEEP_REVIEW]:  'bg-indigo-100 text-indigo-800',
  [BulletinStatus.ISSUED]:             'bg-green-100 text-green-800',
  [BulletinStatus.REJECTED]:           'bg-red-100 text-red-800',
};

const pdfGenerator = new BulletinPdfGenerator();

export function CitizenDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bulletins, setBulletins]         = useState<Bulletin[]>([]);
  const [loading, setLoading]             = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
  if (!user?.citizenId) return;
  setLoading(true);
  container.listCitizenBulletinsUseCase
    .execute(user)
    .then(setBulletins)
    .finally(() => setLoading(false));
}, [user, location.key]);

  const handleDownload = async (bulletin: Bulletin) => {
    if (!user?.citizenId) return;
    setDownloadingId(bulletin.id);
    setDownloadError(null);
    try {
      const citizen = await container.citizenRepository.findById(user.citizenId);
      if (!citizen) throw new Error('Profil citoyen introuvable.');

      const allConvictions = await container.convictionRepository.findByCitizenId(citizen.id);
      const validated = allConvictions.filter(c => c.status === ConvictionStatus.VALIDATED);

      const origin   = window.location.origin;
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
      const verificationUrl = `${origin}${basePath}/verifier/${bulletin.verificationCode}`;

      const blob = await pdfGenerator.generate({
        bulletin,
        citizen,
        convictions: validated,
        verificationUrl,
      });

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `Bulletin_n3_${bulletin.requestNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) return null;

  // Cas : compte non rattaché à un profil citoyen
  if (!user.citizenId) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="text-5xl mb-4">🪪</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Profil citoyen non complété
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            Votre compte n'est pas encore rattaché à un dossier citoyen.
            Complétez votre inscription pour pouvoir soumettre une demande.
          </p>
          <Link
            to="/inscription"
            className="inline-block bg-gabon-primary hover:bg-gabon-accent text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Compléter mon profil
          </Link>
        </div>
      </Layout>
    );
  }

  const hasActiveRequest = bulletins.some(b =>
    BLOCKING_BULLETIN_STATUSES.includes(b.status)
  );

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
            Espace citoyen
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Mes demandes</h1>
          <p className="text-slate-500 mt-1">
            Suivez l'avancement de vos demandes de Bulletin n°3.
          </p>
        </div>
        <button
          onClick={() => navigate('/citoyen/nouvelle-demande')}
          disabled={hasActiveRequest}
          title={hasActiveRequest
            ? 'Une demande est déjà en cours. Vous pourrez en soumettre une nouvelle après sa délivrance.'
            : ''}
          className="bg-gabon-primary hover:bg-gabon-accent disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          + Nouvelle demande
        </button>
      </div>

      {downloadError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          {downloadError}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : bulletins.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-slate-500 text-sm">Aucune demande pour l'instant.</p>
          <button
            onClick={() => navigate('/citoyen/nouvelle-demande')}
            className="mt-4 inline-block text-gabon-primary text-sm font-medium hover:underline"
          >
            Faire une première demande →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bulletins.map(b => {
            const expired = isBulletinExpired(b);
            const expiry  = getBulletinExpiryDate(b);
            const isIssued = b.status === BulletinStatus.ISSUED;
            const isPendingPayment = b.status === BulletinStatus.PENDING_PAYMENT;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-opacity ${
                  expired ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold text-slate-800">
                      {b.requestNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Demandé le {formatDateTime(b.requestedAt)}
                    </div>
                    {b.paidAt && (
                      <div className="text-xs text-slate-500">
                        Payé le {formatDateTime(b.paidAt)}
                        {b.paymentMethod && <> · {b.paymentMethod.replace('_', ' ')}</>}
                      </div>
                    )}
                    {isIssued && expiry && (
                      <div className={`text-xs mt-2 ${expired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        {expired
                          ? `⚠ Expiré depuis le ${formatDate(expiry)}`
                          : `Valide jusqu'au ${formatDate(expiry)}`}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>

                    {isPendingPayment && (
                      <button
                        onClick={() => navigate(`/citoyen/paiement/${b.id}`)}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Payer maintenant
                      </button>
                    )}

                    {isIssued && (
                      <button
                        onClick={() => handleDownload(b)}
                        disabled={downloadingId === b.id}
                        className="text-xs bg-gabon-primary hover:bg-gabon-accent disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {downloadingId === b.id ? 'Génération…' : 'Télécharger'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}