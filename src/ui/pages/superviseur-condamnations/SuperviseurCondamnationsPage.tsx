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
const [routingId, setRoutingId] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const pending = await container.listPendingConvictionsUseCase.execute();
    const rows = await Promise.all(
      pending.map(async (c) => ({
        conviction: c,
        citizen: await container.citizenRepository.findById(c.citizenId),
      }))
    );
    setRows(rows);
    // Charger les tickets de relecture en attente de routage
const allTickets = await container.listReviewTicketsUseCase.execute({ kind: 'all' });
const openTickets = allTickets.filter(t => t.status === ReviewTicketStatus.OPEN);
const ticketRows = await Promise.all(
  openTickets.map(async (t) => {
    const conv = await container.convictionRepository.findById(t.convictionId);
    const cit = conv ? await container.citizenRepository.findById(conv.citizenId) : null;
    return { ticket: t, conviction: conv, citizen: cit };
  })
);
setTickets(ticketRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);
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
        <h1 className="text-3xl font-bold text-slate-800">
          Validation des condamnations
        </h1>
        <p className="text-slate-500 mt-1">
          Examinez les saisies des agents pénitentiaires et validez ou rejetez
          chaque entrée.
        </p>
      </div>

      {notice && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Condamnations en attente
          </h2>
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
                Demande de relecture
              </div>
              {conviction ? (
                <>
                  <div className="font-semibold text-amber-900">{conviction.offense}</div>
                  <div className="text-sm text-amber-800 mt-0.5">
                    {conviction.court} — {conviction.decisionDate} · Peine : {conviction.sentence}
                  </div>
                  {citizen && (
                    <div className="text-xs text-amber-700 mt-1">
                      Citoyen : {citizen.firstName} {citizen.lastName} — {citizen.nationalId}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-amber-700 italic">Condamnation introuvable</div>
              )}
              <div className="text-xs text-amber-700 mt-2 italic">
                Motif transmis : « {ticket.openComment} »
              </div>
            </div>
            <button
              onClick={() => handleRoute(ticket.id)}
              disabled={!conviction || routingId === ticket.id}
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
            {rows.map(({ conviction, citizen }) => (
              <div key={conviction.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">
                      {conviction.offense}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Concerne :{' '}
                      <span className="font-semibold">
                        {citizen
                          ? `${citizen.firstName} ${citizen.lastName} (${citizen.nationalId})`
                          : '(inconnu)'}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 mt-2">
                      <div>
                        <span className="font-medium text-slate-600">
                          Juridiction :
                        </span>{' '}
                        {conviction.court}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">
                          Date décision :
                        </span>{' '}
                        {new Date(conviction.decisionDate).toLocaleDateString(
                          'fr-FR'
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">Peine :</span>{' '}
                        {conviction.sentence}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">
                          Saisie le :
                        </span>{' '}
                        {formatDateTime(conviction.submittedAt)}
                      </div>
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
                        onClick={() => {
                          setRejectingId(conviction.id);
                          setRejectReason('');
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 rounded"
                      >
                        ✗ Rejeter
                      </button>
                    </div>
                  )}
                </div>

                {rejectingId === conviction.id && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                    <label className="block text-xs font-medium text-red-800 mb-1">
                      Motif du rejet
                    </label>
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
