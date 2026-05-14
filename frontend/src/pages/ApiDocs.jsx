import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2 } from 'lucide-react';

const EndpointCard = ({ method, path, description, requestBody, response, authRequired = false }) => {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl overflow-hidden mb-8">
      <div className="p-4 border-b border-white/10 bg-[var(--color-surface-2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded text-sm font-bold w-fit ${method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {method}
          </div>
          <div className="font-mono text-lg text-white">{path}</div>
        </div>
        {authRequired && (
          <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
            Requires API Key
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="text-gray-400 mb-6">{description}</p>

        {authRequired && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Headers</h4>
            <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300">
              Authorization: Bearer sk_your_api_key_here
            </div>
          </div>
        )}

        {requestBody && (
          <div className="mb-6 relative group">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body</h4>
            <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300 overflow-x-auto relative">
              <pre>{requestBody}</pre>
              <button
                onClick={() => copyToClipboard(requestBody, 'req')}
                className="absolute top-2 right-2 p-2 bg-white/10 rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                {copied === 'req' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
        )}

        <div className="relative group">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Example Response</h4>
          <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300 overflow-x-auto relative">
            <pre>{response}</pre>
            <button
              onClick={() => copyToClipboard(response, 'res')}
              className="absolute top-2 right-2 p-2 bg-white/10 rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
            >
              {copied === 'res' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApiDocs = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-space font-bold mb-4">API Documentation</h1>
        <p className="text-gray-400">
          Integrate KriyaSense's dual-model sentiment and emotion analysis directly into your applications using our REST API. Base URL: <code className="bg-white/10 px-2 py-1 rounded text-white">http://localhost:8000</code>
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>

        <EndpointCard
          method="POST"
          path="/api/v1/analyze"
          authRequired={true}
          description="Developer API for high-scale sentiment analysis. This endpoint uses Server-Sent Events (SSE) to stream progress and final results, modeled after OpenAI's streaming APIs. Max text length is 2000 characters. Reconnect handling is native to SSE clients. Available models: 'kriyacore' (Sentiment/Emotion) and 'kriyasense' (LLM-based)."
          requestBody={`{
  "text": "I absolutely love the new design, but the load times are annoying.",
  "session_id": "optional-uuid-here",
  "model": "kriyacore"
}`}
          response={`data: {"status": "queued", "task_id": "c4d2e..."}

data: {"status": "processing", "chunk_index": 1, "total_chunks": 1, "sentiment_delta": {"positive": 95, "negative": 2, "neutral": 3}}

data: {"status": "completed", "result": {"text": "...", "sentiment": {...}, "emotions": [...]}}`}
        />

      </motion.div>
    </div>
  );
};

export default ApiDocs;
