import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, User, Save, Check } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// 默认头像库 (使用简单的背景色和图标组合模拟)
const DEFAULT_AVATARS = [
    { id: '1', color: 'bg-blue-500', label: '乾' },
    { id: '2', color: 'bg-red-500', label: '离' },
    { id: '3', color: 'bg-green-500', label: '震' },
    { id: '4', color: 'bg-yellow-500', label: '坤' },
    { id: '5', color: 'bg-purple-500', label: '巽' },
    { id: '6', color: 'bg-gray-500', label: '坎' },
];

export const ProfileEditModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, setAuth } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.updateUserMe({ 
        nickname,
        avatar_url: avatarUrl 
      });
      const token = localStorage.getItem('token') || '';
      setAuth(res.data, token);
      onClose();
    } catch (err) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                    编辑个人资料
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center shadow-inner text-white text-2xl font-bold transition-all border-4 border-white ring-2 ring-gray-50",
                        DEFAULT_AVATARS.find(a => a.id === avatarUrl)?.color || 'bg-violet-100 text-brand-primary'
                    )}>
                      {DEFAULT_AVATARS.find(a => a.id === avatarUrl)?.label || <User size={40} />}
                    </div>
                    
                    <div className="grid grid-cols-6 gap-2">
                        {DEFAULT_AVATARS.map((av) => (
                            <button
                                key={av.id}
                                type="button"
                                onClick={() => setAvatarUrl(av.id)}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:scale-110",
                                    av.color,
                                    avatarUrl === av.id ? "ring-2 ring-offset-2 ring-brand-primary" : "opacity-60"
                                )}
                            >
                                {avatarUrl === av.id && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">选择您的命理化身</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">昵称</label>
                    <input
                      type="text"
                      required
                      placeholder="设置您的雅号"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <Save size={18} />
                    {loading ? '正在保存...' : '保存更改'}
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};