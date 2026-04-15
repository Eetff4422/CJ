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
  citizen: Citizen | null;
}

type ReviewMode = 'CORRECT' | 'MAINTAIN';

export function AgentPenitentiairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  // État modale ticket
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('CORRECT');
  const [processingTicket, setProcessingTicket] = useState(false);
  const [ticketNotice, setTicketNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Champs édition condamnation
  const [editCourt, setEditCourt] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editOffense, setEditOffense] = useState('');
  const [editSentence, setEditSentence] = useState('');

  // Champs édition identité
  const [editLastName, setEditLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editBirthPlace, setEditBirthPlace] = useState('');
  const [editFather, setEditFather] = useState('');
  const [editMother, setEditMother] = useState('');
  const [editGender, setEditGender] = useState<'M' | 'F'>('M');
  const [editAddress, setEditAddress] = useState('');

  // Maintien (commun)
  const [maintainComment, setMaintainComment] = useState('');

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
        pending.map(async (t) => {
          const conv = t.convictionId ? await container.convictionRepository.findById(t.convictionId) : null;
          const cit = await container.citizenRepository.findById(t.citizenId);
          return { ticket: t, conviction: conv, citizen: cit };
        })
      );
      setTickets(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openTicketModal = (row: TicketRow) => {
    setActiveTicket(row);
    setReviewMode('CORRECT');
    setTicketNotice(null);
    setMaintainComment('');

    if (row.ticket.kind === 'CONVICTION' && row.conviction) {
      setEditCourt(row.conviction.court);
      setEditDate(row.conviction.decisionDate);
      setEditOffense(row.conviction.offense);
      setEditSentence(row.conviction.sentence);
    } else if (row.ticket.kind === 'IDENTITY' && row.citizen) {
      setEditLastName(row.citizen.lastName);
      setEditFirstName(row.citizen.firstName);
      setEditBirthDate(row.citizen.birthDate);
      setEditBirthPlace(row.citizen.birthPlace);
      setEditFather(row.citizen.fatherName);
      setEditMother(row.citizen.motherName);
      setEditGender(row.citizen.gender);
      setEditAddress(row.citizen.address);
    }
  };

  const closeTicketModal = () => {
    setActiveTicket(null);
  };

  const handleCorrect = async () => {
    if (!user || !activeTicket) return;
    if (!editCourt.trim() || !editDate || !editOffense.trim() || !editSentence.trim()) {
      setTicketNotice({ type: 'err', msg: 'Tous les champs sont obligatoires.' });
      return;
    }
    setProcessingTicket(true);
    try {
      await container.correctConvictionFromTicketUseCase.execute({
        ticketId: activeTicket.ticket.id,
        correctedBy: user.id,
        correctedByEmail: user.email,
        correctedByRole: user.role,
        patch: {
          court: editCourt.trim(),
          decisionDate: editDate,
          offense: editOffense.trim(),
          sentence: editSentence.trim(),
        },
      });
      closeTicketModal();
      await load();
    } catch (e: any) {
      setTicketNotice({ type: 'err', msg: e.message ?? 'Erreur lors de la correction.' });
    } finally {
      setProcessingTicket(false);
    }
  };

  const handleMaintain = async () => {
    if (!user || !activeTicket || !maintainComment.trim()) return;
    setProcessingTicket(true);
    try {
      await container.maintainConvictionFromTicketUseCase.execute({
        ticketId: activeTicket.ticket.id,
        maintainedBy: user.id,
        maintainedByEmail: user.email,
        maintainedByRole: user.role,
        maintainedComment: maintainComment.trim(),
      });
      closeTicketModal();
      await load();
    } catch (e: any) {
      setTicketNotice({ type: 'err', msg: e.message ?? 'Erreur lors du maintien.' });
    } finally {
      setProcessingTicket(false);
    }
  };

  const handleCorrectIdentity = async () => {
    if (!user || !activeTicket) return;
    if (!editLastName.trim() || !editFirstName.trim() || !editBirthDate
        || !editBirthPlace.trim() || !editFather.trim() || !editMother.trim()
        || !editAddress.trim()) {
      setTicketNotice({ type: 'err', msg: 'Tous les champs sont obligatoires.' });
      return;
    }
    setProcessingTicket(true);
    try {
      await container.correctIdentityFromTicketUseCase.execute({
        ticketId: activeTicket.ticket.id,
        correctedBy: user.id,
        correctedByEmail: user.email,
        correctedByRole: user.role,
        patch: {
          lastName: editLastName.trim(),
          firstName: editFirstName.trim(),
          birthDate: editBirthDate,
          birthPlace: editBirthPlace.trim(),
          fatherName: editFather.trim(),
          motherName: editMother.trim(),
          gender: editGender,
          address: editAddress.trim(),
        },
      });
      closeTicketModal();
      await load();
    } catch (e: any) {
      setTicketNotice({ type: 'err', msg: e.message ?? 'Erreur lors de la correction.' });
    } finally {
      setProcessingTicket(false);
    }
  };

  const handleMaintainIdentity = async () => {
    if (!user || !activeTicket || !maintainComment.trim()) return;
    setProcessingTicket(true);
    try {
      await container.maintainIdentityFromTicketUseCase.execute({
        ticketId: activeTicket.ticket.id,
        maintainedBy: user.id,
        maintainedByEmail: user.email,
        maintainedByRole: user.role,
        maintainedComment: maintainComment.trim(),
      });
      closeTicketModal();
      await load();
    } catch (e: any) {
      setTicketNotice({ type: 'err', msg: e.message ?? 'Erreur lors du maintien.' });
    } finally {
      setProcessingTicket(false);
    }
  };

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
            {tickets.map(({ ticket, conviction, citizen }) => (
              <div key={ticket.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase text-amber-700 mb-1">
                      {ticket.kind === 'IDENTITY' ? 'Vérification approfondie — Identité' : 'Vérification approfondie — Condamnation'}
                    </div>
                    {ticket.kind === 'CONVICTION' && conviction && (
                      <>
                        <div className="font-semibold text-amber-900">{conviction.offense}</div>
                        <div className="text-sm text-amber-800 mt-0.5">
                          {conviction.court} — {conviction.decisionDate}
                        </div>
                        <div className="text-sm text-amber-800">Peine : {conviction.sentence}</div>
                      </>
                    )}
                    {ticket.kind === 'IDENTITY' && citizen && (
                      <>
                        <div className="font-semibold text-amber-900">{citizen.firstName} {citizen.lastName}</div>
                        <div className="text-sm text-amber-800 mt-0.5">{citizen.birthDate} · né(e) à {citizen.birthPlace}</div>
                        <div className="text-xs text-amber-800 font-mono">{citizen.nationalId}</div>
                      </>
                    )}
                    <div className="text-xs text-amber-700 mt-2 italic">
                      Motif transmis : « {ticket.openComment} »
                    </div>
                  </div>
                  <button
                    onClick={() => openTicketModal({ ticket, conviction, citizen })}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg whitespace-nowrap"
                  >
                    Traiter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MODALE TRAITEMENT TICKET (CONDAMNATION OU IDENTITÉ) ───── */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Demande de relecture
                </div>
                <div className="font-bold text-slate-800">
                  {activeTicket.ticket.kind === 'IDENTITY' ? 'Traitement d\'une identité' : 'Traitement d\'une condamnation'}
                </div>
              </div>
              <button onClick={closeTicketModal} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {ticketNotice && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  ticketNotice.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>{ticketNotice.msg}</div>
              )}

              {/* Motif */}
              <section className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Motif transmis</div>
                <div className="text-sm text-amber-900 italic">« {activeTicket.ticket.openComment} »</div>
              </section>

              {/* Saisie actuelle */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {activeTicket.ticket.kind === 'IDENTITY' ? 'Identité actuelle' : 'Saisie actuelle'}
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1">
                  {activeTicket.ticket.kind === 'CONVICTION' && activeTicket.conviction && (
                    <>
                      <div><span className="text-slate-500">Juridiction :</span> <span className="font-medium">{activeTicket.conviction.court}</span></div>
                      <div><span className="text-slate-500">Date :</span> {activeTicket.conviction.decisionDate}</div>
                      <div><span className="text-slate-500">Infraction :</span> {activeTicket.conviction.offense}</div>
                      <div><span className="text-slate-500">Peine :</span> {activeTicket.conviction.sentence}</div>
                    </>
                  )}
                  {activeTicket.ticket.kind === 'IDENTITY' && activeTicket.citizen && (
                    <>
                      <div><span className="text-slate-500">Nom :</span> <span className="font-medium">{activeTicket.citizen.lastName}</span></div>
                      <div><span className="text-slate-500">Prénom :</span> {activeTicket.citizen.firstName}</div>
                      <div><span className="text-slate-500">Date de naissance :</span> {activeTicket.citizen.birthDate}</div>
                      <div><span className="text-slate-500">Lieu :</span> {activeTicket.citizen.birthPlace}</div>
                      <div><span className="text-slate-500">Père :</span> {activeTicket.citizen.fatherName}</div>
                      <div><span className="text-slate-500">Mère :</span> {activeTicket.citizen.motherName}</div>
                      <div><span className="text-slate-500">Sexe :</span> {activeTicket.citizen.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
                      <div><span className="text-slate-500">Adresse :</span> {activeTicket.citizen.address}</div>
                    </>
                  )}
                </div>
              </section>

              {/* Sélecteur de mode */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Décision</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewMode('CORRECT')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      reviewMode === 'CORRECT' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    ✏ Corriger
                  </button>
                  <button
                    onClick={() => setReviewMode('MAINTAIN')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      reviewMode === 'MAINTAIN' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    ✓ Maintenir
                  </button>
                </div>
              </section>

              {/* Mode CORRECT — formulaire condamnation */}
              {reviewMode === 'CORRECT' && activeTicket.ticket.kind === 'CONVICTION' && (
                <section className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Juridiction *</label>
                      <input type="text" value={editCourt} onChange={e => setEditCourt(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Infraction *</label>
                      <input type="text" value={editOffense} onChange={e => setEditOffense(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Peine *</label>
                      <input type="text" value={editSentence} onChange={e => setEditSentence(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 italic">
                    La saisie corrigée repassera en validation par le superviseur des condamnations.
                  </div>
                </section>
              )}

              {/* Mode CORRECT — formulaire identité */}
              {reviewMode === 'CORRECT' && activeTicket.ticket.kind === 'IDENTITY' && (
                <section className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
                      <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label>
                      <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance *</label>
                      <input type="date" value={editBirthDate} onChange={e => setEditBirthDate(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu de naissance *</label>
                      <input type="text" value={editBirthPlace} onChange={e => setEditBirthPlace(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Père *</label>
                      <input type="text" value={editFather} onChange={e => setEditFather(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mère *</label>
                      <input type="text" value={editMother} onChange={e => setEditMother(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sexe *</label>
                      <select value={editGender} onChange={e => setEditGender(e.target.value as 'M' | 'F')}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent">
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse *</label>
                      <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 italic">
                    La correction sera soumise à la validation du superviseur des condamnations avant application.
                  </div>
                </section>
              )}

              {/* Mode MAINTAIN — justification (commun aux deux types) */}
              {reviewMode === 'MAINTAIN' && (
                <section>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Justification du maintien <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={maintainComment}
                    onChange={e => setMaintainComment(e.target.value)}
                    rows={4}
                    placeholder="Expliquez pourquoi la saisie est correcte en l'état…"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gabon-accent"
                  />
                </section>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeTicketModal}
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
              >
                Annuler
              </button>
              {reviewMode === 'CORRECT' ? (
                <button
                  onClick={() => activeTicket.ticket.kind === 'IDENTITY' ? handleCorrectIdentity() : handleCorrect()}
                  disabled={processingTicket}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold"
                >
                  {processingTicket ? 'Soumission…' : 'Soumettre la correction'}
                </button>
              ) : (
                <button
                  onClick={() => activeTicket.ticket.kind === 'IDENTITY' ? handleMaintainIdentity() : handleMaintain()}
                  disabled={processingTicket || !maintainComment.trim()}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
                >
                  {processingTicket ? 'Soumission…' : 'Soumettre le maintien'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}