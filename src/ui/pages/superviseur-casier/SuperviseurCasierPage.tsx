import { useEffect, useState } from 'react';
import { Layout } from '@ui/components/Layout';
import { container } from '@infrastructure/container';
import { Bulletin, BulletinStatus } from '@domain/entities/Bulletin';
import {
  BULLETIN_STATUS_LABEL,
  BULLETIN_STATUS_BADGE,
  formatDateTime,
} from '@ui/lib/format';

export function SuperviseurCasierPage() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    container.bulletinRepository.listAll().then((all) => {
      setBulletins(all);
      setLoading(false);
    });
  }, []);

  const counts = {
    pendingPayment: bulletins.filter((b) => b.status === BulletinStatus.PENDING_PAYMENT).length,
    pendingProcessing: bulletins.filter((b) => b.status === BulletinStatus.PENDING_PROCESSING).length,
    issued: bulletins.filter((b) => b.status === BulletinStatus.ISSUED).length,
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gabon-accent mb-1">
          Superviseur du casier judiciaire
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Supervision du service</h1>
        <p className="text-slate-500 mt-1">
          Vue consolidée de l'activité du service du casier judiciaire.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="En attente de paiement" value={counts.pendingPayment} color="amber" />
        <StatCard label="À traiter par les agents" value={counts.pendingProcessing} color="blue" />
        <StatCard label="Bulletins délivrés" value={counts.issued} color="green" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Historique complet des demandes</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Chargement…</div>
        ) : bulletins.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aucune demande enregistrée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-6 py-3">N° Demande</th>
                <th className="text-left px-6 py-3">Soumise le</th>
                <th className="text-left px-6 py-3">Motif</th>
                <th className="text-left px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-mono font-semibold text-slate-800">
                    {b.requestNumber}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatDateTime(b.requestedAt)}
                  </td>
                  <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
                    {b.reason}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full border ${BULLETIN_STATUS_BADGE[b.status]}`}
                    >
                      {BULLETIN_STATUS_LABEL[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'amber' | 'blue' | 'green';
}) {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
