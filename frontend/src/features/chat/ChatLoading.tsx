import React, { useState, useEffect } from 'react';

const LOADING_TEXTS = [
  "推演流年...",
  "查阅古籍...",
  "分析神煞...",
  "计算五行...",
  "定夺喜用..."
];

export const ChatLoading: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full gap-3 md:gap-4 mb-6 justify-start">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded border border-ink-200 bg-white flex items-center justify-center overflow-hidden">
             <div className="w-6 h-6 rounded-sm border border-brand-accent flex items-center justify-center rotate-45 scale-75 animate-pulse">
                 <span className="text-brand-accent font-serif font-bold -rotate-45 text-[10px]">真</span>
             </div>
        </div>
      </div>

      {/* Bubble */}
      <div className="bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3">
         <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce"></div>
         </div>
         <span className="text-sm text-ink-500 font-serif animate-fade-in transition-opacity duration-500 min-w-[80px]">
            {LOADING_TEXTS[textIndex]}
         </span>
      </div>
    </div>
  );
};
