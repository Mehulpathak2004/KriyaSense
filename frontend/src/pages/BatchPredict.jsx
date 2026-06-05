import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, Clock, 
  ChevronDown, ChevronUp, Loader2, X, FileText, ArrowRight, RotateCcw, 
  Info, BarChart3, Gift, Users, Copy, Check, ShieldAlert, Sparkles
} from 'lucide-react';
import { uploadCsv, previewCsvColumn, startCsvPrediction, getCsvJobStatus, downloadCsvResult, fetchCsvHistory, checkModelHealth } from '../api';

const STATUS_COLORS = {
  uploaded: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  queued: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
};

const BatchPredict = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [preview, setPreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [copiedRow, setCopiedRow] = useState(null);
  const [selectedModel, setSelectedModel] = useState('kriyacore');
  const [llmAvailable, setLlmAvailable] = useState(false);

  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    loadHistory();
    checkModelHealth().then(h => setLlmAvailable(h.kriyasense)).catch(() => setLlmAvailable(false));
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchCsvHistory();
      setHistory(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setHistoryLoading(false); 
    }
  };

  const handleFile = (f) => {
    setError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) { 
      setError('Only CSV files are accepted'); 
      return; 
    }
    if (f.size > 10 * 1024 * 1024) { 
      setError('File exceeds 10MB limit'); 
      return; 
    }
    setFile(f);
  };

  const handleDrop = (e) => { 
    e.preventDefault(); 
    setDragActive(false); 
    handleFile(e.dataTransfer.files[0]); 
  };
  
  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setDragActive(true); 
  };
  
  const handleDragLeave = () => setDragActive(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); 
    setError(''); 
    setUploadProgress(0);
    try {
      const data = await uploadCsv(file, setUploadProgress);
      setJobData(data);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.');
    } finally { 
      setUploading(false); 
    }
  };

  const handleColumnSelect = async (col) => {
    setSelectedColumn(col);
    setLoadingPreview(true);
    try {
      const data = await previewCsvColumn(jobData.job_id, col);
      setPreview(data.preview);
    } catch (e) { 
      setPreview([]); 
    } finally { 
      setLoadingPreview(false); 
    }
  };

  const startPolling = (jobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getCsvJobStatus(jobId);
        setJobStatus(status);
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          loadHistory();
        }
      } catch (e) { 
        console.error(e); 
      }
    }, 3000);
  };

  const handlePredict = async () => {
    if (!selectedColumn || !jobData) return;
    setPredicting(true); 
    setError('');
    try {
      await startCsvPrediction(jobData.job_id, selectedColumn, selectedModel);
      setStep(3);
      setJobStatus({ status: 'queued', processed_rows: 0, row_count: jobData.row_count });
      startPolling(jobData.job_id);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start prediction');
    } finally { 
      setPredicting(false); 
    }
  };

  const handleDownload = async (jobId, filename) => {
    try {
      const response = await downloadCsvResult(jobId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename?.replace('.csv', '_predictions.csv') || 'predictions.csv';
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { 
      setError('Download failed. The file may have expired.'); 
    }
  };

  const resetWizard = () => {
    setStep(1); 
    setFile(null); 
    setJobData(null); 
    setSelectedColumn('');
    setPreview([]); 
    setJobStatus(null); 
    setError(''); 
    setShowErrors(false);
    setActiveTab('analytics');
    if (pollingRef.current) { 
      clearInterval(pollingRef.current); 
      pollingRef.current = null; 
    }
    loadHistory();
  };

  const getTimeRemaining = (job) => {
    if (job.files_deleted) return 'Expired';
    if (!job.expires_at) return '—';
    const diff = new Date(job.expires_at) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const handleCopyOffer = (offerText, rowIndex) => {
    navigator.clipboard.writeText(offerText);
    setCopiedRow(rowIndex);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const steps = [
    { num: 1, label: 'Upload CSV' },
    { num: 2, label: 'Select Column' },
    { num: 3, label: 'Processing' },
    { num: 4, label: 'Results & Dashboard' },
  ];

  const isFinished = jobStatus?.status === 'completed' || jobStatus?.status === 'failed';
  if (step === 3 && isFinished) {
    setTimeout(() => setStep(4), 500);
  }

  // Analytics extraction
  const analytics = jobStatus?.analytics || {
    sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
    urgency_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
    average_priority_score: 0.0,
    total_points_recommended: 0,
    top_candidates: []
  };

  const totalAnalyzed = jobStatus?.processed_rows || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-space font-bold text-white mb-2">Batch Predict & Customer Loyalty</h1>
        <p className="text-gray-400 max-w-3xl">
          Analyze customer feedback files to detect overall sentiments, flag frustrated customers in real-time, and get smart loyalty points outreach recommendations.
        </p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10 max-w-xl mx-auto">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${step >= s.num ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white shadow-[0_0_15px_rgba(61,168,176,0.4)]' : 'border-white/20 text-gray-500'}`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden md:block ${step >= s.num ? 'text-[var(--color-brand-primary)]' : 'text-gray-600'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-500 ${step > s.num ? 'bg-[var(--color-brand-primary)]' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard Content */}
      <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-brand-primary)]/5 rounded-full filter blur-3xl pointer-events-none" />
        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-space font-bold text-white">Upload your feedback file</h2>
                  <p className="text-gray-400 text-sm mt-1">Accepts CSV spreadsheets containing user comments or reviews.</p>
                </div>
              </div>
              
              <div
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'}`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-emerald-400 animate-pulse" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-500" />
                    <p className="text-gray-300 font-medium">Drag & drop your CSV here</p>
                    <p className="text-gray-500 text-sm">or click to browse • Max 10MB • Up to 5,000 rows</p>
                  </div>
                )}
              </div>
              
              {/* Data warning banner */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-left">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300 leading-relaxed">
                  <strong className="text-blue-200 block mb-0.5">File Storage Policy (24-hour expiration)</strong>
                  Your uploaded CSV and predicted results file are stored securely and deleted automatically after 24 hours. After expiration, spreadsheet downloads will not be available, but your Loyalty & Retention dashboard statistics will remain fully saved in your account.
                </div>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-[var(--color-brand-primary)] rounded-full" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Uploading... {uploadProgress}%</p>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button onClick={handleUpload} disabled={!file || uploading}
                  className="px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <>Upload & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Select Column */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-space font-bold text-white mb-2">Select the text column</h2>
              <p className="text-gray-400 text-sm mb-6">Your file <span className="text-[var(--color-brand-primary)] font-medium">{jobData?.filename}</span> has {jobData?.row_count} rows. Choose the column containing customer feedback to analyze.</p>

              {/* Model Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3 font-space">Select Analysis Model</label>
                <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                  <button 
                    onClick={() => setSelectedModel('kriyacore')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedModel === 'kriyacore' ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-[var(--color-brand-primary)]/20' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    KriyaCore (Standard)
                  </button>
                  <button 
                    onClick={() => { if (llmAvailable) setSelectedModel('kriyasense'); }}
                    disabled={!llmAvailable}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${selectedModel === 'kriyasense' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : !llmAvailable ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-gray-200'}`}
                    title={!llmAvailable ? 'LLM service is currently offline' : ''}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> KriyaSense-V1
                    {!llmAvailable && <span className="text-[9px] ml-1 bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Offline</span>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {jobData?.columns?.map((col) => (
                  <button key={col} onClick={() => handleColumnSelect(col)}
                    className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${selectedColumn === col ? 'bg-[var(--color-brand-primary)]/15 border-[var(--color-brand-primary)]/50 text-[var(--color-brand-primary)]' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}`}>
                    <FileText className="w-4 h-4 mb-1 inline-block mr-1.5 opacity-60" />{col}
                  </button>
                ))}
              </div>
              {selectedColumn && (
                <div className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-[var(--color-brand-primary)]" />
                    <span className="text-sm font-medium text-gray-300">Preview — first 5 rows of "{selectedColumn}"</span>
                  </div>
                  {loadingPreview ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {preview.map((row, i) => (
                        <div key={i} className="text-sm text-gray-400 bg-black/20 px-3 py-2 rounded-lg truncate">
                          <span className="text-gray-600 mr-2">{i + 1}.</span>{row || <span className="italic text-gray-600">empty</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={() => { setStep(1); setFile(null); setJobData(null); setSelectedColumn(''); setPreview([]); }}
                  className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">← Back</button>
                <button onClick={handlePredict} disabled={!selectedColumn || predicting}
                  className="px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {predicting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</> : <>Start Prediction <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[var(--color-brand-primary)] animate-spin" />
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-[var(--color-brand-primary)] animate-pulse" />
              </div>
              <h2 className="text-2xl font-space font-bold text-white mb-2">Processing your CSV...</h2>
              <p className="text-gray-400 mb-6">Analyzing sentiments, emotional intensity, and generating loyalty recommendations.</p>
              {jobStatus && (
                <div className="max-w-sm mx-auto">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{jobStatus.processed_rows || 0} / {jobData?.row_count || '?'} rows</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[jobStatus.status] || ''}`}>{jobStatus.status}</span>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${jobData?.row_count ? ((jobStatus.processed_rows || 0) / jobData.row_count) * 100 : 0}%` }}
                      transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-[var(--color-brand-primary)] to-emerald-400 rounded-full" />
                  </div>
                  {jobStatus.error_rows > 0 && <p className="text-xs text-amber-400 mt-2 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> {jobStatus.error_rows} row(s) with errors</p>}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Dashboard Results */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {jobStatus?.status === 'completed' ? (
                <div>
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 mb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-2xl font-space font-bold text-white">{jobData?.filename || 'Analysis Dashboard'}</h2>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">Processed on {new Date(jobStatus.created_at).toLocaleDateString()} • Expiring in: {getTimeRemaining(jobStatus)}</p>
                    </div>
                    
                    <button onClick={resetWizard}
                      className="px-4 py-2 bg-white/10 text-white font-medium text-xs rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> Start New Upload
                    </button>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="flex border-b border-white/5 mb-6 gap-2">
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className={`pb-3 px-2 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'border-[var(--color-brand-primary)] text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                      <BarChart3 className="w-4 h-4" /> Retention Analytics
                    </button>
                    <button 
                      onClick={() => setActiveTab('candidates')}
                      className={`pb-3 px-2 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'candidates' ? 'border-[var(--color-brand-primary)] text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                      <ShieldAlert className="w-4 h-4 text-red-400" /> At-Risk Customers
                      {analytics.top_candidates?.length > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {analytics.top_candidates.length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('downloads')}
                      className={`pb-3 px-2 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'downloads' ? 'border-[var(--color-brand-primary)] text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                      <Download className="w-4 h-4" /> Download & Logs
                    </button>
                  </div>

                  {/* Tab contents */}
                  <AnimatePresence mode="wait">
                    {/* TAB 1: Analytics Overview */}
                    {activeTab === 'analytics' && (
                      <motion.div key="tab-analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Analyzed Rows</p>
                              <p className="text-xl font-bold text-white">{totalAnalyzed}</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">At-Risk Clients</p>
                              <p className="text-xl font-bold text-red-400">
                                {(analytics.urgency_distribution?.critical || 0) + (analytics.urgency_distribution?.high || 0)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                              <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Avg Churn Score</p>
                              <p className="text-xl font-bold text-purple-400">{analytics.average_priority_score}%</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                              <Gift className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Points Budget</p>
                              <p className="text-xl font-bold text-yellow-400">{analytics.total_points_recommended} pts</p>
                            </div>
                          </div>
                        </div>

                        {/* Distributions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Sentiment Breakdown */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <h3 className="text-sm font-medium text-white mb-4">Sentiment Distribution</h3>
                            <div className="space-y-4">
                              {/* Positive */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-emerald-400">Positive</span>
                                  <span>{analytics.sentiment_distribution?.positive || 0} ({totalAnalyzed > 0 ? roundPct(analytics.sentiment_distribution?.positive, totalAnalyzed) : 0}%)</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.sentiment_distribution?.positive / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>
                              
                              {/* Neutral */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-amber-400">Neutral</span>
                                  <span>{analytics.sentiment_distribution?.neutral || 0} ({totalAnalyzed > 0 ? roundPct(analytics.sentiment_distribution?.neutral, totalAnalyzed) : 0}%)</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.sentiment_distribution?.neutral / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>

                              {/* Negative */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-rose-400">Negative</span>
                                  <span>{analytics.sentiment_distribution?.negative || 0} ({totalAnalyzed > 0 ? roundPct(analytics.sentiment_distribution?.negative, totalAnalyzed) : 0}%)</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.sentiment_distribution?.negative / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Urgency Distribution */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <h3 className="text-sm font-medium text-white mb-4">Retention Urgency Breakdown</h3>
                            <div className="space-y-4">
                              {/* Critical */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-red-500">Critical (Score &ge; 75%)</span>
                                  <span>{analytics.urgency_distribution?.critical || 0}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-red-600 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.urgency_distribution?.critical / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>

                              {/* High */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-orange-400">High (Score 50-74%)</span>
                                  <span>{analytics.urgency_distribution?.high || 0}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.urgency_distribution?.high / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>

                              {/* Medium */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-yellow-400">Medium (Score 25-49%)</span>
                                  <span>{analytics.urgency_distribution?.medium || 0}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.urgency_distribution?.medium / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>

                              {/* Low */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span className="flex items-center gap-1.5 font-medium text-blue-400">Low (Score &lt; 25%)</span>
                                  <span>{analytics.urgency_distribution?.low || 0}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalAnalyzed > 0 ? (analytics.urgency_distribution?.low / totalAnalyzed) * 100 : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: At-Risk Candidates */}
                    {activeTab === 'candidates' && (
                      <motion.div key="tab-candidates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-white">Top Retention Outreach Candidates</h3>
                          <span className="text-xs text-gray-500">Sorted by Churn Probability</span>
                        </div>

                        {analytics.top_candidates?.length === 0 ? (
                          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
                            <p className="text-gray-400 text-sm">No customers flagged as high risk in this batch!</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {analytics.top_candidates.map((cand, i) => (
                              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">Row {cand.row}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${cand.urgency === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                      {cand.urgency}
                                    </span>
                                    <span className="text-xs text-gray-400">Churn Probability: <strong className="text-white">{cand.score}%</strong></span>
                                  </div>
                                  <p className="text-sm text-gray-300 italic">"{cand.text}"</p>
                                  <div className="text-xs text-gray-500">
                                    Detected Emotions: <span className="text-gray-300">{cand.emotions || 'none'}</span>
                                  </div>
                                </div>

                                <div className="bg-white/5 border border-white/15 rounded-xl p-3 flex items-center justify-between gap-3 w-full md:w-auto">
                                  <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider block">Recommended Action</span>
                                    <span className="text-xs text-white font-medium">{cand.offer}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleCopyOffer(cand.offer, i)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition-all flex-shrink-0"
                                    title="Copy outreach offer details"
                                  >
                                    {copiedRow === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* TAB 3: Downloads & Logs */}
                    {activeTab === 'downloads' && (
                      <motion.div key="tab-downloads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                          <FileSpreadsheet className="w-12 h-12 text-[var(--color-brand-primary)] mx-auto mb-4" />
                          <h3 className="text-white font-bold mb-2">Download Enriched Spreadsheet</h3>
                          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                            Downloads the complete CSV file including all original columns plus sentiment scores, emotion models, churn probability, and recommended offers.
                          </p>

                          {jobStatus.files_deleted ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mx-auto">
                              <AlertTriangle className="w-4 h-4" /> File Expired (Physical file purged from server)
                            </div>
                          ) : (
                            <button onClick={() => handleDownload(jobData.job_id, jobData.filename)}
                              className="px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mx-auto">
                              <Download className="w-4 h-4" /> Download Predictions CSV
                            </button>
                          )}
                        </div>

                        {jobStatus.error_details?.length > 0 && (
                          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                            <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" /> Execution Failures & Skipped Rows
                            </h4>
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
                              {jobStatus.error_details.map((e, i) => (
                                <div key={i} className="text-gray-400 flex gap-2">
                                  <span className="text-amber-500">Row {e.row}:</span>
                                  <span>{e.error}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-space font-bold text-white mb-1">Prediction Failed</h2>
                  <p className="text-gray-400 mb-6">{jobStatus?.error_message || 'An unexpected error occurred.'}</p>
                  <button onClick={resetWizard} className="px-6 py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 mx-auto">
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Job History */}
      <div className="bg-[var(--color-surface-1)] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-white">Batch Analysis History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Click "View Dashboard" to review statistics of any completed job at any time.</p>
          </div>
          <button 
            onClick={loadHistory} 
            className="text-xs text-[var(--color-brand-primary)] hover:underline"
            disabled={historyLoading}
          >
            Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="text-center py-12 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] border-dashed">
            <FileSpreadsheet className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No CSV jobs yet. Upload your first file above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">File Name</th>
                  <th className="pb-3 font-medium">Rows</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Errors</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Expires In</th>
                  <th className="pb-3 font-medium text-right text-xs uppercase tracking-wider">Outreach Report</th>
                </tr>
              </thead>
              <tbody>
                {history.map((job) => {
                  const expired = job.files_deleted || (new Date(job.expires_at) - new Date() <= 0);
                  return (
                    <tr key={job._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 text-white font-medium max-w-[220px] truncate" title={job.original_filename}>
                        {job.original_filename}
                      </td>
                      <td className="py-4 text-gray-400">{job.row_count}</td>
                      <td className="py-4">
                        <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold ${expired && job.status === 'completed' ? STATUS_COLORS.expired : (STATUS_COLORS[job.status] || '')}`}>
                          {expired && job.status === 'completed' ? 'Expired (Stats Saved)' : job.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{job.error_rows || 0}</td>
                      <td className="py-4 text-gray-500 hidden md:table-cell">
                        <Clock className="w-3.5 h-3.5 inline mr-1 text-gray-600" />
                        {getTimeRemaining(job)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === 'completed' && (
                            <>
                              <button 
                                onClick={() => {
                                  setJobData({
                                    job_id: job._id,
                                    filename: job.original_filename,
                                    row_count: job.row_count,
                                    columns: job.columns
                                  });
                                  setJobStatus(job);
                                  setStep(4);
                                  setActiveTab('analytics');
                                }}
                                className="p-2 text-gray-400 hover:text-[var(--color-brand-primary)] hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                title="Open Dashboard"
                              >
                                <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">View Dashboard</span>
                              </button>
                              
                              {!job.files_deleted && !expired && (
                                <button 
                                  onClick={() => handleDownload(job._id, job.original_filename)}
                                  className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Download predictions CSV"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper percentage function
function roundPct(val, total) {
  if (!val || !total) return 0;
  return Math.round((val / total) * 100);
}

export default BatchPredict;
