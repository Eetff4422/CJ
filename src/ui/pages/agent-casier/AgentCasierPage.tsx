import { Bulletin } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { formatDateTime } from '@ui/lib/format';
import { useEffect, useState } from 'react';

interface Row {
  bulletin: Bulletin;
  citizen: Citizen | null;
}

interface ModalData {
  bulletin: Bulletin;
  citizen: Citizen;
  convictions: Conviction[];
}

export function AgentCasierPage() {
  const { user } = useAuth();
  const [rows, setRows]           = useState<Row[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<ModalData | null>(null);
  const [validating, setValidating] = useState(false);
  const [notice, setNotice]       = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const bulletins = await container.listPendingBulletinsUseCase.execute();
    const enriched = await Promise.all(
      bulletins.map(async (b) => ({
        bulletin: b,
        citizen: await container.citizenRepository.findById(b.citizenId),
      }))
    );
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Ouvrir le modal avec récap complet
  const handleOpenModal = async (row: Row) => {
    if (!row.citizen) return;
    const allConvictions = await container.convictionRepository.findByCitizenId(row.citizen.id);
    const validated = allConvictions.filter(c => c.status === ConvictionStatus.VALIDATED);
    setModal({ bulletin: row.bulletin, citizen: row.citizen, convictions: validated });
    setNotice(null);
  };

  // Valider la demande côté agent (pas de téléchargement)
  const handleValider = async () => {
    if (!user || !modal) return;
    setValidating(true);
    const result = await container.processBulletinRequestUseCase.execute({
      agent: user,
      bulletinId: modal.bulletin.id,
    });
    setValidating(false);
    setModal(null);
    if (!result.success) {
      setNotice({ type: 'err', msg: result.error ?? 'Erreur inconnue.' });
    } else {
      setNotice({ type: 'ok', msg: `✔ Demande ${modal.bulletin.requestNumber} validée — le citoyen peut télécharger son bulletin.` });
      await load();
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Agent du casier judiciaire
        </div>
        <h1 className="text-3xl font-bold text-slate-800">File des demandes à traiter</h1>
        <p className="text-slate-500 mt-1">
          Examinez chaque dossier et validez les demandes de Bulletin n°3.
        </p>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          notice.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notice.msg}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          Aucune demande en attente de traitement.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ bulletin, citizen }) => (
            <div
              key={bulletin.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="font-semibold text-slate-800 font-mono text-sm">
                  {bulletin.requestNumber}
                </div>
                <div className="text-slate-600 text-sm">
                  {citizen
                    ? `${citizen.firstName} ${citizen.lastName} — N° ${citizen.nationalId}`
                    : <span className="text-red-400">Dossier citoyen introuvable</span>
                  }
                </div>
                <div className="text-xs text-slate-400">
                  Payé le {formatDateTime(bulletin.paidAt ?? bulletin.requestedAt)}
                  {' · '}
                  {bulletin.paymentMethod?.replace('_', ' ')}
                </div>
              </div>
              <button
                disabled={!citizen}
                onClick={() => citizen && handleOpenModal({ bulletin, citizen })}
                className="bg-gabon-primary hover:bg-gabon-accent disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Traiter la demande
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL RÉCAP ─────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* En-tête modal */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent">
                  Traitement de la demande
                </div>
                <div className="font-bold text-slate-800 font-mono">{modal.bulletin.requestNumber}</div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Identité civile */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Identité civile
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Nom complet :</span>{' '}
                    <span className="font-semibold">
                      {modal.citizen.firstName} {modal.citizen.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">N° national :</span>{' '}
                    <span className="font-mono font-semibold">{modal.citizen.nationalId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Date de naissance :</span>{' '}
                    {modal.citizen.birthDate}
                  </div>
                  <div>
                    <span className="text-slate-500">Lieu de naissance :</span>{' '}
                    {modal.citizen.birthPlace}
                  </div>
                  <div>
                    <span className="text-slate-500">Père :</span>{' '}
                    {modal.citizen.fatherName}
                  </div>
                  <div>
                    <span className="text-slate-500">Mère :</span>{' '}
                    {modal.citizen.motherName}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Adresse :</span>{' '}
                    {modal.citizen.address}
                    {modal.citizen.isDiaspora && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Diaspora
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Paiement */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Paiement
                </h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-slate-500">Canal :</span>{' '}
                    <span className="font-medium">{modal.bulletin.paymentMethod?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Confirmé le :</span>{' '}
                    {formatDateTime(modal.bulletin.paidAt ?? '')}
                  </div>
                </div>
              </section>

              {/* Casier judiciaire */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Casier judiciaire — condamnations validées
                </h3>
                {modal.convictions.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm font-medium">
                    ✓ Aucune condamnation enregistrée — casier vierge
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modal.convictions.map(cv => (
                      <div key={cv.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                        <div className="font-semibold text-amber-900">{cv.offense}</div>
                        <div className="text-amber-700 mt-1">
                          {cv.court} — {cv.decisionDate}
                        </div>
                        <div className="text-amber-700">Peine : {cv.sentence}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>

            {/* Pied modal */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleValider}
                disabled={validating}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {validating ? 'Validation…' : 'Valider la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}