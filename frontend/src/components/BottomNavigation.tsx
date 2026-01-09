import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, LayoutGrid, User } from 'lucide-react';
import { cn } from '../utils/cn';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', icon: MessageSquare, label: '咨询' },
    { to: '/bazi', icon: LayoutGrid, label: '排盘' },
    { to: '/me', icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area-inset-bottom z-50 md:max-w-7xl md:mx-auto">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 w-full py-2 transition-colors",
                isActive ? "text-brand-primary" : "text-gray-400"
              )
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
