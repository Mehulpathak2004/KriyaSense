import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { reportPrediction } from '../api';

const EMOTIONS_LIST = [
  "admiration", "amusement", "anger", "annoyance", "approval", "caring", 
  "confusion", "curiosity", "desire", "disappointment", "disapproval", 
  "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief", 
  "joy", "love", "nervousness", "optimism", "pride", "realization", 
  "relief", "remorse", "sadness", "surprise", "neutral"
];

const ReportModal = ({ isOpen, onClose, predictionId }) => {
  const [step, setStep] = useState(1);
  const [wrongField, setWrongField] = useState(null);
  const [suggestedSentiment, setSuggestedSentiment] = useState('');
  const [suggestedEmotions, setSuggestedEmotions] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmotionToggle = (emotion) => {
    if (suggestedEmotions.includes(emotion)) {
      setSuggestedEmotions(suggestedEmotions.filter(e => e !== emotion));
    } else {
      setSuggestedEmotions([...suggestedEmotions, emotion]);
    }
  };

  const handleSubmit = async () => {
    if (!wrongField) return;
    
    setIsSubmitting(true);
    try {
      await reportPrediction({
        prediction_id: predictionId,
        wrong_field: wrongField,
        suggested_sentiment: suggestedSentiment || null,
        suggested_emotions: suggestedEmotions.length > 0 ? suggestedEmotions : null,
        comment: comment || null
      });
      setStep(3); // Success step
    } catch (err) {
      console.error(err);
      // Fallback to error handling in real app
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setTimeout(() => {
      setStep(1);
      setWrongField(null);
      setSuggestedSentiment('');
      setSuggestedEmotions([]);
      setComment('');
    }, 500);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[var(--color-surface-1)] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h3 className="text-xl font-space font-bold text-white">Report Incorrect Result</h3>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">What was wrong with the prediction?</label>
                  <div className="space-y-2">
                    {['sentiment', 'emotion', 'both'].map((field) => (
                      <label key={field} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${wrongField === field ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                        <input 
                          type="radio" 
                          name="wrongField" 
                          value={field} 
                          checked={wrongField === field} 
                          onChange={(e) => setWrongField(e.target.value)}
                          className="sr-only"
                        />
                        <span className="capitalize text-white font-medium">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => setStep(2)}
                  disabled={!wrongField}
                  className="w-full py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-brand-primary-dark)] transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {(wrongField === 'sentiment' || wrongField === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Suggest correct sentiment</label>
                    <select 
                      value={suggestedSentiment}
                      onChange={(e) => setSuggestedSentiment(e.target.value)}
                      className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none"
                    >
                      <option value="">Select a sentiment...</option>
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                )}

                {(wrongField === 'emotion' || wrongField === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Suggest correct emotions (select multiple)</label>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-white/10 rounded-xl bg-[var(--color-surface-2)] custom-scrollbar">
                      {EMOTIONS_LIST.map((emo) => (
                        <button
                          key={emo}
                          onClick={() => handleEmotionToggle(emo)}
                          className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${suggestedEmotions.includes(emo) ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional context (optional)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none resize-none h-24"
                    placeholder="Why was the model wrong?"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold disabled:opacity-50 hover:bg-[var(--color-brand-primary-dark)] transition-colors flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="py-10 flex flex-col items-center text-center space-y-4"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </motion.div>
                <h4 className="text-2xl font-space font-bold text-white">Thank You!</h4>
                <p className="text-gray-400 max-w-sm">
                  Your feedback has been saved and will help us improve KriyaSense in future updates.
                </p>
                <button 
                  onClick={resetAndClose}
                  className="mt-6 px-8 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportModal;
