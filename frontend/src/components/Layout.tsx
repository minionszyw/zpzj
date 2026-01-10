import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { cn } from '../utils/cn';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/') || location.pathname === '/';

  return (
    <div className="min-h-screen bg-paper-light text-ink-900 font-sans selection:bg-brand-accent/20">
      <Sidebar />
      
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "md:pl-64", // Sidebar offset
        "pb-20 md:pb-0" // Mobile BottomNav spacing
      )}>
        {/* Mobile Header for Chat pages specifically if needed, or global mobile header */}
        {!isChat && (
            <header className="md:hidden h-14 border-b border-ink-100 bg-paper-light/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-center">
                <span className="font-serif font-bold text-lg text-ink-900">子平真君</span>
            </header>
        )}

        <div className="max-w-7xl mx-auto p-4 md:p-8 h-full">
            <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  );
};
