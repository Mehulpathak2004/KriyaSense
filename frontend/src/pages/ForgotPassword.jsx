import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { forgotPassword, resetPassword } from '../api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || newPassword.length < 6) {
      setError('Please enter the OTP and a password with at least 6 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await resetPassword(email, otp, newPassword);
      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-surface-1)] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand-primary)]/5 to-transparent pointer-events-none" />
        
        <h2 className="text-3xl font-space font-bold text-white mb-2 relative">Reset Password</h2>
        <p className="text-gray-400 mb-8 relative">We'll send you a recovery code.</p>
        
        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
        {success && <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">{success}</div>}
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp} 
              className="space-y-5 relative"
            >
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
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Recovery Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetPassword} 
              className="space-y-5 relative"
            >
              <div className="p-4 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-xl mb-6">
                <Mail className="w-6 h-6 text-[var(--color-brand-primary)] mb-2" />
                <p className="text-sm text-gray-300">Enter the 6-digit OTP sent to <strong className="text-white">{email}</strong> and your new password.</p>
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
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none transition-shadow"
                  required
                  minLength={6}
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reset Password <ShieldCheck className="w-4 h-4" /></>}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        <p className="mt-6 text-center text-sm text-gray-400 relative">
          Remember your password? <Link to="/login" className="text-white hover:underline decoration-dashed underline-offset-4">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
