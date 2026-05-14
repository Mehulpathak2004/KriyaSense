import React from 'react';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-space font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
            <p>
              When you use KriyaSense, we collect the text you input into the analyzer. This text is processed by our machine learning models and stored in our database alongside the generated predictions. We also collect standard usage data like IP addresses (for rate limiting purposes) and timestamps.
            </p>
          </section>

          <section>
            <div className="bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/30 rounded-xl p-6 text-emerald-100">
              <strong className="text-white block mb-2">Important Notice on Data Deletion</strong>
              We process text from the landing page completely anonymously. Because we cannot verify ownership of anonymous requests, data processed via the public landing page <strong>cannot be deleted</strong>. If you require the ability to delete your data, please create an account and use the Developer API.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Data</h2>
            <p>The collected data is used strictly for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Providing the sentiment and emotion analysis service.</li>
              <li>Evaluating and retraining our models to improve accuracy over time.</li>
              <li>Preventing abuse of the API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage</h2>
            <p>
              Data is stored securely in our MongoDB database. We do not sell or share your raw text data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Report & Feedback Data</h2>
            <p>
              If you submit a report regarding an incorrect prediction, your suggested sentiment, emotions, and any comments are linked to the original text. This feedback loop is vital for our model development.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. User Rights</h2>
            <p>
              <strong>Logged-in users:</strong> If you use our Developer API or make requests while logged in, your predictions are tied to your account. You can request deletion of your account and all associated data via the Contact page.
            </p>
            <p className="mt-2">
              <strong>Anonymous users:</strong> Data submitted without an account is pooled for model training and cannot be deleted upon request, as ownership cannot be verified.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
