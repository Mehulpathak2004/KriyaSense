import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Database, Cpu, Sparkles, Zap, CheckCircle2, Activity, Shield, Globe, Layers, MessageSquare, Brain, Search } from 'lucide-react';

const sentimentDistribution = [
  { name: 'Positive Insights', count: 350896, fill: 'var(--color-brand-primary)' },
  { name: 'Neutral Balance', count: 360541, fill: '#9ca3af' },
  { name: 'Nuanced Signals', count: 351197, fill: '#6366f1' },
];

const modelCapacities = [
  { name: 'KriyaCore', value: 92 },
  { name: 'KriyaEmo', value: 88 },
  { name: 'KriyaSense', value: 95 },
];

const COLORS = ['#10b981', '#6366f1', '#f59e0b'];

const Research = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 py-20">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-24 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 mb-6">
            <Shield className="w-4 h-4 text-[var(--color-brand-primary)]" />
            <span className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-widest">Enterprise Research Lab</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-space font-bold mb-6 text-white tracking-tight">
            The Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-emerald-400">Architecture</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Deep diving into the triple-model ecosystem that powers KriyaSense. Our research focuses on mapping the complex intersection of human language and emotional intent.
          </p>
        </motion.div>

        <div className="space-y-32">
          
          {/* Model 1: KriyaCore */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Cpu className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-space font-bold text-white">1. KriyaCore</h2>
              </div>
              <h3 className="text-xl text-emerald-400 font-bold mb-4 uppercase tracking-wider">The Sentiment Foundation</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                KriyaCore is our high-performance sentiment engine. Built for speed and precision, it specializes in real-time classification of short-form text data, such as customer reviews, social media mentions, and internal feedback loops.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Contextual Word Embeddings",
                  "Sarcasm Logic v2",
                  "Sentiment Polarity Mapping",
                  "Low-Latency Inference"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="bg-[var(--color-surface-1)] border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-8 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Balanced Sentiment Training Data
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentDistribution}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111918', border: 'none', borderRadius: '16px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" radius={[20, 20, 20, 20]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Positive</span>
                <span>Neutral</span>
                <span>Negative</span>
              </div>
            </motion.div>
          </section>

          {/* Model 2: KriyaEmo */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="order-2 lg:order-1 bg-gradient-to-br from-[var(--color-surface-2)] to-transparent border border-white/10 rounded-[3rem] p-8"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <MessageSquare />, label: "Joyful", color: "text-emerald-400" },
                  { icon: <Zap />, label: "Anger", color: "text-red-400" },
                  { icon: <Shield />, label: "Trust", color: "text-blue-400" },
                  { icon: <Activity />, label: "Surprise", color: "text-purple-400" },
                  { icon: <Brain />, label: "Anxiety", color: "text-amber-400" },
                  { icon: <Layers />, label: "Grief", color: "text-gray-400" },
                ].map((emo, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
                    <div className={`${emo.color} opacity-50`}>{emo.icon}</div>
                    <span className="text-white font-bold">{emo.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                  <Layers className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl font-space font-bold text-white">2. KriyaEmo</h2>
              </div>
              <h3 className="text-xl text-purple-400 font-bold mb-4 uppercase tracking-wider">Deep Emotional Discovery</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                KriyaEmo goes beyond binary sentiment. It is a multi-label classification system capable of identifying 28 distinct human emotional states. This provides businesses with granular insights into the specific feelings of their audience.
              </p>
              <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                   <Globe className="w-4 h-4 text-purple-400" /> Multi-Signal Mapping
                </h4>
                <p className="text-sm text-gray-500">
                  KriyaEmo synthesizes linguistic signals into a comprehensive emotional profile, allowing for the detection of mixed emotions (e.g., being both "curious" and "anxious" at the same time).
                </p>
              </div>
            </motion.div>
          </section>

          {/* Model 3: KriyaSense-V1 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-3xl font-space font-bold text-white">3. KriyaSense-V1</h2>
              </div>
              <h3 className="text-xl text-amber-400 font-bold mb-4 uppercase tracking-wider">Cognitive Reasoning LLM</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Our flagship model, KriyaSense-V1, is a Large Language Model (LLM) fine-tuned for complex semantic reasoning. It excels at multilingual context, Hinglish/Hindi understanding, and identifying nuanced sarcasm that traditional models might miss.
              </p>
              <div className="space-y-4">
                {[
                  { t: "Multilingual Intelligence", d: "Fluent in English, Hindi, and colloquial Hinglish." },
                  { t: "Semantic Reasoning", d: "Understands the 'Why' behind a sentiment, not just the 'What'." },
                  { t: "PEFT/LoRA Optimized", d: "Advanced fine-tuning for maximum enterprise efficiency." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl">
                    <div className="p-2 bg-amber-500/10 rounded-lg"><Brain className="w-5 h-5 text-amber-400" /></div>
                    <div>
                      <h4 className="text-white font-bold">{item.t}</h4>
                      <p className="text-xs text-gray-500">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              className="bg-[var(--color-surface-1)] border border-white/10 rounded-[3rem] p-12 flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelCapacities}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {modelCapacities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-space font-bold text-white">V1</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Architecture</span>
              </div>
            </motion.div>
          </section>

          {/* Integration Section */}
          <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-blue-500/10 rounded-[3rem] p-12 border border-white/10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Globe className="w-12 h-12 text-white mx-auto mb-6 opacity-50" />
              <h2 className="text-4xl font-space font-bold mb-6 text-white">Unified Intelligence</h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10">
                KriyaSense combines these three models into a single API endpoint, providing a comprehensive understanding of human communication that is faster, deeper, and more accurate than single-model systems.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {["REST API", "Streaming SDK", "Webhooks", "Custom Training"].map((tag, i) => (
                  <span key={i} className="px-6 py-2 rounded-full bg-white/5 border border-white/5 text-gray-300 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Research;
