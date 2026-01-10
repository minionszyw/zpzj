import React from 'react';
import { cn } from '../../utils/cn';
import { getElementColorClass } from '../../utils/bazi';
import { Card } from '../../components/ui/Card';

interface Props {
  data: any;
}

export const BaziChart: React.FC<Props> = ({ data }) => {
  const { core } = data;
  if (!core) return null;

  const pillars = [
    { ...core.year, label: '年柱' },
    { ...core.month, label: '月柱' },
    { ...core.day, label: '日柱', isDayMaster: true },
    { ...core.time, label: '时柱' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 
        Sticky Header Container for Mobile 
        On mobile, this grid stays sticky at top when scrolling.
        On desktop, it's just part of the flow.
      */}
      <div className="sticky top-14 md:top-0 z-30 bg-paper-light/95 backdrop-blur-sm border-b border-ink-100 pb-2 md:pb-0 md:border-none md:static md:bg-transparent -mx-4 px-4 md:mx-0 md:px-0 transition-all">
        <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
            {pillars.map((p, i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] text-ink-500 font-serif mb-1">{p.label}</span>
                    {/* Ten God (Gan) */}
                    <span className="text-[10px] text-ink-400 mb-0.5 scale-90">{p.shi_shen_gan}</span>
                    {/* Gan */}
                    <span className={cn(
                        "text-2xl font-serif font-bold leading-none", 
                        getElementColorClass(p.gan),
                        p.isDayMaster && "ring-2 ring-brand-accent/20 rounded px-1"
                    )}>
                        {p.gan}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* The rest of the chart (Earthly Branches & Hidden Stems) - Scrolls under the sticky header on mobile */}
      <Card className="p-4 pt-2">
         <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
             {pillars.map((p, i) => (
                 <div key={i} className="flex flex-col items-center gap-2">
                     {/* Zhi */}
                     <span className={cn("text-2xl font-serif font-bold leading-none mt-1", getElementColorClass(p.zhi))}>
                         {p.zhi}
                     </span>
                     
                     {/* Hidden Stems Group */}
                     <div className="flex flex-col gap-1 w-full items-center bg-ink-50/50 rounded p-2 min-h-[80px]">
                        {p.hide_gan.map((gan: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 w-full justify-center">
                                <span className={cn("text-sm font-medium", getElementColorClass(gan))}>{gan}</span>
                                <span className="text-[10px] text-ink-400 scale-90">{p.shi_shen_zhi[idx]}</span>
                            </div>
                        ))}
                     </div>

                     {/* Na Yin */}
                     <span className="text-[10px] text-ink-400 border border-ink-100 rounded-full px-2 py-0.5 mt-1">
                        {p.na_yin}
                     </span>
                 </div>
             ))}
         </div>

         {/* Meta Info */}
         <div className="mt-6 pt-4 border-t border-ink-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
                <div className="flex gap-2">
                    <span className="text-ink-400">公历</span>
                    <span className="font-mono text-ink-700">{data.birth_solar_datetime}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-ink-400">农历</span>
                    <span className="font-mono text-ink-700">{data.birth_lunar_datetime}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-start justify-start md:justify-end">
                {data.geju && (
                    <span className="px-2 py-0.5 bg-ink-900 text-white text-xs rounded-sm font-serif">
                        {data.geju.name}
                    </span>
                )}
                {data.stars?.map((star: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 border border-ink-200 text-ink-500 text-[10px] rounded-sm">
                        {star.name}
                    </span>
                ))}
            </div>
         </div>
      </Card>
    </div>
  );
};
