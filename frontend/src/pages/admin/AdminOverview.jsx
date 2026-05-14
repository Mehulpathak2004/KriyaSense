import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, MessageSquare, AlertCircle, Settings, Save, Check } from 'lucide-react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminReports, fetchAdminMessages, fetchAdminSettings, updateAdminSettings } from '../../api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [kriyasenseUrl, setKriyasenseUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData, reportsData, messagesData, settingsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminUsers(),
          fetchAdminReports(),
          fetchAdminMessages(),
          fetchAdminSettings()
        ]);
        setStats(statsData);
        setKriyasenseUrl(settingsData.kriyasense_v1_url || '');
        // Sort users by created_at desc, take top 5
        const sortedUsers = usersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        setRecentUsers(sortedUsers);
        
        setRecentReports(reportsData.slice(0, 5));
        setRecentMessages(messagesData.slice(0, 5));
      } catch (err) {
        console.error("Overview load error", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateAdminSettings(kriyasenseUrl);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-white">Loading Overview...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-space font-bold text-white mb-8">Platform Overview</h1>

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
              <p className="text-sm text-gray-400 font-medium">Total API Calls</p>
              <h3 className="text-2xl font-bold text-white">{stats?.total_api_calls_made || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Users</h2>
          <div className="space-y-4">
            {recentUsers.map(user => (
              <div key={user._id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Contact Queries</h2>
          <div className="space-y-4">
            {recentMessages.map(msg => (
              <div key={msg._id} className="flex flex-col p-3 bg-white/5 rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white font-medium">{msg.name}</span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                    msg.status === 'replied' ? 'bg-emerald-500/20 text-emerald-400' :
                    msg.status === 'unnecessary' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{msg.subject}</p>
              </div>
            ))}
            {recentMessages.length === 0 && <p className="text-gray-500 text-sm">No messages yet.</p>}
          </div>
        </div>
      </div>

      {/* Model Settings Section */}
      <div className="mt-12 bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Settings className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Model Settings</h2>
            <p className="text-sm text-gray-500">Configure external model endpoints and API integrations.</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <label className="block text-sm font-medium text-gray-400 mb-3">KriyaSense-V1 Colab API URL</label>
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                value={kriyasenseUrl}
                onChange={(e) => setKriyasenseUrl(e.target.value)}
                placeholder="e.g. aneqrlqzfbyl.shares.zrok.io"
                className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                showSaveSuccess 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isSavingSettings ? <Save className="w-4 h-4 animate-spin" /> : showSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {showSaveSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Enter the zrok or ngrok URL without protocol (e.g. aneqrlqzfbyl.shares.zrok.io).
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
