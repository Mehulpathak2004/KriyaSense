import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { fetchAdminReports } from '../../api';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await fetchAdminReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-white">Loading reports...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl">
      <h1 className="text-3xl font-space font-bold text-white mb-2">Feedback Reports</h1>
      <p className="text-gray-400 mb-8">Review all user-flagged predictions to improve the model.</p>

      <div className="space-y-6">
        {reports.map(report => (
          <div key={report._id} className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 relative">
            {report.owner_id && (
              <span className="absolute top-6 right-6 px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-full">
                User: {report.owner_id}
              </span>
            )}
            
            <p className="text-lg text-white font-medium mb-4 pr-24">"{report.text}"</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-red-400 font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Model Output</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-gray-500 block text-xs">Sentiment</span>
                    <span className="text-white capitalize">{report.dominant_sentiment}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Emotions</span>
                    <span className="text-white capitalize">{report.emotions?.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-emerald-400 font-bold mb-2">User Expected</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-gray-500 block text-xs">Sentiment</span>
                    <span className="text-white capitalize">{report.report_suggested_sentiment || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Emotions</span>
                    <span className="text-white capitalize">{report.report_suggested_emotions?.join(', ') || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {report.report_comment && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm text-gray-300"><span className="text-gray-500 font-bold mr-2">User Comment:</span> {report.report_comment}</p>
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-20 bg-[var(--color-surface-1)] border border-white/5 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No reports found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminReports;
