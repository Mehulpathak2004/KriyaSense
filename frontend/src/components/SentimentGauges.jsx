import React from 'react';
import { motion } from 'framer-motion';

const Gauge = ({ label, value, gradientId, colors, isDominant }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 relative group">
      <div className={`relative w-24 h-24 flex items-center justify-center rounded-full transition-all duration-500 ${isDominant ? 'bg-white/[0.05] shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-110' : 'group-hover:bg-white/[0.02]'}`}>
        <svg className="-rotate-90 w-20 h-20 transform" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <circle
            className="text-white/5 stroke-current"
            strokeWidth="6"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          />
          <motion.circle
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            style={{ filter: isDominant ? `drop-shadow(0 0 3px ${colors[0]})` : 'none' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span 
            className={`text-sm font-bold font-space transition-colors ${isDominant ? 'text-white' : 'text-gray-400'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <span className={`mt-4 text-[10px] font-bold uppercase tracking-tighter transition-all ${isDominant ? 'text-white translate-y-1' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
};

const SentimentGauges = ({ sentiment, dominant }) => {
  return (
    <div className="flex items-center justify-around w-full py-2">
      <Gauge 
        label="Positive" 
        value={sentiment.positive} 
        gradientId="grad-pos"
        colors={['#10b981', '#34d399']}
        isDominant={dominant === 'positive'} 
      />
      <Gauge 
        label="Neutral" 
        value={sentiment.neutral} 
        gradientId="grad-neu"
        colors={['#9ca3af', '#d1d5db']}
        isDominant={dominant === 'neutral'} 
      />
      <Gauge 
        label="Negative" 
        value={sentiment.negative} 
        gradientId="grad-neg"
        colors={['#ef4444', '#f87171']}
        isDominant={dominant === 'negative'} 
      />
    </div>
  );
};

export default SentimentGauges;
