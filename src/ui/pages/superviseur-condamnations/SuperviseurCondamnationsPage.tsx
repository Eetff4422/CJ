import { Citizen } from '@domain/entities/Citizen';
import { Conviction } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { formatDateTime } from '@ui/lib/format';
import { useEffect, useState } from 'react';

interface Row {
  conviction: Conviction;
  citizen: Citizen | null;
}

interface TicketRow {
  ticket: ReviewTicket;
  conviction: Conviction | null;
  citizen: Citizen | null;
}

export function SuperviseurCondamnationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [identityValidations, setIdentityValidations] = useState<TicketRow[]>([]);
  const [routingId, setRoutingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    // 1. Condamnations en attente de validation
    const pending = await container.listPendingConvictionsUseCase.execute();
    const convictionRows = await Promise.all(
      pending.map(async (c) => ({
        conviction: c,
        citizen: await container.citizenRepository.findById(c.citizenId),
      }))
    );
    setRows(convictionRows);

    // 2. Tickets de relecture en attente de routage (les deux types)
    const allTickets = await container.listReviewTicketsUseCase.execute({ kind: 'all' });

    const openTickets = allTickets.filter(t => t.status === ReviewTicketStatus.OPEN);
    const ticketRows = await Promise.all(
      openTickets.map(async (t) => {
        const conv = t.convictionId ? await container.convictionRepository.findById(t.convictionId) : null;
        const cit = await container.citizenRepository.findById(t.citizenId);
        return { ticket: t, conviction: conv, citizen: cit };
      })
    );
    setTickets(ticketRows);

    // 3. Corrections d'identité en attente de validation
    const idValidationTickets = allTickets.filter(t =>
      t.kind === 'IDENTITY' && t.status === ReviewTicketStatus.PENDING_IDENTITY_VALIDATION
    );
    const idValidationRows = await Promise.all(
      idValidationTickets.map(async (t) => {
        const cit = await container.citizenRepository.findById(t.citizenId);
        return { ticket: t, conviction: null, citizen: cit };
      })
    );
    setIdentityValidations(idValidationRows);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoute = async (ticketId: string) => {
    if (!user) return;
    setRoutingId(ticketId);
    try {
      await container.routeReviewTicketUseCase.execute({
        ticketId,
        routedBy: user.id,
        routedByEmail: user.email,
        routedByRole: user.role,
      });
      setNotice('✔ Ticket routé vers le saisisseur d\'origine.');
      await load();
    } catch (e: any) {
      setNotice('Erreur : ' + (e.message ?? 'inconnue'));
    } finally {
      setRoutingId(null);
    }
  };

  const handleValidateIdentity = async (ticketId: string) => {
    if (!user) return;
    setValidatingId(ticketId);
    try {
      await container.validateIdentityCorrectionUseCase.execute({
        ticketId,
        validatedBy: user.id,
        validatedByEmail: user.email,
        validatedByRole: user.role,
      });
      setNotice('✔ Correction d\'identité validée et appliquée.');
      await load();
    } catch (e: any) {
      setNotice('Erreur : ' + (e.message ?? 'inconnue'));
    } finally {
      setValidatingId(null);
    }
  };

  const handleValidate = async (convictionId: string) => {
    if (!user) return;
    const r = await container.validateConvictionUseCase.execute({
      supervisor: user,
      convictionId,
      approve: true,
    });
    if (r.success) {
      setNotice('✔ Condamnation validée et intégrée à la base.');
      load();
    }
  };

  const handleReject = async (convictionId: string) => {
    if (!user || !rejectReason.trim()) return;
    const r = await container.validateConvictionUseCase.execute({
      supervisor: user,
      convictionId,
      approve: false,
      rejectionReason: rejectReason,
    });
    if (r.success) {
      setNotice('La condamnation a été rejetée.');
      setRejectingId(null);
      setRejectReason('');
      load();
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Superviseur des condamnations
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Validation des condamnations</h1>
        <p className="text-slate-500 mt-1">
          Examinez les saisies des agents pénitentiaires et validez ou rejetez chaque entrée.
        </p>
      </div>

      {notice && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded">
          {notice}
        </div>
      )}

      {/* ── 1. Demandes de relecture à router ──────────────────────── */}
      {tickets.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-3">
            Demandes de relecture à router ({tickets.length})
          </h2>
          <div className="space-y-3">
            {tickets.map(({ ticket, conviction, citizen }) => (
              <div key={ticket.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase text-amber-700 mb-1">
                      {ticket.kind === 'IDENTITY' ? 'Demande de relecture — Identité' : 'Demande de relecture — Condamnation'}
                    </div>
                    {ticket.kind === 'CONVICTION' && conviction && (
                      <>
                        <div className="font-semibold text-amber-900">{conviction.offense}</div>
                        <div className="text-sm text-amber-800 mt-0.5">
                          {conviction.court} — {conviction.decisionDate} · Peine : {conviction.sentence}
                        </div>
                      </>
                    )}
                    {ticket.kind === 'IDENTITY' && citizen && (
                      <>
                        <div className="font-semibold text-amber-900">{citizen.firstName} {citizen.lastName}</div>
                        <div className="text-sm text-amber-800 mt-0.5">
                          {citizen.birthDate} · né(e) à {citizen.birthPlace}
                        </div>
                      </>
                    )}
                    {citizen && (
                      <div className="text-xs text-amber-700 mt-1">
                        Citoyen : {citizen.firstName} {citizen.lastName} — {citizen.nationalId}
                      </div>
                    )}
                    <div className="text-xs text-amber-700 mt-2 italic">
                      Motif transmis : « {ticket.openComment} »
                    </div>
                  </div>
                  <button
                    onClick={() => handleRoute(ticket.id)}
                    disabled={routingId === ticket.id}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg whitespace-nowrap"
                  >
                    {routingId === ticket.id ? 'Routage…' : 'Router vers le saisisseur'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 2. Corrections d'identité à valider ────────────────────── */}
      {identityValidations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-3">
            Corrections d'identité à valider ({identityValidations.length})
          </h2>
          <div className="space-y-3">
            {identityValidations.map(({ ticket, citizen }) => (
              <div key={ticket.id} className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase text-blue-700 mb-2">
                      Correction d'identité proposée
                    </div>
                    {citizen && (
                      <div className="text-sm font-semibold text-blue-900 mb-2">
                        {citizen.firstName} {citizen.lastName} — {citizen.nationalId}
                      </div>
                    )}
                    {ticket.identityPatchProposed && (
                      <div className="bg-white border border-blue-100 rounded-lg p-3 text-xs">
                        <div className="font-bold text-blue-800 mb-2">Champs modifiés :</div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-blue-700">
                              <th className="text-left font-semibold pr-4">Champ</th>
                              <th className="text-left font-semibold pr-4">Avant</th>
                              <th className="text-left font-semibold">Proposé</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-700">
                            {Object.entries(ticket.identityPatchProposed).map(([key, val]) => (
                              <tr key={key}>
                                <td className="pr-4 font-mono">{key}</td>
                                <td className="pr-4 line-through text-red-500">{(citizen as any)?.[key] ?? '—'}</td>
                                <td className="text-green-700 font-semibold">{val as string}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="text-xs text-blue-700 mt-2 italic">
                      Motif initial : « {ticket.openComment} »
                    </div>
                  </div>
                  <button
                    onClick={() => handleValidateIdentity(ticket.id)}
                    disabled={validatingId === ticket.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg whitespace-nowrap"
                  >
                    {validatingId === ticket.id ? 'Validation…' : 'Valider la correction'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Condamnations en attente de validation ──────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Condamnations en attente</h2>
          <span className="text-sm text-slate-500">{rows.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Aucune condamnation en attente de validation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map(({ conviction, citizen }) => (
              <div key={conviction.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{conviction.offense}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Concerne :{' '}
                      <span className="font-semibold">
                        {citizen
                          ? `${citizen.firstName} ${citizen.lastName} (${citizen.nationalId})`
                          : '(inconnu)'}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 mt-2">
                      <div><span className="font-medium text-slate-600">Juridiction :</span> {conviction.court}</div>
                      <div>
                        <span className="font-medium text-slate-600">Date décision :</span>{' '}
                        {new Date(conviction.decisionDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div><span className="font-medium text-slate-600">Peine :</span> {conviction.sentence}</div>
                      <div><span className="font-medium text-slate-600">Saisie le :</span> {formatDateTime(conviction.submittedAt)}</div>
                    </div>
                  </div>

                  {rejectingId !== conviction.id && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleValidate(conviction.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded"
                      >
                        ✓ Valider
                      </button>
                      <button
                        onClick={() => { setRejectingId(conviction.id); setRejectReason(''); }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 rounded"
                      >
                        ✗ Rejeter
                      </button>
                    </div>
                  )}
                </div>

                {rejectingId === conviction.id && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                    <label className="block text-xs font-medium text-red-800 mb-1">Motif du rejet</label>
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-2 py-1.5 border border-red-300 rounded text-sm"
                      placeholder="Expliquez pourquoi cette saisie est rejetée"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => setRejectingId(null)}
                        className="text-xs px-3 py-1.5 text-slate-600"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleReject(conviction.id)}
                        disabled={!rejectReason.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
                      >
                        Confirmer le rejet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}