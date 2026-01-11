import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, LayoutGrid, User } from 'lucide-react';
import { cn } from '../utils/cn';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: MessageSquare, label: '咨询' },
    { to: '/bazi', icon: LayoutGrid, label: '排盘' },
    { to: '/me', icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-paper-light/80 backdrop-blur-md border-t border-ink-100 pb-safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 w-full py-2 transition-all duration-300",
                isActive ? "text-ink-900" : "text-ink-400 hover:text-ink-600"
              )
            }
          >
            {({ isActive }) => (
                <>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className={cn("transition-transform", isActive && "scale-110")} />
                    <span className={cn("text-[10px] font-medium font-serif", isActive && "font-bold")}>{item.label}</span>
                </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
