import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fetchStats } from '../api';
import { Users, AlertTriangle, Target } from 'lucide-react';

const CountUp = ({ to, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = to;
      const totalMilSecDur = duration * 1000;
      const incrementTime = 30; // ms
      const steps = totalMilSecDur / incrementTime;
      const increment = end / steps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(Math.floor(start));
        }
      }, incrementTime);
      
      return () => clearInterval(timer);
    }
  }, [to, isInView, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const StatsBar = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="h-24"></div>;

  const totalAnalyses = stats?.total_predictions || 0;
  const totalReports = stats?.total_reports || 0;
  const accuracy = 87.4; // Hardcoded for beta as per spec

  return (
    <div className="w-full bg-black/40 border-y border-white/5 py-12 mt-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="p-3 bg-[var(--color-brand-primary)]/20 rounded-xl mb-4">
              <Users className="w-8 h-8 text-[var(--color-brand-primary)]" />
            </div>
            <div className="text-4xl font-bold font-space text-white mb-2">
              <CountUp to={totalAnalyses} />
            </div>
            <div className="text-gray-400 font-medium tracking-wide uppercase text-sm">Total Analyses</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="p-3 bg-rose-500/20 rounded-xl mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-4xl font-bold font-space text-white mb-2">
              <CountUp to={totalReports} />
            </div>
            <div className="text-gray-400 font-medium tracking-wide uppercase text-sm">User Reports</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="p-3 bg-emerald-500/20 rounded-xl mb-4">
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-4xl font-bold font-space text-white mb-2">
              <CountUp to={accuracy} suffix="%" />
            </div>
            <div className="text-gray-400 font-medium tracking-wide uppercase text-sm">Model Accuracy</div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default StatsBar;
