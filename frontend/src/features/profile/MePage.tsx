import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ArchiveListPage } from './ArchiveListPage';
import { LogOut, Settings, BookOpen, Info, ShieldCheck, Zap, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { cn } from '../../utils/cn';
import { ProfileEditModal } from './ProfileEditModal';
import { Card } from '../../components/ui/Card';
import { UserAvatar } from '../../components/UserAvatar';

export const MePage: React.FC = () => {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [responseMode, setResponseMode] = useState(user?.settings?.response_mode || 'normal');
  const [depth, setDepth] = useState(user?.settings?.depth || 10);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setResponseMode(user.settings.response_mode || 'normal');
      setDepth(user.settings.depth || 10);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      setSaving(true);
      const res = await authApi.updateUserMe({ settings: { ...user?.settings, ...newSettings } });
      if (user && res.data) {
          const token = localStorage.getItem('token') || '';
          setAuth(res.data, token);
      }
    } catch (err) {
      alert('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { title: '档案管理', icon: BookOpen, component: <ArchiveListPage /> },
    { 
      title: '系统设置', 
      icon: Settings, 
      component: (
        <Card className="p-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-ink-400 uppercase mb-3">回答模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                    setResponseMode('normal');
                    handleSaveSettings({ response_mode: 'normal' });
                }}
                className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    responseMode === 'normal' 
                        ? "border-brand-accent bg-brand-accent/5 text-brand-accent shadow-sm" 
                        : "border-ink-100 bg-white dark:bg-stone-900 text-ink-400 dark:border-ink-700 hover:border-ink-200"
                )}
              >
                <ShieldCheck size={24} className={cn(responseMode === 'normal' ? "text-brand-accent" : "text-ink-300")} />
                <span className="text-sm font-bold">普通模式</span>
                <span className="text-[10px] opacity-70">通俗易懂，重心理</span>
              </button>
              <button
                onClick={() => {
                    setResponseMode('professional');
                    handleSaveSettings({ response_mode: 'professional' });
                }}
                className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    responseMode === 'professional' 
                        ? "border-brand-accent bg-brand-accent/5 text-brand-accent shadow-sm" 
                        : "border-ink-100 bg-white dark:bg-stone-900 text-ink-400 dark:border-ink-700 hover:border-ink-200"
                )}
              >
                <Zap size={24} className={cn(responseMode === 'professional' ? "text-brand-accent" : "text-ink-300")} />
                <span className="text-sm font-bold">专业模式</span>
                <span className="text-[10px] opacity-70">学术深挖，重古籍</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-ink-400 uppercase">上下文深度</label>
                <span className="text-xs font-bold text-brand-primary">{depth} 轮</span>
            </div>
            <input 
                type="range" 
                min="2" 
                max="30" 
                step="2"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                onMouseUp={() => handleSaveSettings({ depth })}
                onTouchEnd={() => handleSaveSettings({ depth })}
                className="w-full h-1.5 bg-ink-100 rounded-lg appearance-none cursor-pointer accent-brand-primary dark:bg-ink-700"
            />
            <p className="mt-2 text-[10px] text-ink-400">保留最近 N 轮对话历史，超出部分将自动生成摘要。</p>
          </div>
          
          {saving && <p className="text-[10px] text-brand-primary animate-pulse text-center">正在同步设置...</p>}
        </Card>
      ) 
    },
    { title: '关于我们', icon: Info, component: <Card className="p-4 text-sm text-ink-500">子平真君 AI v0.1.0 (Oriental Ink)</Card> },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-8">
      {/* Profile Header */}
      <Card className="p-6 flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2">
            <button
                onClick={handleLogout}
                className="p-2 text-ink-300 hover:text-red-500 transition-colors"
                title="退出登录"
            >
                <LogOut size={18} />
            </button>
        </div>
        
        <div 
            onClick={() => setIsEditModalOpen(true)}
            className="flex flex-1 items-center gap-4 cursor-pointer"
        >
            <UserAvatar 
                avatarUrl={user?.avatar_url} 
                size="lg" 
                className="group-hover:scale-105 transition-transform shadow-md" 
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-serif text-ink-900 dark:text-ink-100">{user?.nickname || user?.email.split('@')[0]}</h2>
                    <Edit2 size={14} className="text-ink-300 group-hover:text-brand-primary transition-colors" />
                </div>
                <p className="text-sm text-ink-500">{user?.email}</p>
            </div>
        </div>
      </Card>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={idx} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-2">
            <section.icon size={18} className="text-brand-accent" />
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">{section.title}</span>
          </div>
          {section.component}
        </div>
      ))}

      <ProfileEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </div>
  );
};
