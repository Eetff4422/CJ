import { DashboardStats } from '@application/use-cases/dashboard/GetGlobalDashboardUseCase';
import { AuditLogEntry } from '@domain/entities/AuditLog';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction, ConvictionStatus } from '@domain/entities/Conviction';
import { ROLES } from '@domain/entities/Role';
import { User } from '@domain/entities/User';
import { container } from '@infrastructure/container';
import { Layout } from '@ui/components/Layout';
import { formatDateTime } from '@ui/lib/format';
import { useEffect, useState } from 'react';
export function DgDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // Vue BDD type SGBD
type DbTable = 'citizens' | 'convictions' | 'bulletins' | 'users';
const [activeTable, setActiveTable] = useState<DbTable>('citizens');
const [dbSearch, setDbSearch] = useState('');
const [citizens, setCitizens] = useState<Citizen[]>([]);
const [convictions, setConvictions] = useState<Conviction[]>([]);
const [bulletins, setBulletins] = useState<Bulletin[]>([]);
const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const load = async () => {
      const [s, log, cits, convs, bulls, usrs] = await Promise.all([
  container.getGlobalDashboardUseCase.execute(),
  container.auditRepository.listAll(),
  container.citizenRepository.listAll(),
  container.convictionRepository.listAll(),
  container.bulletinRepository.listAll(),
  container.authRepository.listAll(),
]);
      setStats(s);
      setAuditLog(log);
      setLoading(false);
      setCitizens(cits);
setConvictions(convs);
setBulletins(bulls);
setUsers(usrs);
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <Layout>
        <div className="text-slate-400">Chargement du tableau de bord…</div>
      </Layout>
    );
  }
  // Filtrage live sur la table active
const q = dbSearch.trim().toLowerCase();
const filterRow = (row: Record<string, any>): boolean => {
  if (!q) return true;
  return Object.values(row).some(v =>
    v !== null && v !== undefined && String(v).toLowerCase().includes(q)
  );
};
const filteredCitizens   = citizens.filter(filterRow);
const filteredConvictions = convictions.filter(filterRow);
const filteredBulletins  = bulletins.filter(filterRow);
const filteredUsers      = users.filter(filterRow);

const tableMeta: Record<DbTable, { label: string; count: number }> = {
  citizens:    { label: 'Citoyens',      count: filteredCitizens.length },
  convictions: { label: 'Condamnations', count: filteredConvictions.length },
  bulletins:   { label: 'Bulletins',     count: filteredBulletins.length },
  users:       { label: 'Utilisateurs',  count: filteredUsers.length },
};
  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Direction Générale
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">
          Vue transversale de l'activité du service et accès au journal d'audit
          global.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi
          label="Citoyens enregistrés"
          value={stats.totalCitizens.toString()}
          sub="Total dans la base"
          color="primary"
        />
        <Kpi
          label="Demandes totales"
          value={stats.totalBulletinRequests.toString()}
          sub="Depuis l'ouverture"
          color="accent"
        />
        <Kpi
          label="Bulletins délivrés"
          value={stats.issuedBulletins.toString()}
          sub={`${stats.pendingProcessing} en attente`}
          color="success"
        />
        <Kpi
          label="Revenus générés"
          value={`${stats.totalRevenueFcfa.toLocaleString('fr-FR')} FCFA`}
          sub="Paiements enregistrés"
          color="accent"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            Répartition des demandes
          </h2>
          <div className="space-y-3">
            <DistRow
              label="En attente de paiement"
              value={stats.bulletinsByStatus[BulletinStatus.PENDING_PAYMENT]}
              total={stats.totalBulletinRequests}
              color="bg-amber-500"
            />
            <DistRow
              label="À traiter"
              value={stats.bulletinsByStatus[BulletinStatus.PENDING_PROCESSING]}
              total={stats.totalBulletinRequests}
              color="bg-blue-500"
            />
            <DistRow
              label="Délivrés"
              value={stats.bulletinsByStatus[BulletinStatus.ISSUED]}
              total={stats.totalBulletinRequests}
              color="bg-green-500"
            />
          </div>
          {stats.averageProcessingHours !== null && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-sm">
              <span className="text-slate-500">Délai moyen de traitement :</span>{' '}
              <span className="font-semibold text-slate-800">
                {formatDuration(stats.averageProcessingHours)}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            Condamnations enregistrées
          </h2>
          <div className="space-y-3">
            <DistRow
              label="En attente de validation"
              value={
                stats.convictionsByStatus[ConvictionStatus.PENDING_VALIDATION]
              }
              total={stats.totalConvictions || 1}
              color="bg-amber-500"
            />
            <DistRow
              label="Validées"
              value={stats.convictionsByStatus[ConvictionStatus.VALIDATED]}
              total={stats.totalConvictions || 1}
              color="bg-green-500"
            />
            <DistRow
              label="Rejetées"
              value={stats.convictionsByStatus[ConvictionStatus.REJECTED]}
              total={stats.totalConvictions || 1}
              color="bg-red-500"
            />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Total dans la base :</span>{' '}
            <span className="font-semibold text-slate-800">
              {stats.totalConvictions}
            </span>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Journal d'audit global (immuable)
          </h2>
          <span className="text-sm text-slate-500">
            {auditLog.length} entrées
          </span>
        </div>
        {auditLog.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune action enregistrée.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                <tr>
                  <th className="text-left px-6 py-2">Horodatage</th>
                  <th className="text-left px-6 py-2">Utilisateur</th>
                  <th className="text-left px-6 py-2">Rôle</th>
                  <th className="text-left px-6 py-2">Action</th>
                  <th className="text-left px-6 py-2">Détails</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-6 py-2 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(e.timestamp)}
                    </td>
                    <td className="px-6 py-2 text-slate-700">
                      {e.userEmail ?? '—'}
                    </td>
                    <td className="px-6 py-2 text-slate-500">
                      {e.userRole ?? '—'}
                    </td>
                    <td className="px-6 py-2 font-semibold text-slate-800">
                      {e.action}
                    </td>
                    <td className="px-6 py-2 text-slate-600">{e.details ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ── RÉFÉRENTIEL NATIONAL — VUE BASE DE DONNÉES ──────────────────── */}
<section className="mt-8">
  <div className="mb-4">
    <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
      Référentiel national
    </div>
    <h2 className="text-2xl font-bold text-slate-800">Base de données centralisée</h2>
    <p className="text-slate-500 text-sm mt-1">
      Vue en lecture seule des 4 tables principales du référentiel. Les clés étrangères
      matérialisent les relations entre tables.
    </p>
  </div>

  {/* Onglets */}
  <div className="flex gap-1 border-b border-slate-200 mb-3">
    {(Object.keys(tableMeta) as DbTable[]).map(t => (
      <button
        key={t}
        onClick={() => { setActiveTable(t); setDbSearch(''); }}
        className={`px-4 py-2 text-sm font-semibold transition-colors ${
          activeTable === t
            ? 'text-gabon-primary border-b-2 border-gabon-primary -mb-px'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <span className="font-mono text-xs mr-1 opacity-60">{t}</span>
        {tableMeta[t].label}
      </button>
    ))}
  </div>

  {/* Barre recherche + compteur */}
  <div className="flex items-center gap-3 mb-3">
    <input
      type="text"
      value={dbSearch}
      onChange={e => setDbSearch(e.target.value)}
      placeholder={`Rechercher dans ${activeTable}…`}
      className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gabon-accent"
    />
    <div className="text-xs text-slate-500 whitespace-nowrap">
      <span className="font-bold text-slate-700">{tableMeta[activeTable].count}</span> ligne{tableMeta[activeTable].count > 1 ? 's' : ''}
    </div>
  </div>

  {/* Tableau */}
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="max-h-[500px] overflow-auto">
      <table className="w-full text-xs font-mono">
        {activeTable === 'citizens' && (
          <>
            <thead className="bg-slate-100 sticky top-0">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2 font-bold">id</th>
                <th className="px-3 py-2 font-bold">nationalId</th>
                <th className="px-3 py-2 font-bold">lastName</th>
                <th className="px-3 py-2 font-bold">firstName</th>
                <th className="px-3 py-2 font-bold">birthDate</th>
                <th className="px-3 py-2 font-bold">gender</th>
              </tr>
            </thead>
            <tbody>
              {filteredCitizens.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-700">{c.id}</td>
                  <td className="px-3 py-2 text-slate-800 font-semibold">{c.nationalId}</td>
                  <td className="px-3 py-2">{c.lastName}</td>
                  <td className="px-3 py-2">{c.firstName}</td>
                  <td className="px-3 py-2 text-slate-600">{c.birthDate}</td>
                  <td className="px-3 py-2 text-slate-600">{c.gender}</td>
                </tr>
              ))}
            </tbody>
          </>
        )}

        {activeTable === 'convictions' && (
          <>
            <thead className="bg-slate-100 sticky top-0">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2 font-bold">id</th>
<th className="px-3 py-2 font-bold">citizenId <span className="text-blue-600">→ citoyens</span></th>                <th className="px-3 py-2 font-bold">court</th>
                <th className="px-3 py-2 font-bold">offense</th>
                <th className="px-3 py-2 font-bold">decisionDate</th>
                <th className="px-3 py-2 font-bold">status</th>
              </tr>
            </thead>
            <tbody>
              {filteredConvictions.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-700">{c.id}</td>
                  <td className="px-3 py-2 text-blue-700">{c.citizenId}</td>
                  <td className="px-3 py-2">{c.court}</td>
                  <td className="px-3 py-2">{c.offense}</td>
                  <td className="px-3 py-2 text-slate-600">{c.decisionDate}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        )}

        {activeTable === 'bulletins' && (
          <>
            <thead className="bg-slate-100 sticky top-0">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2 font-bold">id</th>
                <th className="px-3 py-2 font-bold">requestNumber</th>
<th className="px-3 py-2 font-bold">citizenId <span className="text-blue-600">→ citoyens</span></th>                <th className="px-3 py-2 font-bold">status</th>
                <th className="px-3 py-2 font-bold">requestedAt</th>
                <th className="px-3 py-2 font-bold">issuedAt</th>
              </tr>
            </thead>
            <tbody>
              {filteredBulletins.map((b, i) => (
                <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-700">{b.id}</td>
                  <td className="px-3 py-2 font-semibold">{b.requestNumber}</td>
                  <td className="px-3 py-2 text-blue-700">{b.citizenId}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">{b.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{b.requestedAt?.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-slate-600">{b.issuedAt?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </>
        )}

        {activeTable === 'users' && (
          <>
            <thead className="bg-slate-100 sticky top-0">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2 font-bold">id</th>
                <th className="px-3 py-2 font-bold">email</th>
                <th className="px-3 py-2 font-bold">fullName</th>
                <th className="px-3 py-2 font-bold">role</th>
<th className="px-3 py-2 font-bold">citizenId <span className="text-blue-600">→ citoyens</span></th>                <th className="px-3 py-2 font-bold">isActive</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-700">{u.id}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">{ROLES[u.role].label}</span>
                  </td>
                  <td className="px-3 py-2 text-blue-700">{u.citizenId ?? '—'}</td>
                  <td className="px-3 py-2">
                    {u.isActive
                      ? <span className="text-green-600">true</span>
                      : <span className="text-red-600">false</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        )}
      </table>
    </div>
  </div>

  <div className="text-xs text-slate-400 italic mt-2">
    Vue en lecture seule — les champs sensibles (mot de passe, adresses, filiation) sont volontairement masqués.
  </div>
</section>
    </Layout>
  );
}

function Kpi({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: 'primary' | 'accent' | 'success';
}) {
  const colors = {
    primary: 'bg-gabon-primary text-white',
    accent: 'bg-gabon-accent text-white',
    success: 'bg-gabon-success text-white',
  };
  return (
    <div className={`rounded-xl p-5 shadow-sm ${colors[color]}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-70 mt-1">{sub}</div>
    </div>
  );
}

function DistRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">
          {value} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} jours`;
}
