import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Mic, AlertTriangle, Activity, Mail, CheckCircle2, ChevronDown, ChevronUp, Sparkles, MessageSquare, TrendingUp, Search, Heart, ShoppingBag, Building2 } from 'lucide-react';
import { analyzeText, analyzeAudio, submitContact, checkModelHealth } from '../api';
import SentimentGauges from '../components/SentimentGauges';
import EmotionChips from '../components/EmotionChips';
import HeroSentiment from '../components/HeroSentiment';
import ReportModal from '../components/ReportModal';

const CYCLING_WORDS = ['Positive', 'Joyful', 'Curious', 'Angry', 'Sad'];

const DEMO_CARDS = [
  { label: 'Happy', text: "I absolutely loved the new update! It makes everything so much faster and easier to use. Great job to the team!" },
  { label: 'Negative', text: "This is the worst customer service I have ever experienced. I've been waiting for a refund for 3 weeks." },
  { label: 'Neutral', text: "The package arrived yesterday. It contains the two items I ordered." },
  { label: 'Angry', text: "I am so angry right now! The app keeps crashing every time. I try to save my work. Fix this immediately!" }
];

const FAQS = [
  { q: "How accurate is the sentiment analysis?", a: "Our KriyaCore engine achieves approximately 74% accuracy on our benchmark dataset, providing reliable sentiment detection across diverse domains." },
  { q: "What models are used in KriyaSense?", a: "We use a dual-model pipeline consisting of KriyaCore for sentiment analysis and KriyaEmo for emotion detection, supplemented by our custom KriyaSense-V1 LLM." },
  { q: "Can it detect sarcasm?", a: "Yes! We intentionally included sarcastic and mixed-emotion samples in our training dataset of over 5 million rows to help the models understand human communication patterns." },
  { q: "How many emotions can it detect?", a: "Our KriyaEmo system can identify 28 distinct emotional states, mapping unstructured text into granular human feelings." }
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

const Landing = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedModel, setSelectedModel] = useState('kriyacore'); // 'kriyacore' or 'kriyasense'
  const [llmAvailable, setLlmAvailable] = useState(false);

  // Contact form state
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [isContactSuccess, setIsContactSuccess] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 2000);

    // Handle hash scroll
    if (window.location.hash === '#contact') {
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkModelHealth().then(h => setLlmAvailable(h.kriyasense)).catch(() => setLlmAvailable(false));
  }, []);

  const handleAnalyzeText = async () => {
    if (text.length < 3 || text.length > 512) {
      setError('Text must be between 3 and 512 characters.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const data = await analyzeText(text, sessionId, selectedModel);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'An error occurred during analysis. Please try again.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleAnalyzeText();
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await submitContact(formData);
      setIsContactSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

/* 
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        setIsAnalyzing(true);
        setError(null);
        try {
          const data = await analyzeAudio(file);
          if (data.error) {
            setError(data.error);
          } else {
            setText(data.text);
          }
        } catch (err) {
          setError('Failed to process audio.');
        } finally {
          setIsAnalyzing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
*/

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-gray-300">DeBERTa Live</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-gray-300">GoEmotions Live</span>
            </div>
          </div> */}

          <h1 className="text-5xl md:text-7xl font-space font-bold tracking-tight mb-6">
            Understand What <br className="hidden md:block" />
            Feels <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-emerald-400"
              >
                {CYCLING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            KriyaSense is designed for businesses that want to understand the emotions and sentiments of their customers in a smarter and more efficient way.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-10 italic">
            Automatically classify unstructured data based on sentiment and emotions, helping you perform smarter analytics, identify critical customer pain points faster, and make better business decisions using AI.
          </p>

          {/* Demo Strip */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {DEMO_CARDS.map((card, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setText(card.text)}
                className="px-4 py-2 rounded-full bg-[var(--color-surface-2)] border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {card.label} Example
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Try the Analyzer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Analyzer Section */}
      <section id="analyzer" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex-grow">
        <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              <button 
                onClick={() => { setSelectedModel('kriyacore'); setResult(null); setError(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedModel === 'kriyacore' ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-[var(--color-brand-primary)]/20' : 'text-gray-400 hover:text-gray-200'}`}
              >
                KriyaCore (Standard)
              </button>
              <button 
                onClick={() => { if (llmAvailable) { setSelectedModel('kriyasense'); setResult(null); setError(null); } }}
                disabled={!llmAvailable}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${selectedModel === 'kriyasense' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : !llmAvailable ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-gray-200'}`}
                title={!llmAvailable ? 'LLM service is currently offline' : ''}
              >
                <Sparkles className="w-3 h-3" /> KriyaSense-V1 (Pro)
                {!llmAvailable && <span className="text-[9px] ml-1 bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Offline</span>}
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-xl text-[var(--color-brand-primary)] text-[10px] font-bold uppercase tracking-wider">
              {selectedModel === 'kriyasense' ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  Advanced Contextual Intelligence
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3" />
                  Neural Sentiment Engine v2.1
                </>
              )}
            </div>
          </div>

          <div className="relative mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter text or record audio to analyze... (e.g. A tweet, a review, or a message)"
              className="w-full h-40 bg-[var(--color-surface-2)] border border-white/5 rounded-2xl p-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] resize-none custom-scrollbar"
            />

            <div className="absolute bottom-4 right-4 flex items-center gap-4">
              <span className={`text-xs font-medium ${text.length > 512 ? 'text-red-500' : 'text-gray-500'}`}>
                {text.length}/512
              </span>
              {/* 
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}
                title={isRecording ? "Stop Recording" : "Record Audio (Whisper AI)"}
              >
                <Mic className="w-5 h-5" />
              </button>
              */}
            </div>

            <div className="absolute bottom-4 left-4 text-xs font-medium text-gray-500 hidden sm:block">
              Ctrl + Enter to analyze
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

          <div className="flex justify-end mb-8">
            <button
              onClick={handleAnalyzeText}
              disabled={isAnalyzing || text.length === 0}
              className="px-8 py-3 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(var(--color-brand-primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-brand-primary-rgb),0.5)]"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze Text'}
            </button>
          </div>

          {/* Results Area */}
          <AnimatePresence>
            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 pt-8 mt-4"
              >
                {selectedModel === 'kriyasense' ? (
                  /* KriyaSense-V1 (Pro) Unified Result */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
                    <HeroSentiment sentiment={result.dominant_sentiment} />
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-8 border border-white/10 backdrop-blur-md flex flex-col relative overflow-hidden group">
                      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors"></div>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-space font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                          Emotion Profile
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">KriyaEmo AI</span>
                      </div>
                      <div className="flex-grow relative z-10 flex items-center justify-center">
                        <EmotionChips emotions={result.emotions} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* KriyaCore (Standard) Granular Result */
                  <div className={`grid grid-cols-1 ${result.emotions?.length === 1 ? 'md:grid-cols-2' : 'md:grid-cols-12'} gap-6`}>
                    <div className={`${result.emotions?.length === 1 ? '' : 'md:col-span-5'} bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-6 border border-white/10 backdrop-blur-md relative overflow-hidden group`}>
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-brand-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-brand-primary)]/20 transition-colors"></div>
                      <h3 className="text-lg font-space font-bold mb-6 text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                        Sentiment Analysis
                      </h3>
                      <div className="relative z-10">
                        <SentimentGauges sentiment={result.sentiment} dominant={result.dominant_sentiment} />
                      </div>
                    </div>

                    <div className={`${result.emotions?.length === 1 ? '' : 'md:col-span-7'} bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-6 border border-white/10 backdrop-blur-md flex flex-col relative overflow-hidden group`}>
                      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors"></div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-space font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                          Emotional Profile
                        </h3>
                        {result.emotions?.length > 0 && (
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            {result.emotions.length} {result.emotions.length === 1 ? 'Emotion' : 'Emotions'}
                          </span>
                        )}
                      </div>
                      <div className="flex-grow relative z-10">
                        <EmotionChips emotions={result.emotions} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="group text-xs text-gray-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3 h-3 group-hover:text-amber-500 transition-colors" />
                    <span>Report incorrect classification</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-space font-bold mb-6 text-white">The Unstructured Data Problem</h2>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              Today, companies receive thousands of reviews, feedback messages, tweets, support chats, and survey responses every day. But understanding what customers are actually feeling from all this unstructured data becomes a very difficult task.
            </p>
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24 text-red-500" /></div>
              <h3 className="text-xl font-bold text-red-200 mb-3">Example: E-Commerce Struggle</h3>
              <p className="text-red-300/80">
                Imagine an e-commerce company receiving <strong>one lakh (100,000) customer reviews</strong> every month. If they want to identify negative feedback related to delivery delays, bad customer support, or product quality, their team may need to manually go through thousands of responses. This process is time-consuming, expensive, and inefficient.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand-primary)] to-emerald-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="bg-[var(--color-surface-2)] border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl">
              <h3 className="text-2xl font-space font-bold mb-4 text-emerald-400">KriyaSense Solves This</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Using AI-powered sentiment and emotion analysis, we automate the understanding of human communication at scale.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-full text-emerald-400"><Activity className="w-4 h-4" /></div>
                  <div>
                    <strong className="text-white block">KriyaCore & KriyaSense-V1 Powered</strong>
                    <span className="text-gray-400 text-sm">Fine-tuned models on millions of data points for nuanced contextual understanding and sarcasm detection.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-full text-emerald-400"><Activity className="w-4 h-4" /></div>
                  <div>
                    <strong className="text-white block">Actionable Analytics</strong>
                    <span className="text-gray-400 text-sm">Automatically classify data to identify critical customer pain points faster.</span>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center bg-gradient-to-b from-transparent to-white/5 border-b border-white/10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-space font-bold mb-6">Our Vision</h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
            The goal of KriyaSense is not just sentiment classification. Our vision is to build AI systems that can better understand human emotions, reactions, and communication behavior. And this is our first major step toward that journey.
          </p>
          <div className="inline-block px-6 py-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-medium">
            Next Generation Emotion AI
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-space font-bold mb-6"
            >
              Core Capabilities
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Harnessing the power of KriyaCore and custom-tuned LLMs for unparalleled emotional intelligence.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div 
              whileHover={{ y: -10 }} 
              transition={{ type: "spring", stiffness: 300 }}
              className="group h-full bg-[var(--color-surface-2)] p-10 rounded-[2.5rem] border border-white/10 hover:border-[var(--color-brand-primary)]/50 transition-all shadow-2xl flex flex-col relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 text-emerald-400 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Granular Emotion Detection</h3>
              <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                Identify 28 distinct emotional states with high accuracy using our fine-tuned <strong>KriyaEmo</strong> detection system, providing insights far beyond simple positive or negative labels.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }} 
              transition={{ type: "spring", stiffness: 300 }}
              className="group h-full bg-[var(--color-surface-2)] p-10 rounded-[2.5rem] border border-white/10 hover:border-blue-500/50 transition-all shadow-2xl flex flex-col relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 text-blue-400 group-hover:scale-110 transition-transform">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Multimodal Analysis</h3>
              <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                Seamlessly transcribe and analyze spoken words using integrated audio processing, capturing the true sentiment behind voice notes, calls, and spoken feedback.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }} 
              transition={{ type: "spring", stiffness: 300 }}
              className="group h-full bg-[var(--color-surface-2)] p-10 rounded-[2.5rem] border border-white/10 hover:border-amber-500/50 transition-all shadow-2xl flex flex-col relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 text-amber-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Enterprise Scalability</h3>
              <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                Designed for high concurrency. Our robust API supports massive data pipelines, enabling large-scale social media analysis and real-time enterprise integration.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-space font-bold mb-4">Use Cases</h2>
          <p className="text-gray-400">How KriyaSense transforms industries.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              title: "Customer Support", 
              desc: "Instantly detect user anger, frustration, or disappointment in live chats and tickets. Automatically escalate high-priority issues to senior agents and suggest empathetic responses based on the customer's exact emotional state to decrease churn and improve resolution time.",
              icon: MessageSquare,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
            },
            { 
              title: "Brand Monitoring", 
              desc: "Track how your audience feels about a new product launch, marketing campaign, or press release across social media channels in real-time. Spot shifting sentiment trends early to handle PR situations proactively and refine marketing copy on the fly.",
              icon: TrendingUp,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            },
            { 
              title: "Market Research", 
              desc: "Process thousands of open-ended survey responses, focus group feedback, and competitor reviews. Extract deep qualitative themes and emotional patterns without manual reading, turning unstructured text into structured, actionable product feature requests.",
              icon: Search,
              color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
            },
            { 
              title: "Mental Health", 
              desc: "Detect nuanced signs of anxiety, distress, sadness, or fatigue in digital journal entries, messaging transcripts, or support channels. Empower healthcare providers and wellness apps to trigger timely intervention, support resources, or alerts.",
              icon: Heart,
              color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
            },
            { 
              title: "Retail & E-Commerce", 
              desc: "Analyze product reviews, return comments, and buying feedback. Instantly understand which items cause frustration (e.g., sizing issues, material defects) or high satisfaction. Tailor recommendation engines and retention offers dynamically to convert unhappy shoppers into loyal customers.",
              icon: ShoppingBag,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
            },
            { 
              title: "SM Businesses (SMBs)", 
              desc: "Empower small and medium businesses to compete with enterprise giants. Monitor local reviews (like Google Maps, Yelp) and customer emails automatically. Send daily summaries of customer satisfaction, identify repeat issues, and suggest quick recovery actions to build community trust.",
              icon: Building2,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            }
          ].map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div 
                key={i} 
                whileHover={{ y: -6, scale: 1.02 }} 
                className="bg-gradient-to-br from-[var(--color-surface-1)] to-white/[0.02] p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-6 ${uc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-4 font-space">{uc.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{uc.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-space font-bold mb-6 text-white">Let's Connect</h2>
            <p className="text-xl text-gray-400 mb-10">
              Have questions about our models, API access, or just want to say hi? Reach out to the KriyaSense team.
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="p-3 bg-[var(--color-surface-2)] rounded-full border border-white/10">
                  <Mail className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">General & Support</p>
                  <p className="text-white font-medium">anurag.pareek@trailblazex.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-300">
                <div className="p-3 bg-[var(--color-surface-2)] rounded-full border border-white/10">
                  <Mail className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Marketing</p>
                  <p className="text-white font-medium">marketing@trailblazex.com</p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-space font-bold mb-6 text-white">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {FAQS.map((faq, idx) => (
                  <FAQItem key={idx} faq={faq} />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="bg-[var(--color-surface-1)] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!isContactSuccess ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onSubmit={handleSubmitContact}
                    className="space-y-4 w-full"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                      <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-all">
                        <option>General Inquiry</option>
                        <option>API Access</option>
                        <option>Bug Report</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                      <textarea required value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none h-32 resize-none transition-all" />
                    </div>
                    <button disabled={isSubmittingContact} type="submit" className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold hover:bg-[var(--color-brand-primary-dark)] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-[var(--color-brand-primary)]/20">
                      {isSubmittingContact ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Message'}
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
                    <button onClick={() => { setIsContactSuccess(false); setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' }); }} className="mt-8 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
                      Send another message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        predictionId={result?._id}
      />
    </div>
  );
};

export default Landing;
