import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { fetchAdminUsers, blockUser, unblockUser, deleteUser } from '../../api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockMessage, setBlockMessage] = useState('');

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
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleBlockClick = (user) => {
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

  const handleUnblock = async (userId) => {
    if(window.confirm('Are you sure you want to restore this account?')) {
      await unblockUser(userId);
      await loadUsers();
    }
  };

  const handleDelete = async (userId) => {
    if(window.confirm('WARNING: This will delete the user and all their prediction data forever. Continue?')) {
      await deleteUser(userId);
      await loadUsers();
    }
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
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />
        </div>
      </div>

      <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="py-4 px-4 font-medium cursor-pointer" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">Username <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium">Email</th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('stats_today')}>
                  <div className="flex items-center justify-center gap-1">Today <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('stats_week')}>
                  <div className="flex items-center justify-center gap-1">Week <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center cursor-pointer" onClick={() => handleSort('total_api_calls')}>
                  <div className="flex items-center justify-center gap-1">Total <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
                <th className="py-4 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedUsers.map(user => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-gray-300">
                  <td className="py-4 px-4 font-medium text-white">{user.username}</td>
                  <td className="py-4 px-4">{user.email}</td>
                  <td className="py-4 px-4 text-center font-mono text-blue-400">{user.stats_today || 0}</td>
                  <td className="py-4 px-4 text-center font-mono text-purple-400">{user.stats_week || 0}</td>
                  <td className="py-4 px-4 text-center font-mono text-emerald-400">{user.total_api_calls || 0}</td>
                  <td className="py-4 px-4 text-center">
                    {user.is_blocked ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Blocked</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Active</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.is_blocked ? (
                        <button onClick={() => handleUnblock(user._id)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Unblock User">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleBlockClick(user)} className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors" title="Block User">
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(user._id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Data & Account">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {blockModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-1)] border border-red-500/30 p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-2">Block {selectedUser?.username}</h3>
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
