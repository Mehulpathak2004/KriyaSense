import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-space font-bold mb-6">Built by a Passionate Developer</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          KriyaSense was born out of a desire to push beyond basic positive/negative sentiment analysis and truly understand the emotional subtext of language.
        </p>
      </motion.div>

      <div className="space-y-20">

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-space font-bold mb-8 text-center">Development Timeline</h2>
          <div className="relative border-l border-white/10 ml-4 md:ml-0 md:border-none space-y-8 md:space-y-0">
            {/* Timeline items for Desktop */}
            <div className="hidden md:flex flex-col items-center relative">
              <div className="absolute top-0 bottom-0 w-px bg-white/10 left-1/2 -translate-x-1/2"></div>

              <div className="flex w-full items-center justify-between mb-8">
                <div className="w-5/12 text-right pr-8">
                  <h3 className="text-xl font-bold text-white mb-2">Ideation</h3>
                  <p className="text-gray-400 text-sm">Conceptualized a dual-model pipeline to handle both binary sentiment and complex emotions.</p>
                </div>
                <div className="w-2/12 flex justify-center z-10">
                  <div className="w-4 h-4 bg-[var(--color-brand-primary)] rounded-full shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                </div>
                <div className="w-5/12 pl-8"></div>
              </div>

              <div className="flex w-full items-center justify-between mb-8">
                <div className="w-5/12 pr-8"></div>
                <div className="w-2/12 flex justify-center z-10">
                  <div className="w-4 h-4 bg-[var(--color-brand-primary)] rounded-full shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                </div>
                <div className="w-5/12 text-left pl-8">
                  <h3 className="text-xl font-bold text-white mb-2">Dataset Research</h3>
                  <p className="text-gray-400 text-sm">Selected Google's GoEmotions for multi-label classification and curated a balanced dataset for the KriyaCore and KriyaEmo engines.</p>
                </div>
              </div>

              <div className="flex w-full items-center justify-between mb-8">
                <div className="w-5/12 text-right pr-8">
                  <h3 className="text-xl font-bold text-white mb-2">Model Training</h3>
                  <p className="text-gray-400 text-sm">Fine-tuned the transformers locally, implementing Temperature Scaling for robust calibration.</p>
                </div>
                <div className="w-2/12 flex justify-center z-10">
                  <div className="w-4 h-4 bg-[var(--color-brand-primary)] rounded-full shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                </div>
                <div className="w-5/12 pl-8"></div>
              </div>

              <div className="flex w-full items-center justify-between">
                <div className="w-5/12 pr-8"></div>
                <div className="w-2/12 flex justify-center z-10">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></div>
                </div>
                <div className="w-5/12 text-left pl-8">
                  <h3 className="text-xl font-bold text-white mb-2">Deployment</h3>
                  <p className="text-gray-400 text-sm">Built a responsive React + FastAPI interface and deployed the live beta.</p>
                </div>
              </div>
            </div>

            {/* Mobile timeline */}
            <div className="md:hidden space-y-8 pl-8">
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 bg-[var(--color-brand-primary)] rounded-full"></div>
                <h3 className="text-xl font-bold text-white mb-2">Ideation</h3>
                <p className="text-gray-400 text-sm">Conceptualized a dual-model pipeline to handle both binary sentiment and complex emotions.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 bg-[var(--color-brand-primary)] rounded-full"></div>
                <h3 className="text-xl font-bold text-white mb-2">Dataset Research</h3>
                <p className="text-gray-400 text-sm">Selected Google's GoEmotions for multi-label classification and curated a balanced dataset for the KriyaCore and KriyaEmo engines.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 bg-[var(--color-brand-primary)] rounded-full"></div>
                <h3 className="text-xl font-bold text-white mb-2">Model Training</h3>
                <p className="text-gray-400 text-sm">Fine-tuned the transformers locally, implementing Temperature Scaling for robust calibration.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold text-white mb-2">Deployment</h3>
                <p className="text-gray-400 text-sm">Built a responsive React + FastAPI interface and deployed the live beta.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-space font-bold mb-8 text-center">Why KriyaSense?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface-1)] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-2">Customer Feedback</h3>
              <p className="text-gray-400 text-sm">Go beyond "positive" reviews to understand if users are experiencing relief, excitement, or merely approval.</p>
            </div>
            <div className="bg-[var(--color-surface-1)] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-2">Mental Health Tools</h3>
              <p className="text-gray-400 text-sm">Analyze journal entries or chat logs to detect subtle shifts in mood, anxiety, or depressive language.</p>
            </div>
            <div className="bg-[var(--color-surface-1)] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-2">Social Media Analysis</h3>
              <p className="text-gray-400 text-sm">Track brand perception dynamically by observing the spectrum of emotional reactions to a product launch.</p>
            </div>
            <div className="bg-[var(--color-surface-1)] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-[var(--color-brand-primary)] mb-2">Academic Research</h3>
              <p className="text-gray-400 text-sm">Provide researchers with a robust, transparent tool for large-scale qualitative text analysis.</p>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-space font-bold mb-8 text-center">Tech Stack</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['React 18', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'FastAPI', 'Python 3', 'PyTorch', 'HuggingFace Transformers', 'MongoDB', 'Motor Async'].map(tech => (
              <div key={tech} className="px-4 py-2 bg-[var(--color-surface-2)] rounded-full border border-white/10 text-gray-300 font-medium">
                {tech}
              </div>
            ))}
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default About;
