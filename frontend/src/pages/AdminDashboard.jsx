import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, MessageSquare, AlertCircle } from 'lucide-react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminReports } from '../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData, reportsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminUsers(),
          fetchAdminReports()
        ]);
        setStats(statsData);
        setUsers(usersData);
        setReports(reportsData);
      } catch (err) {
        console.error("Admin load error", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-space font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Platform overview and user analytics.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl"><Users className="w-6 h-6 text-blue-400" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total Users</p>
              <h3 className="text-2xl font-bold text-white">{stats?.total_users || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl"><Activity className="w-6 h-6 text-emerald-400" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Landing Page Analyses</p>
              <h3 className="text-2xl font-bold text-white">{stats?.total_web_analyses || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl"><Activity className="w-6 h-6 text-purple-400" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total API Analyses</p>
              <h3 className="text-2xl font-bold text-white">{stats?.total_api_analyses || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl"><MessageSquare className="w-6 h-6 text-amber-400" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">User Reports</p>
              <h3 className="text-2xl font-bold text-white">{reports.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Table */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-space font-bold text-white mb-6">Users Overview</h2>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="py-3 px-2 font-medium">Username</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">API Keys</th>
                  <th className="py-3 px-2 font-medium">Total API Calls</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map(user => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-gray-300">
                    <td className="py-3 px-2 font-medium text-white">{user.username}</td>
                    <td className="py-3 px-2">{user.email || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-white/5 rounded-full text-xs">
                        {user.api_keys?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-emerald-400">{user.total_api_calls || 0}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="4" className="py-4 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reports Feed */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-space font-bold text-white mb-6">User Feedback & Reports</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {reports.map(report => (
              <div key={report._id} className="p-4 bg-[var(--color-surface-2)] border border-white/5 rounded-2xl">
                <p className="text-sm text-gray-300 italic mb-3">"{report.text}"</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-red-400 font-medium mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Model Output</p>
                    <p className="text-gray-300 capitalize">{report.sentiment?.positive > report.sentiment?.negative ? 'Positive' : 'Negative'}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-emerald-400 font-medium mb-1">User Expected</p>
                    <p className="text-white capitalize font-medium">{report.report_suggested_sentiment || 'Not specified'}</p>
                    {report.report_suggested_emotions && (
                      <p className="mt-1 text-gray-400">{report.report_suggested_emotions.join(', ')}</p>
                    )}
                  </div>
                </div>
                {report.report_comment && (
                  <p className="mt-3 text-sm text-gray-400"><span className="font-medium text-gray-300">Comment:</span> {report.report_comment}</p>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-8 text-gray-500">No reports submitted yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
