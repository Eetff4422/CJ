import { Citizen } from '@domain/entities/Citizen';
import { Conviction } from '@domain/entities/Conviction';
import { ReviewTicket, ReviewTicketStatus } from '@domain/entities/ReviewTicket';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { useAuth } from '@ui/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TicketRow {
  ticket: ReviewTicket;
  conviction: Conviction | null;
}

export function AgentPenitentiairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // 1. BDD citoyens
    const allCitizens = await container.citizenRepository.listAll();
    setCitizens(allCitizens);

    // 2. Tickets routés à cet agent
    if (user) {
      const routed = await container.listReviewTicketsUseCase.execute({
        kind: 'routed-to', userId: user.id,
      });
      // Ne garder que ceux en attente d'action (ROUTED)
      const pending = routed.filter(t => t.status === ReviewTicketStatus.ROUTED);
      const enriched = await Promise.all(
        pending.map(async (t) => ({
          ticket: t,
          conviction: await container.convictionRepository.findById(t.convictionId),
        }))
      );
      setTickets(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  if (!user) return null;

  // Filtrage live de la BDD citoyens
  const q = search.trim().toLowerCase();
  const filtered = q === ''
    ? citizens
    : citizens.filter(c =>
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.nationalId.toLowerCase().includes(q)
      );

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Agent pénitentiaire
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Base nationale des citoyens</h1>
        <p className="text-slate-500 mt-1">
          Recherchez un citoyen pour consulter son dossier ou enregistrer une condamnation.
        </p>
      </div>

      {/* ── ZONE 1 : Recherche + BDD ─────────────────────────────────── */}
      <section className="mb-8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom ou n° national…"
          className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gabon-accent"
        />

        {loading ? (
          <div className="text-slate-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Aucun citoyen ne correspond à votre recherche.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Citoyen</span>
              <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
            </div>
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filtered.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/agent-penitentiaire/citoyen/${c.id}`)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-800">
                      {c.lastName.toUpperCase()} {c.firstName}
                    </span>
                    <span className="font-mono text-xs text-slate-500">{c.nationalId}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── ZONE 2 : Tickets de relecture en attente ─────────────────── */}
      {tickets.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-3">
            Demandes de relecture en attente ({tickets.length})
          </h2>
          <div className="space-y-3">
            {tickets.map(({ ticket, conviction }) => (
              <div key={ticket.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase text-amber-700 mb-1">
                      Vérification approfondie demandée
                    </div>
                    {conviction ? (
                      <>
                        <div className="font-semibold text-amber-900">{conviction.offense}</div>
                        <div className="text-sm text-amber-800 mt-0.5">
                          {conviction.court} — {conviction.decisionDate}
                        </div>
                        <div className="text-sm text-amber-800">Peine : {conviction.sentence}</div>
                      </>
                    ) : (
                      <div className="text-sm text-amber-700 italic">Condamnation introuvable</div>
                    )}
                    <div className="text-xs text-amber-700 mt-2 italic">
                      Motif transmis : « {ticket.openComment} »
                    </div>
                  </div>
                  <button
                    disabled
                    title="Disponible en sous-livraison 4.3"
                    className="bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg whitespace-nowrap"
                  >
                    Traiter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}