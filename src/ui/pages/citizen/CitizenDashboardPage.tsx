import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { ConvictionStatus } from '@domain/entities/Conviction';
import { container } from '@infrastructure/container';
import { BulletinPdfGenerator } from '@infrastructure/pdf/BulletinPdfGenerator';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { formatDateTime } from '@ui/lib/format';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]:    'En attente de paiement',
  [BulletinStatus.PENDING_PROCESSING]: 'En cours de traitement',
  [BulletinStatus.ISSUED]:             'Délivré',
  [BulletinStatus.REJECTED]:           'Rejeté',
};

const STATUS_COLORS: Record<BulletinStatus, string> = {
  [BulletinStatus.PENDING_PAYMENT]:    'bg-yellow-100 text-yellow-800',
  [BulletinStatus.PENDING_PROCESSING]: 'bg-blue-100 text-blue-800',
  [BulletinStatus.ISSUED]:             'bg-green-100 text-green-800',
  [BulletinStatus.REJECTED]:           'bg-red-100 text-red-800',
};

/** Calcule la date d'expiration (6 mois après émission) et indique si le bulletin est encore valide */
function getValidity(issuedAt: string): { expiresAt: string; isValid: boolean } {
  const issued  = new Date(issuedAt);
  const expires = new Date(issued);
  expires.setMonth(expires.getMonth() + 6);
  return {
    expiresAt: expires.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    isValid: new Date() < expires,
  };
}

const pdfGenerator = new BulletinPdfGenerator();

export function CitizenDashboardPage() {
  const { user } = useAuth();
  const [bulletins, setBulletins]           = useState<Bulletin[]>([]);
  const [loading, setLoading]               = useState(true);
  const [downloadingId, setDownloadingId]   = useState<string | null>(null);
  const [downloadError, setDownloadError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user?.citizenId) return;
    container.listCitizenBulletinsUseCase
      .execute(user.citizenId)
      .then(setBulletins)
      .finally(() => setLoading(false));
  }, [user]);

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
        <Link
          to="/citoyen/nouvelle-demande"
          className="bg-gabon-primary hover:bg-gabon-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          + Nouvelle demande
        </Link>
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
          <Link
            to="/citoyen/nouvelle-demande"
            className="mt-4 inline-block text-gabon-primary text-sm font-medium hover:underline"
          >
            Faire une première demande →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bulletins.map((b) => {
            const isIssued   = b.status === BulletinStatus.ISSUED;
            const validity   = isIssued && b.issuedAt ? getValidity(b.issuedAt) : null;
            const isDownloading = downloadingId === b.id;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border shadow-sm p-5 ${
                  isIssued ? 'border-green-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Numéro + statut */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-slate-800 text-sm">
                        {b.requestNumber}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <div>Demande soumise le {formatDateTime(b.requestedAt)}</div>
                      {b.paidAt && (
                        <div>Paiement confirmé le {formatDateTime(b.paidAt)} · {b.paymentMethod?.replace('_', ' ')}</div>
                      )}
                      {isIssued && b.issuedAt && (
                        <div>Bulletin délivré le {formatDateTime(b.issuedAt)}</div>
                      )}
                    </div>

                    {/* Validité (bulletins émis uniquement) */}
                    {validity && (
                      <div className={`text-xs font-medium mt-1 ${
                        validity.isValid ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {validity.isValid
                          ? `✓ Valide jusqu'au ${validity.expiresAt}`
                          : `✗ Expiré le ${validity.expiresAt} — veuillez faire une nouvelle demande`
                        }
                      </div>
                    )}
                  </div>

                  {/* Bouton téléchargement (bulletins délivrés et valides) */}
                  {isIssued && validity?.isValid && (
                    <button
                      onClick={() => handleDownload(b)}
                      disabled={isDownloading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {isDownloading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Génération…
                        </>
                      ) : (
                        <>
                          ⬇ Télécharger
                        </>
                      )}
                    </button>
                  )}

                  {/* Bulletin expiré */}
                  {isIssued && validity && !validity.isValid && (
                    <Link
                      to="/citoyen/nouvelle-demande"
                      className="text-xs text-gabon-primary hover:underline whitespace-nowrap font-medium"
                    >
                      Renouveler →
                    </Link>
                  )}

                  {/* Paiement en attente */}
                  {b.status === BulletinStatus.PENDING_PAYMENT && (
                    <Link
                      to={`/citoyen/paiement/${b.id}`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Payer maintenant
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}