import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { cn } from '../utils/cn';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/') || location.pathname === '/';

  return (
    <div className="min-h-screen bg-stone-100/50 dark:bg-stone-950 flex justify-center selection:bg-brand-accent/20">
      {/* 
        Main App Container 
        Centered on PC, full width on mobile.
      */}
      <div className="w-full max-w-[480px] bg-paper-light dark:bg-stone-900 shadow-xl min-h-screen relative flex flex-col">
        
        <main className={cn(
          "flex-1 transition-all duration-300 flex flex-col",
          "pb-16" // Mobile BottomNav spacing
        )}>
          {/* Mobile Header for Chat pages specifically if needed, or global mobile header */}
          {!isChat && (
              <header className="h-14 border-b border-ink-100 bg-paper-light/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-center">
                  <span className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">子平真君</span>
              </header>
          )}

          <div className="flex-1 p-4 md:p-6 h-full overflow-x-hidden">
              <Outlet />
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};
