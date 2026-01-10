import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Save, Check } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { AVATAR_MAP, UserAvatar } from '../../components/UserAvatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, setAuth } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatar_url || '1');
    }
  }, [isOpen, user]);

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
          <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-paper-light dark:bg-stone-900 p-6 shadow-2xl transition-all border border-ink-100 dark:border-ink-800">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-bold font-serif text-ink-900 dark:text-ink-100">
                    编辑个人资料
                  </Dialog.Title>
                  <button onClick={onClose} className="text-ink-400 hover:text-ink-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex flex-col items-center gap-6">
                    {/* Preview Large */}
                    <div className="relative group">
                        <UserAvatar 
                            avatarUrl={avatarUrl} 
                            size="xl" 
                            className="w-24 h-24 shadow-lg ring-4 ring-white dark:ring-stone-800" 
                        />
                    </div>
                    
                    {/* Selection Grid */}
                    <div className="grid grid-cols-6 gap-3">
                        {Object.entries(AVATAR_MAP).map(([key, config]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setAvatarUrl(key)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm overflow-hidden border border-ink-100",
                                    avatarUrl === key 
                                        ? "ring-2 ring-offset-2 ring-brand-accent scale-110 z-10" 
                                        : "opacity-70 hover:opacity-100 grayscale-[0.3]"
                                )}
                            >
                                <img src={config.src} alt={config.label} className="w-full h-full object-cover" />
                                {avatarUrl === key && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <Check size={16} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-ink-400 uppercase font-bold tracking-widest">选择您的命理化身</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-2">昵称</label>
                    <Input
                      required
                      variant="outline"
                      placeholder="设置您的雅号"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-white dark:bg-stone-800"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    fullWidth
                    className="gap-2"
                  >
                    <Save size={18} />
                    {loading ? '正在保存...' : '保存更改'}
                  </Button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};