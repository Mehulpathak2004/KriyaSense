import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Trash2, Search, ArrowUpDown, ChevronDown, ChevronUp, Edit2, Check, X, Key, Building2 } from 'lucide-react';
import { fetchAdminUsers, blockUser, unblockUser, deleteUser, updateUserDailyLimit } from '../../api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockMessage, setBlockMessage] = useState('');

  // Editing limits
  const [editingLimitUserId, setEditingLimitUserId] = useState(null);
  const [newLimitVal, setNewLimitVal] = useState(30);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedUsers = [...users].filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.company_name && u.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'created_at') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleBlockClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setBlockMessage('');
    setBlockModalOpen(true);
  };

  const submitBlock = async () => {
    try {
      await blockUser(selectedUser._id, blockMessage);
      setBlockModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblock = async (e, userId) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to restore this account?')) {
      await unblockUser(userId);
      await loadUsers();
    }
  };

  const handleDelete = async (e, userId) => {
    e.stopPropagation();
    if(window.confirm('WARNING: This will delete the user and all their prediction data forever. Continue?')) {
      await deleteUser(userId);
      await loadUsers();
    }
  };

  const startEditLimit = (e, user) => {
    e.stopPropagation();
    setEditingLimitUserId(user._id);
    setNewLimitVal(user.daily_limit || 30);
  };

  const saveNewLimit = async (e, userId) => {
    e.stopPropagation();
    try {
      await updateUserDailyLimit(userId, newLimitVal);
      setEditingLimitUserId(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelEditLimit = (e) => {
    e.stopPropagation();
    setEditingLimitUserId(null);
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (isLoading) return <div className="text-white">Loading users...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-space font-bold text-white">User Management</h1>
        <div className="relative w-full sm:w-64">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users or companies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />
        </div>
      </div>

      <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="py-4 px-5 w-8"></th>
                <th className="py-4 px-4 font-medium cursor-pointer" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">User / Company <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium">Industry</th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('stats_today')}>
                  <div className="flex items-center justify-center gap-1">Today <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('daily_limit')}>
                  <div className="flex items-center justify-center gap-1">Daily Limit <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('total_api_calls')}>
                  <div className="flex items-center justify-center gap-1">Total Calls <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
                <th className="py-4 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedUsers.map(user => {
                const isExpanded = expandedUser === user._id;
                const isEditingLimit = editingLimitUserId === user._id;

                return (
                  <React.Fragment key={user._id}>
                    {/* Main Row */}
                    <tr 
                      onClick={() => toggleExpand(user._id)}
                      className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors text-gray-300 ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                    >
                      <td className="py-4 px-5">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{user.username}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                          {user.company_name && (
                            <span className="text-xs text-[var(--color-brand-primary)] font-medium mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {user.company_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-300">
                          {user.industry || 'Not Provided'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-blue-400 font-semibold">{user.stats_today || 0}</td>
                      <td className="py-4 px-4 text-center font-mono text-white">
                        {isEditingLimit ? (
                          <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                            <input 
                              type="number" 
                              value={newLimitVal} 
                              onChange={e => setNewLimitVal(parseInt(e.target.value) || 0)}
                              className="w-16 bg-[var(--color-surface-2)] border border-white/15 rounded px-2 py-0.5 text-center text-white focus:outline-none"
                            />
                            <button onClick={e => saveNewLimit(e, user._id)} className="p-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded" title="Save">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelEditLimit} className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 group">
                            <span>{user.daily_limit || 30}</span>
                            <button onClick={e => startEditLimit(e, user)} className="p-1 text-gray-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100" title="Edit limit">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-emerald-400 font-semibold">{user.total_api_calls || 0}</td>
                      <td className="py-4 px-4 text-center">
                        {user.is_blocked ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 font-medium">Blocked</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 font-medium">Active</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {user.is_blocked ? (
                            <button onClick={e => handleUnblock(e, user._id)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors" title="Unblock User">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <button onClick={e => handleBlockClick(e, user)} className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-colors" title="Block User">
                              <ShieldAlert className="w-4.5 h-4.5" />
                            </button>
                          )}
                          <button onClick={e => handleDelete(e, user._id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors" title="Delete Data & Account">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Area */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 border-b border-white/5">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-black/20 p-6 overflow-hidden border-t border-b border-white/5"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Company Profile Card */}
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[var(--color-brand-primary)]" />
                                    Company Profile context
                                  </h4>
                                  <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500 block text-xs">Company Name</span>
                                        <span className="text-white font-medium">{user.company_name || 'Not Provided'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-xs">Industry</span>
                                        <span className="text-white font-medium">{user.industry || 'Not Provided'}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-white/5 pt-2">
                                      <div>
                                        <span className="text-gray-500 block text-xs">Company Size</span>
                                        <span className="text-white font-medium">{user.company_size || 'Not Provided'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-xs">Account Created</span>
                                        <span className="text-white font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div className="border-t border-white/5 pt-2">
                                      <span className="text-gray-500 block text-xs">Use Case Description</span>
                                      <p className="text-gray-300 text-xs italic mt-1 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        "{user.use_case || 'No description provided.'}"
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* API Key & Access Card */}
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Key className="w-4 h-4 text-emerald-400" />
                                    Access & API Keys
                                  </h4>
                                  <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-2">Generated API Keys</span>
                                      {user.api_keys?.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No API keys generated yet.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {user.api_keys?.map((key, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-black/20 border border-white/5 rounded-lg">
                                              <code className="text-emerald-400 font-mono text-xs break-all">
                                                {key.substring(0, 10)}...{key.substring(key.length - 6)}
                                              </code>
                                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-bold">Active</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-gray-500 block">Last API Call</span>
                                        <span className="text-white font-mono">{user.last_api_call ? new Date(user.last_api_call).toLocaleString() : 'Never'}</span>
                                      </div>
                                      {user.is_blocked && (
                                        <div>
                                          <span className="text-red-400 block font-medium">Block Reason</span>
                                          <span className="text-gray-300 italic">"{user.block_message || 'None'}"</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {blockModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-1)] border border-red-500/30 p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-2 font-space">Block {selectedUser?.username}</h3>
            <p className="text-sm text-gray-400 mb-4">This will disable their API keys and notify them via email.</p>
            <textarea 
              value={blockMessage}
              onChange={(e) => setBlockMessage(e.target.value)}
              placeholder="Reason for blocking..."
              className="w-full h-32 bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500 mb-4 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setBlockModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={submitBlock} disabled={!blockMessage} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">Block Account</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;
