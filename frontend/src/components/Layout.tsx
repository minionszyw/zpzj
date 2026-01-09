import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, LogOut, MessageSquare, BookOpen } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-brand-primary">子平真君</Link>
              <nav className="ml-10 flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-brand-primary flex items-center gap-1">
                  <MessageSquare size={18} />
                  <span>咨询</span>
                </Link>
                <Link to="/archives" className="text-gray-600 hover:text-brand-primary flex items-center gap-1">
                  <BookOpen size={18} />
                  <span>档案</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <User size={16} />
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 transition-colors"
                title="退出登录"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
