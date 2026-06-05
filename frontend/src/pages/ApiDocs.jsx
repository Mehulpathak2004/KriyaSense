import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, ChevronDown, ChevronUp, Zap, Shield, Clock, Code2, Terminal, FileCode2, Hash } from 'lucide-react';
import { checkModelHealth } from '../api';

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: <FileCode2 className="w-4 h-4" /> },
  { id: 'javascript', label: 'JavaScript', icon: <Code2 className="w-4 h-4" /> },
  { id: 'typescript', label: 'TypeScript', icon: <Hash className="w-4 h-4" /> },
  { id: 'curl', label: 'cURL', icon: <Terminal className="w-4 h-4" /> },
];

const getBaseUrl = () => import.meta.env.PROD ? 'https://api.kriyanto.com' : `${window.location.origin}/api`;

const CODE_SNIPPETS = {
  python: (baseUrl) => `import requests
import json

API_KEY = "sk_your_api_key_here"
BASE_URL = "${baseUrl}"

# --- Analyze Text (Streaming SSE) ---
response = requests.post(
    f"{BASE_URL}/api/v1/analyze",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "text": "I absolutely love the new design!",
        "model": "kriyacore"  # or "kriyasense"
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        decoded = line.decode("utf-8")
        if decoded.startswith("data: "):
            data = json.loads(decoded[6:])
            print(data)
            
            if data.get("status") == "completed":
                result = data["result"]
                print(f"Sentiment: {result['dominant_sentiment']}")
                print(f"Emotions: {result['emotions']}")`,

  javascript: (baseUrl) => `const API_KEY = "sk_your_api_key_here";
const BASE_URL = "${baseUrl}";

// --- Analyze Text (Streaming SSE via fetch) ---
async function analyzeText(text, model = "kriyacore") {
  const response = await fetch(\`\${BASE_URL}/api/v1/analyze\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, model })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split("\\n").filter(l => l.startsWith("data: "));
    
    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
      
      if (data.status === "completed") {
        console.log("Sentiment:", data.result.dominant_sentiment);
        console.log("Emotions:", data.result.emotions);
      }
    }
  }
}

analyzeText("I absolutely love the new design!");`,

  typescript: (baseUrl) => `const API_KEY: string = "sk_your_api_key_here";
const BASE_URL: string = "${baseUrl}";

interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
}

interface AnalysisResult {
  text: string;
  sentiment: SentimentResult;
  emotions: string[];
  dominant_sentiment: string;
}

interface SSEEvent {
  status: "queued" | "processing" | "completed" | "error";
  task_id?: string;
  chunk_index?: number;
  total_chunks?: number;
  result?: AnalysisResult;
  message?: string;
}

async function analyzeText(
  text: string, 
  model: "kriyacore" | "kriyasense" = "kriyacore"
): Promise<AnalysisResult | null> {
  const response = await fetch(\`\${BASE_URL}/api/v1/analyze\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, model })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let result: AnalysisResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split("\\n").filter(l => l.startsWith("data: "));
    
    for (const line of lines) {
      const data: SSEEvent = JSON.parse(line.slice(6));
      if (data.status === "completed" && data.result) {
        result = data.result;
      }
    }
  }
  return result;
}

// Usage
analyzeText("I absolutely love the new design!")
  .then(r => console.log(r));`,

  curl: (baseUrl) => `# Analyze text using KriyaSense API (SSE streaming)
curl -N -X POST "${baseUrl}/api/v1/analyze" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "I absolutely love the new design!",
    "model": "kriyacore"
  }'

# Response (Server-Sent Events):
# data: {"status": "queued", "task_id": "c4d2e..."}
# data: {"status": "processing", "chunk_index": 1, ...}
# data: {"status": "completed", "result": {...}}`,
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-3 right-3 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors z-10" title="Copy to clipboard">
      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
};

const EndpointCard = ({ method, path, description, requestBody, responseExample, authRequired, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {method}
          </span>
          <span className="font-mono text-white text-sm sm:text-base">{path}</span>
          {authRequired && (
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">
              Auth Required
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/5 p-6 space-y-6">
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
          
          {authRequired && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Headers</h4>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300">
                Authorization: Bearer sk_your_api_key_here
              </div>
            </div>
          )}
          
          {requestBody && (
            <div className="relative group">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body</h4>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300 overflow-x-auto relative">
                <CopyButton text={requestBody} />
                <pre className="whitespace-pre-wrap">{requestBody}</pre>
              </div>
            </div>
          )}

          {responseExample && (
            <div className="relative group">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Example Response</h4>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 font-mono text-sm text-gray-300 overflow-x-auto relative">
                <CopyButton text={responseExample} />
                <pre className="whitespace-pre-wrap">{responseExample}</pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const ApiDocs = () => {
  const [activeLang, setActiveLang] = useState('python');
  const [modelHealth, setModelHealth] = useState({ kriyacore: true, kriyasense: false });
  const baseUrl = getBaseUrl();

  useEffect(() => {
    checkModelHealth().then(setModelHealth).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
        <h1 className="text-4xl md:text-5xl font-space font-bold mb-4">API Documentation</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-3xl">
          Integrate KriyaSense's dual-model sentiment and emotion analysis directly into your applications using our REST API with real-time SSE streaming.
        </p>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl"><Zap className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Base URL</p>
              <code className="text-sm text-white font-mono break-all">{baseUrl}</code>
            </div>
          </div>
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl"><Shield className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Authentication</p>
              <p className="text-sm text-white">Bearer Token (API Key)</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-purple-500/10 rounded-xl"><Clock className="w-5 h-5 text-purple-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rate Limit</p>
              <p className="text-sm text-white">30 req/day, 1 req/10s</p>
            </div>
          </div>
        </div>

        {/* Model Status */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">KriyaCore</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <span className={`w-2 h-2 rounded-full ${modelHealth.kriyasense ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-300 font-medium">KriyaSense-V1 {modelHealth.kriyasense ? '' : '(Offline)'}</span>
          </div>
        </div>
      </motion.div>

      {/* Endpoints */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-16">
        <h2 className="text-2xl font-space font-bold text-white mb-6">Endpoints</h2>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/v1/analyze"
            authRequired={true}
            defaultOpen={true}
            description="Analyze text for sentiment and emotion using KriyaCore or KriyaSense-V1. Returns results via Server-Sent Events (SSE) for real-time streaming. Supports text up to 2,000 characters. Available models: 'kriyacore' (fast, local inference) and 'kriyasense' (LLM-based contextual analysis)."
            requestBody={`{
  "text": "I absolutely love the new design, but the load times are annoying.",
  "session_id": "optional-uuid-here",
  "model": "kriyacore"
}`}
            responseExample={`data: {"status": "queued", "task_id": "c4d2e..."}

data: {"status": "processing", "chunk_index": 1, "total_chunks": 1, "sentiment_delta": {"positive": 62.3, "negative": 28.1, "neutral": 9.6}}

data: {"status": "completed", "result": {"text": "...", "sentiment": {"positive": 62.3, "negative": 28.1, "neutral": 9.6}, "emotions": ["love", "annoyance"], "dominant_sentiment": "positive"}}`}
          />

          <EndpointCard
            method="GET"
            path="/api/health"
            authRequired={false}
            description="Health check endpoint. Returns the current status of the API server. Useful for monitoring and uptime checks."
            responseExample={`{
  "status": "ok",
  "timestamp": "2026-06-05T10:00:00Z"
}`}
          />

          <EndpointCard
            method="GET"
            path="/api/health/models"
            authRequired={false}
            description="Check the availability status of all analysis models. Use this to determine if the KriyaSense-V1 (LLM) model is currently online before sending requests."
            responseExample={`{
  "kriyacore": true,
  "kriyasense": false
}`}
          />
        </div>
      </motion.div>

      {/* Code Snippets */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="text-2xl font-space font-bold text-white mb-2">Quick Start</h2>
        <p className="text-gray-400 mb-6">Copy-paste ready code to integrate KriyaSense into your project.</p>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-2)] border border-white/10 rounded-xl mb-4 w-fit">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeLang === lang.id ? 'bg-[var(--color-brand-primary)] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {lang.icon}
              <span className="hidden sm:inline">{lang.label}</span>
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative">
          <CopyButton text={CODE_SNIPPETS[activeLang](baseUrl)} />
          <div className="bg-[#0d1117] p-6 rounded-2xl border border-white/10 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre">{CODE_SNIPPETS[activeLang](baseUrl)}</pre>
          </div>
        </div>

        {/* Authentication Note */}
        <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200 leading-relaxed">
            <strong className="block mb-1">Getting Your API Key</strong>
            To get your API key, <a href="/register" className="underline underline-offset-2 hover:text-white transition-colors">create an account</a>, then navigate to your <a href="/dashboard" className="underline underline-offset-2 hover:text-white transition-colors">Developer Dashboard</a> and click "Generate New Key". You can create up to 3 keys per account.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApiDocs;
