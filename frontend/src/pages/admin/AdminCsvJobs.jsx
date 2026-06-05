import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { fetchAdminCsvJobs } from '../../api';

const STATUS_COLORS = {
  uploaded: 'bg-blue-500/20 text-blue-400',
  queued: 'bg-amber-500/20 text-amber-400',
  processing: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
};

const AdminCsvJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAdminCsvJobs();
        setJobs(data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '—';
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-white">Loading CSV Jobs...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-space font-bold text-white mb-2">CSV Batch Jobs</h1>
      <p className="text-gray-400 mb-8">Monitor all CSV batch prediction jobs across all users.</p>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Jobs</p>
          <p className="text-2xl font-bold text-white">{jobs.length}</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{jobs.filter(j => j.status === 'completed').length}</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-purple-400">{jobs.filter(j => j.status === 'processing' || j.status === 'queued').length}</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400">{jobs.filter(j => j.status === 'failed').length}</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/5 border-dashed">
          <FileSpreadsheet className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No CSV jobs found.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/5">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">File</th>
                <th className="p-4 font-medium">Column</th>
                <th className="p-4 font-medium">Rows</th>
                <th className="p-4 font-medium">Processed</th>
                <th className="p-4 font-medium">Errors</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-[var(--color-brand-primary)] font-medium">{job.user}</td>
                  <td className="p-4 text-white max-w-[160px] truncate">{job.original_filename}</td>
                  <td className="p-4 text-gray-400">{job.selected_column || '—'}</td>
                  <td className="p-4 text-gray-400">{job.row_count}</td>
                  <td className="p-4 text-gray-400">{job.processed_rows || 0}</td>
                  <td className="p-4">
                    {job.error_rows > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{job.error_rows}</span>
                    ) : <span className="text-gray-500">0</span>}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold ${STATUS_COLORS[job.status] || ''}`}>{job.status}</span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs"><Clock className="w-3 h-3 inline mr-1" />{getTimeRemaining(job.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminCsvJobs;
