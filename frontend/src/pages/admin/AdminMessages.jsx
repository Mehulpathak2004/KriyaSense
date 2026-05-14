import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2, XCircle } from 'lucide-react';
import { fetchAdminMessages, replyAdminMessage, updateMessageStatus } from '../../api';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await fetchAdminMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (msgId, newStatus) => {
    try {
      await updateMessageStatus(msgId, newStatus);
      await loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMsg) return;
    setIsSending(true);
    
    try {
      await replyAdminMessage(selectedMsg._id, replyText, 'replied');
      setReplyText('');
      setSelectedMsg(null);
      await loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="text-white">Loading messages...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-100px)] gap-6">
      
      {/* Messages List Sidebar */}
      <div className="w-1/3 bg-[var(--color-surface-1)] border border-white/10 rounded-3xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Contact Queries</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {messages.map(msg => (
            <div 
              key={msg._id} 
              onClick={() => { setSelectedMsg(msg); setReplyText(''); }}
              className={`p-4 rounded-xl cursor-pointer transition-colors border ${
                selectedMsg?._id === msg._id 
                ? 'bg-white/10 border-white/20' 
                : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-white truncate pr-2">{msg.name}</span>
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
          {messages.length === 0 && <p className="text-center text-gray-500 p-4">No messages.</p>}
        </div>
      </div>

      {/* Message Detail & Reply Panel */}
      <div className="flex-1 bg-[var(--color-surface-1)] border border-white/10 rounded-3xl flex flex-col overflow-hidden">
        {selectedMsg ? (
          <>
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedMsg.subject}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{selectedMsg.name} &lt;{selectedMsg.email}&gt;</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedMsg.status !== 'unnecessary' && (
                  <button 
                    onClick={() => handleStatusChange(selectedMsg._id, 'unnecessary')}
                    className="p-2 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-lg flex items-center gap-1 text-sm"
                    title="Mark as Unnecessary"
                  >
                    <XCircle className="w-4 h-4" /> Mark Unnecessary
                  </button>
                )}
                {selectedMsg.status !== 'active' && (
                  <button 
                    onClick={() => handleStatusChange(selectedMsg._id, 'active')}
                    className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg flex items-center gap-1 text-sm"
                    title="Mark as Active"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Active
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-gray-300 whitespace-pre-wrap mb-8">
                {selectedMsg.message}
              </div>

              {selectedMsg.admin_reply && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 ml-12">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Your Reply</span>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedMsg.admin_reply}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleReplySubmit} className="relative">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply... (This will be emailed directly to the user)"
                  className="w-full h-32 bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-4 pr-14 text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] resize-none"
                  disabled={selectedMsg.status === 'replied' || isSending}
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim() || isSending || selectedMsg.status === 'replied'}
                  className="absolute bottom-4 right-4 p-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Mail className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a message to view details and reply.</p>
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default AdminMessages;
