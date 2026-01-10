import React from 'react';

export const ChatLoading: React.FC = () => {
  return (
    <div className="flex w-full gap-3 md:gap-4 mb-6 justify-start">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-ink-200 bg-white flex items-center justify-center overflow-hidden">
             <div className="w-6 h-6 rounded-sm border border-brand-accent flex items-center justify-center rotate-45 scale-75 animate-pulse">
                 <span className="text-brand-accent font-serif font-bold -rotate-45 text-[10px]">真</span>
             </div>
        </div>
      </div>

      {/* Bubble */}
      <div className="bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center">
         <div className="flex space-x-1.5 px-2">
            <div className="w-1.5 h-1.5 bg-brand-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-brand-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-brand-accent/60 rounded-full animate-bounce"></div>
         </div>
      </div>
    </div>
  );
};
