import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../utils/cn';

// 默认头像配置映射 (Oriental Ink Style - SVG Images)
export const AVATAR_MAP: Record<string, { src: string, label: string, color: string }> = {
    '1': { src: '/avatars/1.svg', label: '乾', color: 'bg-ink-100' },
    '2': { src: '/avatars/2.svg', label: '坤', color: 'bg-ink-100' },
    '3': { src: '/avatars/3.svg', label: '离', color: 'bg-ink-100' },
    '4': { src: '/avatars/4.svg', label: '坎', color: 'bg-ink-100' },
    '5': { src: '/avatars/5.svg', label: '震', color: 'bg-ink-100' },
    '6': { src: '/avatars/6.svg', label: '巽', color: 'bg-ink-100' },
};

interface UserAvatarProps {
  avatarUrl?: string; // This might be an ID ('1') or a real URL
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, className, size = 'md' }) => {
  // Check if it's a built-in ID
  const builtInAvatar = AVATAR_MAP[avatarUrl || ''];
  
  // Check if it's a real external URL (starts with http or / but not in our map)
  const isExternalUrl = avatarUrl && (avatarUrl.startsWith('http') || (avatarUrl.startsWith('/') && !builtInAvatar));

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div className={cn(
        "rounded-full flex items-center justify-center overflow-hidden font-bold font-serif transition-all shadow-sm bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700",
        sizeClasses[size],
        className
    )}>
      {builtInAvatar ? (
        <img src={builtInAvatar.src} alt={builtInAvatar.label} className="w-full h-full object-cover scale-110" />
      ) : isExternalUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-ink-50 text-ink-400">
            <User size={size === 'sm' ? 14 : size === 'md' ? 20 : 28} />
        </div>
      )}
    </div>
  );
};
