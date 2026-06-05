import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { submitContact } from '../api';

const faqs = [
  { q: "How accurate is the sentiment analysis?", a: "Our KriyaCore engine achieves an 87.4% accuracy on our benchmark dataset, providing highly reliable sentiment detection." },
  { q: "What does temperature scaling do?", a: "It smooths the probability distribution of the model's output, preventing overconfidence and providing more realistic percentage breakdowns of sentiment." },
  { q: "Is there a limit on API requests?", a: "Currently, our beta API allows 30 requests per minute per IP address." },
  { q: "Can I use KriyaSense for commercial projects?", a: "Currently, it is in beta. Please contact us for commercial licensing or higher rate limits." },
  { q: "How are the 28 emotions determined?", a: "The model is fine-tuned on the GoEmotions dataset created by Google, which categorizes Reddit comments into 28 distinct emotion labels plus neutral." }
];

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl bg-[var(--color-surface-2)] overflow-hidden">
      <button 
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-white">{faq.q}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-4 text-gray-400"
          >
            {faq.a}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitContact(formData);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        
        {/* Left Side: Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl md:text-5xl font-space font-bold mb-6">Let's Connect</h1>
          <p className="text-xl text-gray-400 mb-10">
            Have questions about the models, API access, or just want to say hi? Reach out to us.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 text-gray-300">
              <div className="p-3 bg-[var(--color-surface-2)] rounded-full border border-white/10">
                <Mail className="w-6 h-6 text-[var(--color-brand-primary)]" />
              </div>
              <span>anurag.pareek@trailblazex.com</span>
            </div>
          </div>

          <div className="flex gap-4">
            {/* <a href="#" className="p-3 bg-[var(--color-surface-2)] rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white">
              <SiGithub className="w-6 h-6" />
            </a> */}
            {/* <a href="#" className="p-3 bg-[var(--color-surface-2)] rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white">
              <Linkedin className="w-6 h-6" />
            </a> */}
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-[var(--color-surface-1)] p-8 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden min-h-[500px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 w-full"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                    <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none">
                      <option>General Inquiry</option>
                      <option>API Access</option>
                      <option>Bug Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                    <textarea required value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none h-32 resize-none" />
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold hover:bg-[var(--color-brand-primary-dark)] transition-colors disabled:opacity-50 mt-4">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center absolute inset-0 flex flex-col items-center justify-center p-8 bg-[var(--color-surface-1)]"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-3xl font-space font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400">We've received your message and will get back to you shortly.</p>
                  <button onClick={() => { setIsSuccess(false); setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' }); }} className="mt-8 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
                    Send another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* FAQs */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-3xl font-space font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} />
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default Contact;
