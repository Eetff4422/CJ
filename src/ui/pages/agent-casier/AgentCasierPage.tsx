import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { formatDateTime } from '@ui/lib/format';
import { useEffect, useState } from 'react';

interface Row {
  bulletin: Bulletin;
  citizen: Citizen | null;
  activeTicket: ReviewTicket | null; // ticket OPEN/ROUTED/CORRECTED/MAINTAINED s'il existe
}

interface ModalData {
  bulletin: Bulletin;
  citizen: Citizen;
  convictions: Conviction[];
  activeTicket: ReviewTicket | null;
}

export function AgentCasierPage() {
  const { user } = useAuth();
  const [rowsToProcess, setRowsToProcess] = useState<Row[]>([]);
  const [rowsUnderReview, setRowsUnderReview] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [validating, setValidating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Sous-modale : demander relecture
  const [reviewFor, setReviewFor] = useState<Conviction | null>(null);
  // Modale relecture identité (distincte de la modale relecture condamnation)
const [identityReviewOpen, setIdentityReviewOpen] = useState(false);
const [identityComment, setIdentityComment] = useState('');
const [submittingIdentityReview, setSubmittingIdentityReview] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    setLoading(true);
    // 1. Demandes à traiter standard
    const pending = await container.listPendingBulletinsUseCase.execute();
    // 2. Demandes en vérification approfondie (récupérées via le repo)
    const all = await container.bulletinRepository.listAll?.() ?? [];
    const underReview = all.filter((b: Bulletin) => b.status === BulletinStatus.UNDER_DEEP_REVIEW);

    const enrich = async (b: Bulletin): Promise<Row> => {
      const citizen = await container.citizenRepository.findById(b.citizenId);
      const tickets = await container.reviewTicketRepository.findByBulletinId(b.id);
      const active = tickets.find(t => t.status !== ReviewTicketStatus.CLOSED) ?? null;
      return { bulletin: b, citizen, activeTicket: active };
    };

    setRowsToProcess(await Promise.all(pending.map(enrich)));
    setRowsUnderReview(await Promise.all(underReview.map(enrich)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = async (row: Row) => {
    if (!row.citizen) return;
    const allConv = await container.convictionRepository.findByCitizenId(row.citizen.id);
    // On affiche les VALIDATED et celles en UNDER_REVIEW (pour montrer la condamnation contestée)
    const visible = allConv.filter(c =>
      c.status === ConvictionStatus.VALIDATED || c.status === ConvictionStatus.UNDER_REVIEW
    );
    setModal({
      bulletin: row.bulletin,
      citizen: row.citizen,
      convictions: visible,
      activeTicket: row.activeTicket,
    });
    setNotice(null);
  };

  const handleValider = async () => {
    if (!user || !modal) return;
    setValidating(true);
    const result = await container.processBulletinRequestUseCase.execute({
      agent: user, bulletinId: modal.bulletin.id,
    });
    setValidating(false);
    setModal(null);
    if (!result.success) {
      setNotice({ type: 'err', msg: result.error ?? 'Erreur inconnue.' });
    } else {
      setNotice({ type: 'ok', msg: `✔ Demande ${modal.bulletin.requestNumber} validée.` });
      await load();
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !modal || !reviewFor || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await container.openReviewTicketUseCase.execute({
        bulletinId: modal.bulletin.id,
        convictionId: reviewFor.id,
        openedBy: user.id,
        openedByEmail: user.email,
        openedByRole: user.role,
        openComment: reviewComment.trim(),
      });
      setReviewFor(null);
      setReviewComment('');
      setModal(null);
      setNotice({ type: 'ok', msg: '✔ Demande de relecture transmise. La demande passe en vérification approfondie.' });
      await load();
    } catch (e: any) {
      setNotice({ type: 'err', msg: e.message ?? 'Erreur lors de la demande de relecture.' });
    } finally {
      setSubmittingReview(false);
    }
  };
  const handleSubmitIdentityReview = async () => {
  if (!user || !modal || !identityComment.trim()) return;
  setSubmittingIdentityReview(true);
  try {
    await container.openIdentityReviewTicketUseCase.execute({
      bulletinId: modal.bulletin.id,
      citizenId: modal.citizen.id,
      openedBy: user.id,
      openedByEmail: user.email,
      openedByRole: user.role,
      openComment: identityComment.trim(),
    });
    setIdentityReviewOpen(false);
    setIdentityComment('');
    setModal(null);
    setNotice({ type: 'ok', msg: '✔ Demande de relecture d\'identité transmise.' });
    await load();
  } catch (e: any) {
    setNotice({ type: 'err', msg: e.message ?? 'Erreur lors de la demande.' });
  } finally {
    setSubmittingIdentityReview(false);
  }
};
  const handleCloseTicket = async () => {
    if (!user || !modal?.activeTicket) return;
    try {
      await container.closeReviewTicketUseCase.execute({
        ticketId: modal.activeTicket.id,
        closedBy: user.id,
        closedByEmail: user.email,
        closedByRole: user.role,
      });
      setModal(null);
      setNotice({ type: 'ok', msg: '✔ Relecture clôturée — la demande retourne en file de traitement.' });
      await load();
    } catch (e: any) {
      setNotice({ type: 'err', msg: e.message });
    }
  };

  if (!user) return null;

  const renderRow = (row: Row, underReview: boolean) => (
    <div
      key={row.bulletin.id}
      className={`bg-white rounded-xl border shadow-sm p-5 flex items-center justify-between ${
        underReview ? 'border-amber-300' : 'border-slate-200'
      }`}
    >
      <div className="space-y-1">
        <div className="font-semibold text-slate-800 font-mono text-sm">
          {row.bulletin.requestNumber}
        </div>
        <div className="text-slate-600 text-sm">
          {row.citizen
            ? `${row.citizen.firstName} ${row.citizen.lastName} — N° ${row.citizen.nationalId}`
            : <span className="text-red-400">Dossier citoyen introuvable</span>}
        </div>
        <div className="text-xs text-slate-400">
          {underReview
            ? <>Vérification approfondie en cours
                {row.activeTicket?.status === ReviewTicketStatus.CORRECTED && ' · Saisie corrigée'}
                {row.activeTicket?.status === ReviewTicketStatus.MAINTAINED && ' · Saisie maintenue'}
              </>
            : <>Payé le {formatDateTime(row.bulletin.paidAt ?? row.bulletin.requestedAt)} · {row.bulletin.paymentMethod?.replace('_', ' ')}</>}
        </div>
      </div>
      <button
        disabled={!row.citizen}
        onClick={() => row.citizen && handleOpenModal(row)}
        className={`text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 ${
          underReview && (row.activeTicket?.status === ReviewTicketStatus.CORRECTED || row.activeTicket?.status === ReviewTicketStatus.MAINTAINED)
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : underReview
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-gabon-primary hover:bg-gabon-accent'
        }`}
      >
        {underReview && (row.activeTicket?.status === ReviewTicketStatus.CORRECTED || row.activeTicket?.status === ReviewTicketStatus.MAINTAINED)
          ? 'Relecture résolue — examiner'
          : underReview
            ? 'Consulter'
            : 'Traiter la demande'}
      </button>
    </div>
  );

  const hasActiveTicket = !!modal?.activeTicket;
  const ticketResolved = modal?.activeTicket?.status === ReviewTicketStatus.CORRECTED
                      || modal?.activeTicket?.status === ReviewTicketStatus.MAINTAINED;

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Agent du casier judiciaire
        </div>
        <h1 className="text-3xl font-bold text-slate-800">File des demandes à traiter</h1>
        <p className="text-slate-500 mt-1">Examinez chaque dossier et validez les demandes de Bulletin n°3.</p>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          notice.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>{notice.msg}</div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Chargement…</div>
      ) : (
        <>
          {rowsUnderReview.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-3">
                En vérification approfondie ({rowsUnderReview.length})
              </h2>
              <div className="space-y-3">{rowsUnderReview.map(r => renderRow(r, true))}</div>
            </div>
          )}

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            À traiter ({rowsToProcess.length})
          </h2>
          {rowsToProcess.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
              Aucune demande en attente de traitement.
            </div>
          ) : (
            <div className="space-y-3">{rowsToProcess.map(r => renderRow(r, false))}</div>
          )}
        </>
      )}

      {/* ── MODALE PRINCIPALE ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent">
                  Traitement de la demande
                </div>
                <div className="font-bold text-slate-800 font-mono">{modal.bulletin.requestNumber}</div>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Identité */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Identité civile</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {!hasActiveTicket && (
  <button
    onClick={() => { setIdentityReviewOpen(true); setIdentityComment(''); }}
    className="mt-3 text-xs font-semibold text-slate-700 underline hover:text-slate-900"
  >
    Demander une relecture de l'identité
  </button>
)}
                  <div><span className="text-slate-500">Nom complet :</span> <span className="font-semibold">{modal.citizen.firstName} {modal.citizen.lastName}</span></div>
                  <div><span className="text-slate-500">N° national :</span> <span className="font-mono font-semibold">{modal.citizen.nationalId}</span></div>
                  <div><span className="text-slate-500">Date de naissance :</span> {modal.citizen.birthDate}</div>
                  <div><span className="text-slate-500">Lieu de naissance :</span> {modal.citizen.birthPlace}</div>
                  <div><span className="text-slate-500">Père :</span> {modal.citizen.fatherName}</div>
                  <div><span className="text-slate-500">Mère :</span> {modal.citizen.motherName}</div>
                </div>
              </section>

              {/* Bandeau ticket si applicable */}
              {hasActiveTicket && (
                <section className={`rounded-lg border px-4 py-3 text-sm ${
                  ticketResolved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="font-semibold mb-1">
                    {ticketResolved ? '✓ Relecture résolue' : '⏳ Relecture en cours'}
                  </div>
                  {modal.activeTicket?.status === ReviewTicketStatus.CORRECTED && (
                    <div>La saisie a été corrigée et est en cours de revalidation.</div>
                  )}
                  {modal.activeTicket?.status === ReviewTicketStatus.MAINTAINED && (
                    <div>
                      <div>Saisie maintenue avec justification :</div>
                      <div className="italic mt-1">« {modal.activeTicket.maintainedComment} »</div>
                    </div>
                  )}
                  {!ticketResolved && (
                    <div className="text-xs mt-1">Motif transmis : « {modal.activeTicket?.openComment} »</div>
                  )}
                </section>
              )}

              {/* Casier */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Casier judiciaire
                </h3>
                {modal.convictions.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm font-medium">
                    ✓ Aucune condamnation enregistrée — casier vierge
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modal.convictions.map(cv => {
                      const isContested = cv.status === ConvictionStatus.UNDER_REVIEW;
                      return (
                        <div key={cv.id} className={`rounded-lg px-4 py-3 text-sm border ${
                          isContested ? 'bg-amber-50 border-amber-300' : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="font-semibold text-amber-900">{cv.offense}</div>
                          <div className="text-amber-700 mt-1">{cv.court} — {cv.decisionDate}</div>
                          <div className="text-amber-700">Peine : {cv.sentence}</div>
                          {!hasActiveTicket && (
                            <button
                              onClick={() => { setReviewFor(cv); setReviewComment(''); }}
                              className="mt-2 text-xs font-semibold text-amber-900 underline hover:text-amber-700"
                            >
                              Demander une relecture
                            </button>
                          )}
                          {isContested && (
                            <div className="text-xs text-amber-800 italic mt-2">⏳ Cette condamnation fait l'objet d'une vérification approfondie</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Pied modale */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100">
                Retour à la file
              </button>
              {ticketResolved ? (
                <button onClick={handleCloseTicket} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                  Clôturer la relecture
                </button>
              ) : (
                <button
                  onClick={handleValider}
                  disabled={validating || hasActiveTicket}
                  title={hasActiveTicket ? 'Vérification approfondie en cours sur une condamnation' : ''}
                  className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
                >
                  {validating ? 'Génération…' : 'Générer le casier'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── SOUS-MODALE : RELECTURE IDENTITÉ ─────────────────────── */}
{identityReviewOpen && modal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Demander une relecture de l'identité</h3>
      <p className="text-xs text-slate-500 mb-4">
        L'identité civile sera transmise pour vérification approfondie. La demande du citoyen sera mise en attente.
      </p>
      <div className="bg-slate-50 rounded-lg p-3 text-sm mb-4">
        <div className="font-semibold">{modal.citizen.firstName} {modal.citizen.lastName}</div>
        <div className="text-slate-600 font-mono text-xs">{modal.citizen.nationalId}</div>
      </div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        Motif de la contestation <span className="text-red-500">*</span>
      </label>
      <textarea
        value={identityComment}
        onChange={e => setIdentityComment(e.target.value)}
        rows={4}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
        placeholder="Précisez ce qui pose problème dans l'identité civile…"
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => { setIdentityReviewOpen(false); setIdentityComment(''); }}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmitIdentityReview}
          disabled={!identityComment.trim() || submittingIdentityReview}
          className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {submittingIdentityReview ? 'Transmission…' : 'Soumettre la relecture'}
        </button>
      </div>
    </div>
  </div>
)}
      {/* ── SOUS-MODALE : DEMANDE DE RELECTURE ───────────────────────── */}
      {reviewFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Demander une relecture</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cette condamnation sera transmise pour vérification approfondie. La demande du citoyen sera mise en attente.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm mb-4">
              <div className="font-semibold">{reviewFor.offense}</div>
              <div className="text-slate-600">{reviewFor.court} — {reviewFor.decisionDate}</div>
            </div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Motif de la contestation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
              placeholder="Précisez ce qui motive la demande de relecture…"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setReviewFor(null); setReviewComment(''); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!reviewComment.trim() || submittingReview}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {submittingReview ? 'Transmission…' : 'Soumettre la relecture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}