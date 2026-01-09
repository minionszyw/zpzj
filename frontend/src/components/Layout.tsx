import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Brand Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-center md:justify-start">
          <Link to="/" className="text-lg font-bold text-brand-primary">子平真君</Link>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 mb-16 md:mb-0">
        <Outlet />
      </main>

      {/* Tab Bar */}
      <BottomNavigation />
    </div>
  );
};