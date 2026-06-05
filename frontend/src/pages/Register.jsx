import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowRight, ShieldCheck, Building2, ArrowLeft } from 'lucide-react';
import { registerUser, sendOtp } from '../api';

const INDUSTRIES = [
  'E-Commerce', 'SaaS / Technology', 'Healthcare', 'Finance / Banking',
  'Education', 'Media / Entertainment', 'Retail', 'Logistics', 'Other'
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

const Register = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Company profile
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [useCase, setUseCase] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!username || !email || password.length < 6) {
      setError('Please fill all fields and ensure password is at least 6 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await sendOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please enter your company or project name.');
      return;
    }
    if (!industry) {
      setError('Please select your industry.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await registerUser(username, password, email, otp, {
        company_name: companyName,
        industry: industry,
        company_size: companySize,
        use_case: useCase
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register. Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Account' },
    { num: 2, label: 'Company' },
    { num: 3, label: 'Verify' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-surface-1)] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand-primary)]/5 to-transparent pointer-events-none" />
        
        <h2 className="text-3xl font-space font-bold text-white mb-2 relative">Create Account</h2>
        <p className="text-gray-400 mb-6 relative">Sign up to get your free API keys.</p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 relative">
          {stepLabels.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${step >= s.num ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white' : 'border-white/20 text-gray-500'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[10px] font-medium ${step >= s.num ? 'text-[var(--color-brand-primary)]' : 'text-gray-600'}`}>{s.label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-all duration-500 ${step > s.num ? 'bg-[var(--color-brand-primary)]' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>
        
        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm relative">{error}</div>}
        
        <AnimatePresence mode="wait">
          {/* STEP 1: Account Details */}
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp} 
              className="space-y-5 relative"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                  required
                  minLength={6}
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          )}

          {/* STEP 2: Company Profile */}
          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCompanySubmit} 
              className="space-y-5 relative"
            >
              <div className="p-4 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-xl mb-2">
                <Building2 className="w-5 h-5 text-[var(--color-brand-primary)] mb-1.5" />
                <p className="text-xs text-gray-300">Tell us about your company so our AI models can provide more accurate, context-aware sentiment analysis for your industry.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Company / Project Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Industry <span className="text-red-400">*</span></label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Company Size</label>
                <div className="grid grid-cols-5 gap-2">
                  {COMPANY_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${companySize === size ? 'bg-[var(--color-brand-primary)]/15 border-[var(--color-brand-primary)]/50 text-[var(--color-brand-primary)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">How do you plan to use KriyaSense?</label>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="e.g. Analyzing customer reviews to detect churn risk..."
                  rows={3}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all flex justify-center items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: OTP Verification */}
          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyAndRegister} 
              className="space-y-5 relative"
            >
              <div className="p-4 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-xl mb-6">
                <Mail className="w-6 h-6 text-[var(--color-brand-primary)] mb-2" />
                <p className="text-sm text-gray-300">We've sent a 6-digit OTP to <strong className="text-white">{email}</strong>. Please enter it below to verify your account.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">One-Time Password (OTP)</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white font-mono text-center tracking-[0.5em] focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign Up <ShieldCheck className="w-4 h-4" /></>}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        <p className="mt-6 text-center text-sm text-gray-400 relative">
          Already have an account? <Link to="/login" className="text-white hover:underline decoration-dashed underline-offset-4">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
