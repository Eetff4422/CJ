import { useEffect, useState } from 'react';
import { Layout } from '@ui/components/Layout';
import { container } from '@infrastructure/container';
import { DashboardStats } from '@application/use-cases/dashboard/GetGlobalDashboardUseCase';
import { AuditLogEntry } from '@domain/entities/AuditLog';
import { formatDateTime } from '@ui/lib/format';
import { BulletinStatus } from '@domain/entities/Bulletin';
import { ConvictionStatus } from '@domain/entities/Conviction';

export function DgDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, log] = await Promise.all([
        container.getGlobalDashboardUseCase.execute(),
        container.auditRepository.listAll(),
      ]);
      setStats(s);
      setAuditLog(log);
      setLoading(false);
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
