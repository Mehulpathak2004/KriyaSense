import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, MessageSquare, AlertCircle, Settings, Save, Check, FileSpreadsheet, Sparkles, Terminal, ArrowUpRight, Cpu } from 'lucide-react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminReports, fetchAdminMessages, fetchAdminSettings, updateAdminSettings, checkModelHealth, fetchRecentActivity } from '../../api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [modelHealth, setModelHealth] = useState({ kriyacore: true, kriyasense: false });
  const [kriyasenseUrl, setKriyasenseUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData, messagesData, settingsData, healthData, activityData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminUsers(),
          fetchAdminMessages(),
          fetchAdminSettings(),
          checkModelHealth().catch(() => ({ kriyacore: true, kriyasense: false })),
          fetchRecentActivity().catch(() => [])
        ]);
        
        setStats(statsData);
        setKriyasenseUrl(settingsData.kriyasense_v1_url || '');
        setModelHealth(healthData);
        setRecentActivity(activityData);

        // Sort users by created_at desc, take top 5
        const sortedUsers = usersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        setRecentUsers(sortedUsers);
        
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
      
      // Re-trigger health check after saving new url
      const health = await checkModelHealth().catch(() => ({ kriyacore: true, kriyasense: false }));
      setModelHealth(health);
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* CSV Stats & Model Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-4">Batch CSV Processing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <span className="text-xs text-gray-500 block">Total CSV Jobs</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats?.total_csv_jobs || 0}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <span className="text-xs text-gray-500 block">Completed Jobs</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{stats?.csv_completed || 0}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <span className="text-xs text-gray-500 block">Total Rows Analyzed</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">{stats?.total_csv_rows_processed || 0}</span>
            </div>
          </div>
        </div>

        {/* Live LLM Availability Card */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Live Inference Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-sm text-white font-medium">KriyaCore (Local)</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-sm text-white font-medium">KriyaSense-V1 (LLM)</span>
                {modelHealth.kriyasense ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    OFFLINE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent API Activity Feed (Pro monitoring) */}
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Recent Developer API Activity
            </h2>
            <span className="text-xs text-gray-500 font-mono">Real-time Stream logs</span>
          </div>
          <div className="space-y-3 flex-grow max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {recentActivity.map((act) => (
              <div key={act._id} className="p-3.5 bg-black/25 border border-white/5 rounded-xl hover:bg-black/35 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">POST</span>
                    <span className="text-sm font-semibold text-white font-mono">/api/v1/analyze</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>by</span>
                    <span className="text-gray-300 font-medium">{act.user_info?.username || 'anonymous'}</span>
                    <span className="text-gray-600">({act.user_info?.email || 'API Key'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-white/5 text-gray-300 rounded text-[10px]">
                      {act.model_used || 'kriyacore'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      act.dominant_sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      act.dominant_sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {act.dominant_sentiment?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 italic truncate bg-white/[0.02] p-2 rounded border border-white/5">
                  "{act.text}"
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm italic">
                No recent developer API activity logged.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Recent Users */}
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent User Registrations</h2>
            <div className="space-y-4">
              {recentUsers.map(user => (
                <div key={user._id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-white font-medium text-sm">{user.username}</p>
                    <p className="text-[10px] text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 font-space">Recent Inquiries</h2>
            <div className="space-y-4">
              {recentMessages.map(msg => (
                <div key={msg._id} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-white font-semibold">{msg.name}</span>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                      msg.status === 'replied' ? 'bg-emerald-500/20 text-emerald-400' :
                      msg.status === 'unnecessary' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{msg.subject}</p>
                </div>
              ))}
              {recentMessages.length === 0 && <p className="text-gray-500 text-xs italic">No messages yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Model Settings Section */}
      <div className="mt-12 bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-amber-500/15 rounded-xl">
            <Settings className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-space">Model Configuration Settings</h2>
            <p className="text-sm text-gray-500">Configure external model endpoints and API integrations.</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <label className="block text-sm font-medium text-gray-400 mb-3 font-space">KriyaSense-V1 Colab API URL</label>
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                value={kriyasenseUrl}
                onChange={(e) => setKriyasenseUrl(e.target.value)}
                placeholder="e.g. aneqrlqzfbyl.shares.zrok.io"
                className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                showSaveSuccess 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isSavingSettings ? <Save className="w-4 h-4 animate-spin" /> : showSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {showSaveSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Enter the zrok or ngrok URL without protocol (e.g. aneqrlqzfbyl.shares.zrok.io).
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
