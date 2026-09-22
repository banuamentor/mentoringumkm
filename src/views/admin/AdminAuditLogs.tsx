import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatDate } from '../../utils/formatters.ts';
import { ShieldCheck, Search, RefreshCw, Eye, X } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/audit-logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
      l.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log Sistem</h1>
          <p className="text-xs text-slate-500">
            Jejak rekaman aktivitas keamanan, perubahan master data, transaksi, dan sesi mentoring
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aktivitas, email, atau entitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-bold text-slate-900">{filteredLogs.length}</span> log
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Waktu</th>
                <th className="py-2.5 px-4 font-semibold">Pengguna</th>
                <th className="py-2.5 px-4 font-semibold">Aksi</th>
                <th className="py-2.5 px-4 font-semibold">Entitas</th>
                <th className="py-2.5 px-4 font-semibold">ID</th>
                <th className="py-2.5 px-4 font-semibold">IP Address</th>
                <th className="py-2.5 px-4 font-semibold text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Memuat audit log dari Cloud SQL...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Tidak ada log tercatat.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                      {log.userEmail || 'System'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.entityId || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                        title="Lihat Metadata Payload"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Detail Payload</h3>
                <p className="text-xs text-slate-500">
                  Aksi: {selectedLog.action} • {selectedLog.entityType} #{selectedLog.entityId}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <pre className="max-h-80 overflow-y-auto rounded-lg bg-slate-900 p-4 text-xs font-mono text-emerald-400">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
