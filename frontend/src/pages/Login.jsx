import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await loginUser(email, password);
      login({ email, role: data.role });
      
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login');
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
        
        <h2 className="text-3xl font-space font-bold text-white mb-2 relative">Welcome Back</h2>
        <p className="text-gray-400 mb-8 relative">Log in to manage your API keys.</p>
        
        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5 relative">
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
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[var(--color-brand-primary)] hover:underline mt-1">Forgot Password?</Link>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-400 relative">
          Don't have an account? <Link to="/register" className="text-white hover:underline decoration-dashed underline-offset-4">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
