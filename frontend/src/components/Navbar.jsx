import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const baseLinks = [
    { name: 'Analyzer', path: '/' },
    { name: 'Research', path: '/research' },
  ];

  if (user) {
    baseLinks.push({ name: 'API Docs', path: '/api-docs' });
    if (user.role === 'admin') {
      baseLinks.push({ name: 'Admin Dashboard', path: '/admin' });
    } else {
      baseLinks.push({ name: 'Batch Predict', path: '/batch-predict' });
      baseLinks.push({ name: 'Dashboard', path: '/dashboard' });
    }
  }

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-bg-base)]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <Activity className="w-6 h-6 text-[var(--color-brand-primary)]" />
            <span className="text-xl font-bold tracking-tight text-white">KriyaSense</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center space-x-2">
              {baseLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-brand-primary)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                Logout <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/5">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[var(--color-surface-1)] shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {baseLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`block px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-px w-full bg-white/10 my-6"></div>
              
              {user ? (
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Link 
                    to="/login" 
                    onClick={closeMenu}
                    className="block text-center px-4 py-3 text-base font-medium text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 shadow-sm"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={closeMenu}
                    className="block text-center px-4 py-3 text-base font-bold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] rounded-xl transition-colors shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.4)]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
