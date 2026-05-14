import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { Database, Filter, Cpu, Sparkles, Zap, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';

const sentimentData = [
  { name: 'Positive', count: 350896, fill: '#10b981' },
  { name: 'Neutral', count: 360541, fill: '#9ca3af' },
  { name: 'Negative', count: 351197, fill: '#ef4444' },
];

const dataPipeline = [
  { step: 'Raw Internet Data', rows: 5500000 },
  { step: 'Cleaned & Deduped', rows: 3200000 },
  { step: 'Final Processed Data', rows: 1062634 },
];

const Research = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-space font-bold mb-6">The Science Behind KriyaSense</h1>
        <p className="text-xl text-gray-400">Deep diving into our dual-model architecture.</p>
      </motion.div>

      <div className="space-y-24">
        {/* Section 1: Sentiment Model */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-space font-bold mb-8 text-[var(--color-brand-primary)] flex items-center gap-3">
            <Cpu className="w-8 h-8" />
            1. KriyaCore Sentiment Engine
          </h2>
          
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-blue-400"/> Dataset Construction & Pipeline</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              For building these models, we extracted around <strong>5 to 6 million rows of raw internet data</strong>. This was followed by heavy preprocessing, deduplication, cleaning, balancing, and training pipelines. Our final processed training corpus contains roughly 1 million rows.
            </p>
            
            <div className="h-64 w-full mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPipeline} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="step" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111918', borderColor: '#ffffff1a' }} formatter={(value) => new Intl.NumberFormat('en').format(value) + " rows"} />
                  <Area type="monotone" dataKey="rows" stroke="#10b981" fillOpacity={1} fill="url(#colorRows)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-gray-500 mt-2">Data Processing Pipeline (Raw to Processed)</p>
            </div>

            <p className="text-gray-400 mb-4 leading-relaxed">
              One of the most important challenges in sentiment analysis is sarcasm detection. So we intentionally included sarcastic and mixed-emotion samples in our dataset to help our models better understand human communication patterns.
            </p>
            <div className="h-64 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#111918', borderColor: '#ffffff1a' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h3 className="text-xl font-bold mt-8 mb-4">Training Hyperparameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-white/5">
                <p className="text-sm text-gray-500">Epochs</p>
                <p className="text-lg font-bold text-white">3</p>
              </div>
              <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-white/5">
                <p className="text-sm text-gray-500">Batch Size</p>
                <p className="text-lg font-bold text-white">16</p>
              </div>
              <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-white/5">
                <p className="text-sm text-gray-500">Token Length</p>
                <p className="text-lg font-bold text-white">256</p>
              </div>
              <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-white/5">
                <p className="text-sm text-gray-500">Learning Rate</p>
                <p className="text-sm font-bold text-white mt-1">5e-5 (ep 1-2)<br/>1e-5 (ep 3)</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mt-8 mb-4">Test Results</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-2">Metric</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 text-white font-medium">Accuracy</td>
                    <td className="py-2 text-emerald-400">73.90%</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 text-white font-medium">Macro F1</td>
                    <td className="py-2 text-emerald-400">73.96%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-white font-medium">Weighted F1</td>
                    <td className="py-2 text-emerald-400">73.93%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-500 italic border-l-2 border-amber-500/50 pl-4">
              <strong>Model Nuances:</strong> The model is completely unbiased towards gender or religion. However, because it was trained on organic internet data, heavily sarcastic texts may occasionally cause hallucinations. We are actively working to improve this in v2.
            </p>
          </div>
        </motion.section>

        {/* Section 2: Emotion Model */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-space font-bold mb-8 text-[var(--color-brand-primary)] flex items-center gap-3">
            <Filter className="w-8 h-8" />
            2. KriyaEmo Detection System
          </h2>
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Model Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">Base Model</span>
                    <span className="text-white text-sm font-medium">roberta-base (125M)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">Task</span>
                    <span className="text-white text-sm font-medium">Multi-label Classification</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">Precision</span>
                    <span className="text-white text-sm font-medium">FP16</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-sm">Loss Function</span>
                    <span className="text-white text-sm font-medium">BCEWithLogitsLoss</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Training Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase">Learning Rate</p>
                    <p className="text-sm font-bold">2e-5</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase">Epochs</p>
                    <p className="text-sm font-bold">3</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase">Batch Size</p>
                    <p className="text-sm font-bold">32</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase">Seq Length</p>
                    <p className="text-sm font-bold">128 tokens</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold mb-4 text-emerald-400">Final Test Set Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Micro F1</p>
                  <p className="text-2xl font-space font-bold text-white">0.5171</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Macro F1</p>
                  <p className="text-2xl font-space font-bold text-white">0.2528</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">ROC-AUC</p>
                  <p className="text-2xl font-space font-bold text-white">0.8810</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Eval Loss</p>
                  <p className="text-2xl font-space font-bold text-white">0.0930</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h4 className="text-white font-bold mb-2">Performance Notes</h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>Micro F1 (0.52):</strong> Reflects solid performance on frequent emotions like gratitude, admiration, and joy.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Macro F1 (0.25):</strong> Suppressed by rare, hard classes like grief, relief, and pride due to class imbalance in the dataset.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span><strong>ROC-AUC (0.88):</strong> Strong discriminative ability — correctly ranks true labels above false ones 88% of the time.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Limitations
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-gray-500 text-xs">
                  <li>• Rare emotions have low per-label F1.</li>
                  <li>• Trained on Reddit comments only.</li>
                  <li>• Single language support (English).</li>
                  <li>• Performance depends on threshold (0.5).</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

      {/* Section 3: Large Language Model */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="flex items-center gap-4 mb-8 mt-24">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-space font-bold text-white">KriyaSense-V1 (Large Language Model)</h2>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[var(--color-surface-1)] to-transparent border border-white/10 rounded-3xl p-8 shadow-2xl">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              <strong>KriyaSense-V1</strong> is our premier multilingual sentiment analysis large language model. Built on a state-of-the-art foundation and fine-tuned using Parameter-Efficient Fine-Tuning (PEFT) on a heavily processed custom sentiment corpus, it represents the peak of our contextual understanding capabilities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Key Features
                </h3>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Multilingual sentiment understanding</li>
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Hindi + Hinglish support</li>
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Sarcasm-aware sentiment detection</li>
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Mixed sentiment understanding</li>
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Instruction-following conversational inference</li>
                  <li className="flex items-start gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Lightweight LoRA deployment architecture</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Architecture
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Neural Foundation</p>
                    <p className="text-white font-medium">Kriya-LLM-Base</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fine-Tuning Method</p>
                    <p className="text-white font-medium">Custom PEFT + LoRA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deployment</p>
                    <p className="text-white font-medium">Optimized Neural Compute</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-400" /> Training Pipeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  The model was trained using QLoRA fine-tuning with 4-bit quantization and PEFT (Parameter Efficient Fine Tuning) within the HuggingFace ecosystem.
                </p>
                <div className="space-y-2">
                  {[
                    "5-6M raw text samples collected",
                    "Heavy preprocessing & deduplication",
                    "Balanced sentiment datasets",
                    "Sarcasm & mixed-emotion samples"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Dataset Components</p>
                <div className="flex flex-wrap gap-2">
                  {["Product reviews", "Social media", "Customer feedback", "Mixed-language", "Conversational"].map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">Supported Sentiments</h3>
              <p className="text-gray-400 text-sm mb-6">The model predicts Positive, Negative, and Neutral labels with high contextual awareness.</p>
              <div className="bg-black/40 rounded-xl p-4 font-mono text-sm border border-white/10">
                <p className="text-gray-500 mb-2">// Example Output</p>
                <p className="text-white">"The sentiment of this text is positive."</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-amber-400 mb-4">Example Use Cases</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-400">
                <p>• Brand monitoring</p>
                <p>• Review intelligence</p>
                <p>• Social media tracking</p>
                <p>• Business analytics</p>
                <p>• Customer support</p>
                <p>• AI monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      </div>
    </div>
  );
};

export default Research;
