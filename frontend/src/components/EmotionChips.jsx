import React from 'react';
import { motion } from 'framer-motion';

const emotionConfig = {
  admiration: { emoji: '🤩', color: 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30' },
  amusement: { emoji: '😂', color: 'from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-yellow-500/30' },
  anger: { emoji: '😡', color: 'from-red-500/20 to-red-600/20 text-red-400 border-red-500/30' },
  annoyance: { emoji: '🙄', color: 'from-orange-500/20 to-orange-600/20 text-orange-400 border-orange-500/30' },
  approval: { emoji: '👍', color: 'from-green-500/20 to-green-600/20 text-green-400 border-green-500/30' },
  caring: { emoji: '🥰', color: 'from-rose-500/20 to-rose-600/20 text-rose-400 border-rose-500/30' },
  confusion: { emoji: '😕', color: 'from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/30' },
  curiosity: { emoji: '🤔', color: 'from-teal-500/20 to-teal-600/20 text-teal-400 border-teal-500/30' },
  desire: { emoji: '😏', color: 'from-pink-500/20 to-pink-600/20 text-pink-400 border-pink-500/30' },
  disappointment: { emoji: '😞', color: 'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30' },
  disapproval: { emoji: '👎', color: 'from-orange-600/20 to-orange-700/20 text-orange-500 border-orange-600/30' },
  disgust: { emoji: '🤢', color: 'from-lime-500/20 to-lime-600/20 text-lime-400 border-lime-500/30' },
  embarrassment: { emoji: '😳', color: 'from-fuchsia-500/20 to-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/30' },
  excitement: { emoji: '🎉', color: 'from-yellow-400/20 to-yellow-500/20 text-yellow-300 border-yellow-400/30' },
  fear: { emoji: '😨', color: 'from-indigo-500/20 to-indigo-600/20 text-indigo-400 border-indigo-500/30' },
  gratitude: { emoji: '🙏', color: 'from-cyan-500/20 to-cyan-600/20 text-cyan-400 border-cyan-500/30' },
  grief: { emoji: '😭', color: 'from-slate-600/20 to-slate-700/20 text-slate-400 border-slate-600/30' },
  joy: { emoji: '😄', color: 'from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30' },
  love: { emoji: '❤️', color: 'from-rose-600/20 to-rose-700/20 text-rose-500 border-rose-600/30' },
  nervousness: { emoji: '😬', color: 'from-violet-500/20 to-violet-600/20 text-violet-400 border-violet-500/30' },
  optimism: { emoji: '🌟', color: 'from-sky-500/20 to-sky-600/20 text-sky-400 border-sky-500/30' },
  pride: { emoji: '😌', color: 'from-purple-600/20 to-purple-700/20 text-purple-500 border-purple-600/30' },
  realization: { emoji: '💡', color: 'from-yellow-300/20 to-yellow-400/20 text-yellow-200 border-yellow-300/30' },
  relief: { emoji: '😮‍💨', color: 'from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30' },
  remorse: { emoji: '😔', color: 'from-zinc-500/20 to-zinc-600/20 text-zinc-400 border-zinc-500/30' },
  sadness: { emoji: '😢', color: 'from-blue-600/20 to-blue-700/20 text-blue-500 border-blue-600/30' },
  surprise: { emoji: '😲', color: 'from-amber-400/20 to-amber-500/20 text-amber-300 border-amber-400/30' },
  neutral: { emoji: '😐', color: 'from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30' },
  default: { emoji: '✨', color: 'from-[var(--color-brand-primary)]/20 to-[var(--color-brand-primary-dark)]/20 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30' }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
  show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { type: "spring", stiffness: 400, damping: 25 } }
};

const EmotionChips = ({ emotions, compact = false }) => {
  if (!emotions || emotions.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 italic text-sm border-2 border-dashed border-white/5 rounded-2xl ${compact ? 'py-4' : 'py-10'}`}>
        No strong emotions detected
      </div>
    );
  }

  const isSingle = emotions.length === 1;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className={`flex flex-wrap ${isSingle ? 'justify-center items-center h-full' : 'gap-2.5 p-1'}`}
    >
      {emotions.map((emotion, idx) => {
        const config = emotionConfig[emotion.toLowerCase()] || emotionConfig.default;
        return (
          <motion.div
            key={`${emotion}-${idx}`}
            variants={item}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 rounded-xl border bg-gradient-to-br backdrop-blur-md shadow-lg transition-shadow hover:shadow-xl ${config.color} ${isSingle ? 'px-8 py-4 scale-125' : 'px-3 py-1.5'}`}
          >
            <span className={isSingle ? 'text-3xl' : 'text-lg'}>{config.emoji}</span>
            <span className={`${isSingle ? 'text-xl' : 'text-xs'} font-bold capitalize tracking-tight`}>{emotion}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default EmotionChips;
