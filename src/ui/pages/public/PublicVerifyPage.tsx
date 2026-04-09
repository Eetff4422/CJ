import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { container } from '@infrastructure/container';
import { Bulletin } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';
import { formatDateTime } from '@ui/lib/format';

export function PublicVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    container.verifyBulletinUseCase.execute(code).then((res) => {
      setValid(res.valid);
      setBulletin(res.bulletin ?? null);
      setCitizen(res.citizen ?? null);
      setError(res.error ?? null);
      setLoading(false);
    });
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gabon-primary text-white px-8 py-6">
            <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
              République Gabonaise · Ministère de la Justice
            </div>
            <h1 className="text-2xl font-bold">Vérification d'authenticité</h1>
            <p className="text-sm text-white/80 mt-1">
              Système de Gestion du Casier Judiciaire
            </p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center text-slate-400 py-12">Vérification…</div>
            ) : !valid ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-xl font-bold text-red-700 mb-2">
                  Document non reconnu
                </h2>
                <p className="text-slate-600 text-sm">
                  {error ??
                    'Ce code de vérification ne correspond à aucun bulletin valide dans le système.'}
                </p>
                <div className="mt-6 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-3">
                  Code vérifié : <span className="font-mono">{code}</span>
                </div>
              </div>
            ) : (
              bulletin &&
              citizen && (
                <div>
                  <div className="text-center py-4">
                    <div className="text-5xl mb-2">✅</div>
                    <h2 className="text-xl font-bold text-green-700">
                      Document authentique
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Ce bulletin a été émis officiellement par le service du casier
                      judiciaire.
                    </p>
                  </div>

                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
                    <InfoRow label="N° de demande" value={bulletin.requestNumber} mono />
                    <InfoRow
                      label="Demandeur"
                      value={`${citizen.firstName} ${citizen.lastName}`}
                    />
                    <InfoRow
                      label="N° d'identification"
                      value={citizen.nationalId}
                      mono
                    />
                    <InfoRow
                      label="Date de naissance"
                      value={new Date(citizen.birthDate).toLocaleDateString('fr-FR')}
                    />
                    <InfoRow
                      label="Émis le"
                      value={
                        bulletin.issuedAt ? formatDateTime(bulletin.issuedAt) : '—'
                      }
                    />
                    <InfoRow
                      label="Code de vérification"
                      value={bulletin.verificationCode}
                      mono
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-4 text-center italic">
                    Conformément au règlement du service, seules les informations
                    minimales nécessaires à la vérification d'authenticité sont
                    affichées.
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-gabon-accent">
            ← Accueil SGCJ-Gabon
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-sm">
      <span className="text-green-700">{label}</span>
      <span
        className={`font-semibold text-green-900 text-right ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
