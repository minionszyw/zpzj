import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MessageSquare, LayoutGrid, User, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { UserAvatar } from './UserAvatar';

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { to: '/', icon: MessageSquare, label: '咨询' },
    { to: '/bazi', icon: LayoutGrid, label: '排盘' },
    { to: '/me', icon: User, label: '我的' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-paper-light border-r border-ink-100 z-30">
      {/* Brand / Logo */}
      <div className="h-24 flex items-center justify-center border-b border-ink-100/50">
        <Link to="/" className="flex flex-col items-center gap-2 group">
           <div className="w-8 h-8 rounded border-2 border-brand-accent flex items-center justify-center rotate-45 group-hover:rotate-0 transition-transform duration-500">
               <span className="text-brand-accent font-serif font-bold -rotate-45 group-hover:rotate-0 transition-transform duration-500">真</span>
           </div>
           <span className="text-xl font-serif font-bold text-ink-900 tracking-widest">子平真君</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 group hover:bg-ink-100/30",
                isActive 
                  ? "bg-ink-900 text-white shadow-md shadow-ink-900/10" 
                  : "text-ink-500 hover:text-ink-900"
              )
            }
          >
            <item.icon size={20} strokeWidth={1.5} />
            <span className="font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Footer */}
      <div className="p-4 border-t border-ink-100/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-100/30 transition-colors cursor-pointer group">
            <UserAvatar avatarUrl={user?.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink-900 truncate font-serif">{user?.nickname || '道友'}</p>
                <button onClick={logout} className="text-xs text-ink-500 hover:text-brand-accent flex items-center gap-1 transition-colors mt-0.5">
                    <LogOut size={12} />
                    <span>退出登录</span>
                </button>
            </div>
        </div>
      </div>
    </aside>
  );
};