import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { getElementColorClass } from '../../utils/bazi';
import { ChevronRight, ChevronDown, CalendarDays, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface Props {
  fortune: any;
}

export const FortuneSection: React.FC<Props> = ({ fortune }) => {
  const { da_yun } = fortune;
  const [expandedDaYun, setExpandedDaYun] = useState<number | null>(null);
  const [selectedLiuNian, setSelectedLiuNian] = useState<any | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-serif font-bold text-ink-900 flex items-center gap-2">
        <span className="w-1 h-4 bg-brand-accent rounded-full"></span>
        大运流年
      </h3>
      
      <div className="space-y-3">
        {da_yun.map((dy: any) => (
          <Card key={dy.index} className={cn(
              "transition-all duration-300",
              expandedDaYun === dy.index ? "ring-1 ring-ink-200 shadow-md" : "hover:shadow-md"
          )} bordered={true}>
            <button
              onClick={() => setExpandedDaYun(expandedDaYun === dy.index ? null : dy.index)}
              className={cn(
                "w-full flex items-center justify-between p-4 bg-white dark:bg-stone-900 transition-colors rounded-xl",
                expandedDaYun === dy.index && "bg-ink-50 dark:bg-stone-800"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Pillar Box */}
                <div className="flex flex-col items-center justify-center bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700 rounded-lg w-12 h-14 shadow-sm">
                  <span className="text-[10px] text-ink-400 leading-none mb-1">{dy.start_age}岁</span>
                  <div className="flex flex-col leading-none items-center gap-0.5">
                      <span className={cn("text-sm font-serif font-bold", getElementColorClass(dy.gan_zhi[0]))}>{dy.gan_zhi[0]}</span>
                      <span className={cn("text-sm font-serif font-bold", getElementColorClass(dy.gan_zhi[1]))}>{dy.gan_zhi[1]}</span>
                  </div>
                </div>
                
                {/* Info */}
                <div className="text-left">
                  <p className="text-sm font-bold text-ink-900 dark:text-ink-100 font-mono tracking-tight">
                    {dy.start_year} <span className="text-ink-300 mx-1">~</span> {dy.start_year + 9}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">大运 {dy.index}</p>
                </div>
              </div>
              
              {expandedDaYun === dy.index ? <ChevronDown className="text-ink-400" /> : <ChevronRight className="text-ink-400" />}
            </button>

            {/* Liu Nian Grid */}
            {expandedDaYun === dy.index && (
              <div className="p-4 border-t border-ink-100 dark:border-ink-700 bg-white dark:bg-stone-900 grid grid-cols-5 gap-2 animate-in slide-in-from-top-2 duration-200">
                {dy.liu_nian.map((ln: any) => (
                  <button
                    key={ln.year}
                    onClick={() => setSelectedLiuNian(ln)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg border transition-all",
                      selectedLiuNian?.year === ln.year 
                        ? "border-brand-accent bg-brand-accent/5 text-ink-900 shadow-sm scale-105 z-10" 
                        : "border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-stone-800 hover:border-ink-300"
                    )}
                  >
                    <span className="text-[10px] text-ink-500 mb-1">{ln.year}</span>
                    <span className={cn("font-bold text-sm font-serif", getElementColorClass(ln.gan_zhi))}>
                      {ln.gan_zhi}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Liu Yue Modal (Full Screen Overlay on Mobile, Modal on Desktop) */}
      {selectedLiuNian && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLiuNian(null)} />
          
          <div className="relative w-full max-w-lg bg-paper-light dark:bg-stone-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-ink-100 dark:border-ink-700 flex justify-between items-center bg-white/50 dark:bg-stone-800/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2 font-serif">
                  <CalendarDays className="text-brand-accent w-5 h-5" /> 
                  <span>{selectedLiuNian.year} {selectedLiuNian.gan_zhi}年</span>
                </h3>
                <p className="text-xs text-ink-500">流月推演</p>
              </div>
              <button 
                onClick={() => setSelectedLiuNian(null)} 
                className="p-2 text-ink-400 hover:text-ink-900 bg-ink-100/50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid Content */}
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto bg-paper-light dark:bg-stone-900">
              {selectedLiuNian.liu_yue.map((ly: any) => (
                <div key={ly.month} className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-stone-800 border border-ink-100 dark:border-ink-700 shadow-sm">
                  <span className="text-[10px] text-ink-400 mb-1">{ly.month}月</span>
                  <div className="flex items-center gap-1">
                      <span className={cn("text-xl font-bold font-serif", getElementColorClass(ly.gan_zhi[0]))}>
                        {ly.gan_zhi[0]}
                      </span>
                      <span className={cn("text-xl font-bold font-serif", getElementColorClass(ly.gan_zhi[1]))}>
                        {ly.gan_zhi[1]}
                      </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-ink-50 dark:bg-stone-950 text-center border-t border-ink-100 dark:border-ink-800">
              <p className="text-[10px] text-ink-400 font-serif italic">天道循环，周而复始</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};