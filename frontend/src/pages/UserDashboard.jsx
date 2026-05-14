import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Activity, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchCurrentUser, generateApiKey } from '../api';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await fetchCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      await generateApiKey();
      await loadUser();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  const isBlocked = localStorage.getItem('is_blocked') === 'true';
  const blockMessage = localStorage.getItem('block_message');

  if (isBlocked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-space font-bold text-white mb-4">Account Suspended</h1>
          <p className="text-gray-300 mb-8">Your KriyaSense API access has been suspended by an administrator.</p>
          <div className="bg-black/20 p-6 rounded-xl border border-red-500/20 max-w-md mx-auto mb-8">
            <span className="text-sm font-bold text-red-400 uppercase tracking-wider block mb-2">Reason</span>
            <p className="text-white italic">"{blockMessage || 'No reason provided.'}"</p>
          </div>
          <p className="text-gray-400">If you believe this is an error, please reach out via our Contact page.</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCalls = userData?.daily_api_calls?.[todayStr] || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-space font-bold text-white mb-2">Developer Dashboard</h1>
        <p className="text-gray-400">Manage your API access and view usage limits.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Daily API Usage</p>
              <h3 className="text-2xl font-bold text-white">{todayCalls} <span className="text-sm text-gray-500">/ 30 requests</span></h3>
            </div>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${todayCalls >= 30 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((todayCalls / 30) * 100, 100)}%` }}
            />
          </div>
          {todayCalls >= 30 && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Limit reached for today.
            </p>
          )}
        </div>

        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Key className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total API Keys</p>
              <h3 className="text-2xl font-bold text-white">{userData?.api_keys?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Lifetime API Calls</p>
              <h3 className="text-2xl font-bold text-white">{userData?.total_api_calls || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-space font-bold text-white">Your API Keys</h2>
          <button 
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="w-full sm:w-auto px-4 py-2 bg-white text-black font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : '+ Generate New Key'}
          </button>
        </div>

        {userData?.api_keys?.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/5 border-dashed">
            <Key className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">You haven't generated any API keys yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userData?.api_keys?.map((key, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] border border-white/5 rounded-xl gap-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-2 h-2 flex-shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <code className="text-emerald-400 font-mono text-sm sm:text-base break-all">{key}</code>
                </div>
                <button 
                  onClick={() => copyToClipboard(key)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedKey === key ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
