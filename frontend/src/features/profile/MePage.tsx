import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ArchiveListPage } from './ArchiveListPage';
import { User, LogOut, Settings, BookOpen, Info, ShieldCheck, Zap, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { cn } from '../../utils/cn';
import { ProfileEditModal } from './ProfileEditModal';

// 默认头像配置映射
const AVATAR_MAP: Record<string, { color: string, label: string }> = {
    '1': { color: 'bg-blue-500', label: '乾' },
    '2': { color: 'bg-red-500', label: '离' },
    '3': { color: 'bg-green-500', label: '震' },
    '4': { color: 'bg-yellow-500', label: '坤' },
    '5': { color: 'bg-purple-500', label: '巽' },
    '6': { color: 'bg-gray-500', label: '坎' },
};

export const MePage: React.FC = () => {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [responseMode, setResponseMode] = useState(user?.settings?.response_mode || 'normal');
  const [depth, setDepth] = useState(user?.settings?.depth || 10);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 获取当前头像样式
  const currentAvatar = AVATAR_MAP[user?.avatar_url || ''] || { color: 'bg-violet-100', label: '' };

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
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">回答模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                    setResponseMode('normal');
                    handleSaveSettings({ response_mode: 'normal' });
                }}
                className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    responseMode === 'normal' ? "border-brand-primary bg-violet-50 text-brand-primary" : "border-gray-50 bg-gray-50 text-gray-500"
                )}
              >
                <ShieldCheck size={24} />
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
                    responseMode === 'professional' ? "border-brand-primary bg-violet-50 text-brand-primary" : "border-gray-50 bg-gray-50 text-gray-500"
                )}
              >
                <Zap size={24} />
                <span className="text-sm font-bold">专业模式</span>
                <span className="text-[10px] opacity-70">学术深挖，重古籍</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-400 uppercase">上下文深度</label>
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
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
            <p className="mt-2 text-[10px] text-gray-400">保留最近 N 轮对话历史，超出部分将自动生成摘要。</p>
          </div>
          
          {saving && <p className="text-[10px] text-brand-primary animate-pulse text-center">正在同步设置...</p>}
        </div>
      ) 
    },
    { title: '关于我们', icon: Info, component: <div className="p-4 bg-white rounded-xl border border-gray-100 text-sm text-gray-500 shadow-sm">子平真君 AI v0.1.0</div> },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
            <button
                onClick={handleLogout}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                title="退出登录"
            >
                <LogOut size={18} />
            </button>
        </div>
        
        <div 
            onClick={() => setIsEditModalOpen(true)}
            className="flex flex-1 items-center gap-4 cursor-pointer group"
        >
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-inner group-hover:ring-4 group-hover:ring-violet-50 transition-all text-white text-xl font-bold",
                currentAvatar.color
            )}>
                {currentAvatar.label || <User size={32} />}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{user?.nickname || user?.email.split('@')[0]}</h2>
                    <Edit2 size={14} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
                </div>
                <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={idx} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-2">
            <section.icon size={18} className="text-brand-primary" />
            <span className="text-sm font-bold text-gray-700">{section.title}</span>
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
