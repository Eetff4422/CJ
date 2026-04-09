import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { container } from '@infrastructure/container';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import {
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
} from '@application/use-cases/bulletin/PayBulletinRequestUseCase';

interface PaymentOption {
  method: PaymentMethod;
  category: string;
  icon: string;
}

const RESIDENT_OPTIONS: PaymentOption[] = [
  { method: 'AIRTEL_MONEY', category: 'Mobile Money', icon: '📱' },
  { method: 'MOOV_MONEY', category: 'Mobile Money', icon: '📱' },
];

const DIASPORA_OPTIONS: PaymentOption[] = [
  { method: 'VISA', category: 'Carte bancaire', icon: '💳' },
  { method: 'MASTERCARD', category: 'Carte bancaire', icon: '💳' },
  { method: 'PAYPAL', category: 'Portefeuille numérique', icon: '🌐' },
  { method: 'APPLE_PAY', category: 'Portefeuille numérique', icon: '🌐' },
];

const FEE_AMOUNT = 5000; // FCFA

export function PaymentPage() {
  const { bulletinId } = useParams<{ bulletinId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bulletinId) return;
    container.bulletinRepository.findById(bulletinId).then((b) => {
      setBulletin(b);
      setLoading(false);
    });
  }, [bulletinId]);

  if (!user) return null;

  const handlePay = async () => {
    if (!selectedMethod || !bulletin) return;
    setProcessing(true);
    setError(null);
    const result = await container.payBulletinRequestUseCase.execute({
      user,
      bulletinId: bulletin.id,
      method: selectedMethod,
    });
    setProcessing(false);
    if (!result.success) {
      setError(result.error ?? 'Erreur de paiement');
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/citoyen'), 2500);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-slate-400">Chargement…</div>
      </Layout>
    );
  }

  if (!bulletin) {
    return (
      <Layout>
        <div className="text-red-600">Demande introuvable.</div>
      </Layout>
    );
  }

  if (bulletin.status !== BulletinStatus.PENDING_PAYMENT) {
    return (
      <Layout>
        <div className="max-w-xl bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="font-semibold text-amber-900 mb-2">
            Cette demande n'est plus en attente de paiement
          </div>
          <p className="text-sm text-amber-800 mb-4">
            La demande {bulletin.requestNumber} est désormais au statut «{' '}
            {bulletin.status} ».
          </p>
          <Link
            to="/citoyen"
            className="text-gabon-accent hover:underline text-sm font-medium"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Paiement confirmé
          </h2>
          <p className="text-green-800 mb-1">
            Votre demande <strong>{bulletin.requestNumber}</strong> est désormais
            transmise au service du casier judiciaire.
          </p>
          <p className="text-sm text-green-700 mt-4">
            Redirection vers votre tableau de bord…
          </p>
        </div>
      </Layout>
    );
  }

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
            Paiement de la demande
          </h1>
          <p className="text-slate-500 mt-1">
            Choisissez votre moyen de paiement préféré.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Demande
              </div>
              <div className="font-mono font-bold text-lg text-slate-800">
                {bulletin.requestNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Frais de service
              </div>
              <div className="font-bold text-2xl text-gabon-primary">
                {FEE_AMOUNT.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <PaymentSection
              title="Mobile Money — Résidents Gabon"
              options={RESIDENT_OPTIONS}
              selected={selectedMethod}
              onSelect={setSelectedMethod}
              disabled={processing}
            />
            <PaymentSection
              title="International — Diaspora"
              options={DIASPORA_OPTIONS}
              selected={selectedMethod}
              onSelect={setSelectedMethod}
              disabled={processing}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={!selectedMethod || processing}
          className="w-full bg-gabon-primary hover:bg-gabon-accent text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing
            ? 'Traitement du paiement en cours…'
            : selectedMethod
              ? `Payer ${FEE_AMOUNT.toLocaleString('fr-FR')} FCFA via ${PAYMENT_METHOD_LABELS[selectedMethod]}`
              : 'Sélectionnez un moyen de paiement'}
        </button>

        <p className="text-xs text-slate-400 mt-3 text-center">
          🔒 Paiement simulé pour la démonstration. Aucun débit réel n'est effectué.
        </p>
      </div>
    </Layout>
  );
}

function PaymentSection({
  title,
  options,
  selected,
  onSelect,
  disabled,
}: {
  title: string;
  options: PaymentOption[];
  selected: PaymentMethod | null;
  onSelect: (m: PaymentMethod) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.method;
          return (
            <button
              key={opt.method}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.method)}
              className={`flex items-center gap-3 px-4 py-3 border rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-gabon-accent bg-blue-50 ring-2 ring-gabon-accent/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-2xl">{opt.icon}</div>
              <div>
                <div className="font-medium text-slate-800 text-sm">
                  {PAYMENT_METHOD_LABELS[opt.method]}
                </div>
                <div className="text-xs text-slate-500">{opt.category}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
