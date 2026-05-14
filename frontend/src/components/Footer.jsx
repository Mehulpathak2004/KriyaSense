import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between">
        <div className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} KriyaSense by Kriyanto. Built for understanding text.
        </div>
        <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
