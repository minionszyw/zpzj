import React from 'react';
import { cn } from '../../utils/cn';
import { getElementColorClass } from '../../utils/bazi';
import { Card } from '../../components/ui/Card';

interface Props {
  data: any;
}

export const BaziChart: React.FC<Props> = ({ data }) => {
  const { core, five_elements } = data;
  if (!core) return null;

  const pillars = [
    { ...core.year, label: '年柱' },
    { ...core.month, label: '月柱' },
    { ...core.day, label: '日柱', isDayMaster: true },
    { ...core.time, label: '时柱' },
  ];

  const wuxingOrder = ['木', '火', '土', '金', '水'];
  const wuxingColorMap: Record<string, string> = {
    '木': 'bg-wuxing-wood',
    '火': 'bg-wuxing-fire',
    '土': 'bg-wuxing-earth',
    '金': 'bg-wuxing-gold',
    '水': 'bg-wuxing-water',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 
        Combined Pillar Structure
      */}
      <Card className="p-6 relative overflow-hidden">
        {/* Background watermark style title */}
        <div className="absolute top-2 right-4 text-4xl font-serif font-black opacity-[0.03] pointer-events-none select-none">
          子平命盘
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
            {pillars.map((p, i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-[11px] text-ink-400 font-serif mb-2 pb-1 border-b border-ink-100 w-full">{p.label}</span>
                    
                    {/* Ten God (Gan) */}
                    <span className="text-[10px] text-ink-500 mb-1 h-4">{p.shi_shen_gan || (p.isDayMaster ? '日主' : '')}</span>
                    
                    {/* Gan & Zhi Combined */}
                    <div className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                        p.isDayMaster ? "bg-brand-accent/5 ring-1 ring-brand-accent/20" : "bg-ink-50/30"
                    )}>
                        <span className={cn("text-3xl md:text-4xl font-serif font-bold leading-none", getElementColorClass(p.gan))}>
                            {p.gan}
                        </span>
                        <span className={cn("text-3xl md:text-4xl font-serif font-bold leading-none", getElementColorClass(p.zhi))}>
                            {p.zhi}
                        </span>
                    </div>

                    {/* Na Yin */}
                    <span className="text-[10px] text-ink-400 mt-3 px-1.5 py-0.5 bg-white dark:bg-stone-800 border border-ink-100 rounded shadow-sm scale-90 whitespace-nowrap">
                        {p.na_yin}
                    </span>
                </div>
            ))}
        </div>

        {/* Hidden Stems Section */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 text-center mt-4 pt-4 border-t border-ink-50/50">
            {pillars.map((p, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    {p.hide_gan.map((gan: string, idx: number) => (
                        <div key={idx} className="flex flex-col items-center leading-tight">
                            <span className={cn("text-xs font-bold", getElementColorClass(gan))}>{gan}</span>
                            <span className="text-[9px] text-ink-400 scale-75 uppercase">{p.shi_shen_zhi[idx]}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </Card>

      {/* Five Elements Analysis */}
      {five_elements && (
        <Card className="p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-brand-accent"></div>
                <h3 className="text-sm font-bold text-ink-700">五行能量分析</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
                {wuxingOrder.map(name => {
                    const score = five_elements.scores[name] || 0;
                    const state = five_elements.states[name] || '-';
                    // Find max score for percentage calculation (simple normalization for UI)
                    const maxScore = Math.max(...Object.values(five_elements.scores) as number[]);
                    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                    return (
                        <div key={name} className="flex flex-col items-center gap-2">
                            <div className="w-full bg-ink-50 dark:bg-stone-800 rounded-full h-20 relative overflow-hidden flex flex-col justify-end">
                                <div 
                                    className={cn("w-full transition-all duration-1000", wuxingColorMap[name])}
                                    style={{ height: `${Math.max(percentage, 5)}%` }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-ink-900 mix-blend-overlay opacity-50">{name}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-ink-700">{score.toFixed(1)}</p>
                                <p className={cn(
                                    "text-[9px] px-1 rounded",
                                    state === '旺' ? "text-brand-accent bg-brand-accent/5 font-bold" : "text-ink-400"
                                )}>{state}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
      )}

      {/* Meta Info */}
      <Card className="p-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-bold text-ink-300 w-8">公历</span>
                    <span className="text-xs font-mono text-ink-700 bg-ink-50/50 px-2 py-0.5 rounded">{data.birth_solar_datetime}</span>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-[10px] uppercase font-bold text-ink-300 w-8 mt-1">农历</span>
                    <span className="text-xs text-ink-600 leading-relaxed flex-1">{data.birth_lunar_datetime}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-start justify-start md:justify-end pt-2 md:pt-0">
                {data.geju && (
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-ink-300 mb-1">格局</span>
                        <span className="px-2 py-1 bg-ink-900 text-white text-xs rounded-sm font-serif shadow-sm">
                            {data.geju.name}
                        </span>
                    </div>
                )}
                {data.stars && data.stars.length > 0 && (
                    <div className="flex flex-col items-end flex-1">
                        <span className="text-[9px] text-ink-300 mb-1">神煞</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                            {data.stars.map((star: any, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 border border-ink-100 text-ink-500 text-[10px] rounded-sm bg-white">
                                    {star.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
         </div>
      </Card>
    </div>
  );
};
