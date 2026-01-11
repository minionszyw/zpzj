import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/useAuthStore';
import { UserAvatar } from '../../components/UserAvatar';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const user = useAuthStore(state => state.user);

  const isUser = role === 'user';

  return (
    <div className={cn("flex w-full gap-3 md:gap-4 mb-6", isUser ? "justify-end" : "justify-start")}>
      
      {/* Assistant Avatar (Left) */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-full border border-ink-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
             <div className="w-6 h-6 rounded-sm border border-brand-accent flex items-center justify-center rotate-45 scale-90">
                 <span className="text-brand-accent font-serif font-bold -rotate-45 text-[10px]">真</span>
             </div>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        "relative max-w-[85%] md:max-w-[75%] px-4 py-3 text-sm leading-relaxed shadow-sm",
        isUser 
            ? "bg-ink-900 text-white rounded-2xl rounded-tr-sm" 
            : "bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700 rounded-2xl rounded-tl-sm"
      )}>
        <div className={cn(
            "prose prose-sm max-w-none break-words",
            isUser ? "prose-invert" : "text-ink-900 dark:text-ink-100 prose-headings:font-serif prose-headings:text-ink-900 dark:prose-headings:text-ink-50 prose-strong:text-brand-accent"
        )}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      {/* User Avatar (Right) */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
             <UserAvatar avatarUrl={user?.avatar_url} size="md" />
        </div>
      )}
    </div>
  );
};