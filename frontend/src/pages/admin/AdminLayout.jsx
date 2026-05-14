import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLayout = () => {
  const location = useLocation();

  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Users & Analytics', path: '/admin/users', icon: Users },
    { name: 'Feedback Reports', path: '/admin/reports', icon: AlertCircle },
    { name: 'Contact Queries', path: '/admin/messages', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-[#090b0b]">
      {/* Sidebar / Topbar on Mobile */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[var(--color-surface-1)] flex-shrink-0">
        <div className="p-4 md:p-6 hidden md:block">
          <h2 className="text-xl font-space font-bold text-white mb-2">Admin Portal</h2>
          <p className="text-xs text-gray-500">KriyaSense v2.1</p>
        </div>
        
        <nav className="flex md:flex-col overflow-x-auto px-4 py-2 md:py-0 md:space-y-2 md:mt-4 gap-2 custom-scrollbar border-t md:border-t-0 border-white/5">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative overflow-hidden flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-sidebar"
                    className="absolute inset-0 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 z-0"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 z-10 ${isActive ? 'text-[var(--color-brand-primary)]' : ''}`} />
                <span className="font-medium z-10 whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
