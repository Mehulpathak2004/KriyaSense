import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown } from 'lucide-react';

const config = {
  positive: {
    icon: Smile,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.2)]',
    label: 'Positive Sentiment'
  },
  neutral: {
    icon: Meh,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    glow: 'shadow-[0_0_50px_rgba(156,163,175,0.2)]',
    label: 'Neutral Sentiment'
  },
  negative: {
    icon: Frown,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-[0_0_50px_rgba(239,68,68,0.2)]',
    label: 'Negative Sentiment'
  }
};

const HeroSentiment = ({ sentiment }) => {
  const current = config[sentiment?.toLowerCase()] || config.neutral;
  const Icon = current.icon;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex flex-col items-center justify-center p-8 rounded-3xl border ${current.bg} ${current.border} ${current.glow} backdrop-blur-xl transition-all duration-500`}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`p-6 rounded-2xl bg-white/5 border border-white/10 mb-6 ${current.color}`}
      >
        <Icon className="w-16 h-16" strokeWidth={1.5} />
      </motion.div>
      
      <motion.h4 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-space font-bold text-white mb-2 tracking-tight"
      >
        {sentiment?.toUpperCase()}
      </motion.h4>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm font-medium"
      >
        {current.label}
      </motion.p>
      
      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
        <div className={`w-2 h-2 rounded-full animate-pulse ${current.bg.replace('bg-', 'bg-').split('/')[0]}`}></div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">KriyaSense Intelligence</span>
      </div>
    </motion.div>
  );
};

export default HeroSentiment;
