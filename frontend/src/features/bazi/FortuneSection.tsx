import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronRight, ChevronDown, CalendarDays } from 'lucide-react';

interface Props {
  fortune: any;
}

export const FortuneSection: React.FC<Props> = ({ fortune }) => {
  const { da_yun } = fortune;
  const [expandedDaYun, setExpandedDaYun] = useState<number | null>(null);
  const [selectedLiuNian, setSelectedLiuNian] = useState<any | null>(null);

  const getElementColor = (ganOrZhi: string) => {
    const elements: Record<string, string> = {
      '甲': 'text-green-600', '乙': 'text-green-600', '寅': 'text-green-600', '卯': 'text-green-600',
      '丙': 'text-red-600', '丁': 'text-red-600', '巳': 'text-red-600', '午': 'text-red-600',
      '戊': 'text-yellow-600', '己': 'text-yellow-600', '辰': 'text-yellow-600', '戌': 'text-yellow-600', '丑': 'text-yellow-600', '未': 'text-yellow-600',
      '庚': 'text-gray-500', '辛': 'text-gray-500', '申': 'text-gray-500', '酉': 'text-gray-500',
      '壬': 'text-blue-600', '癸': 'text-blue-600', '亥': 'text-blue-600', '子': 'text-blue-600',
    };
    return elements[ganOrZhi[0]] || 'text-gray-900';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {da_yun.map((dy: any) => (
          <div key={dy.index} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setExpandedDaYun(expandedDaYun === dy.index ? null : dy.index)}
              className={cn(
                "w-full flex items-center justify-between p-4 bg-white transition-colors",
                expandedDaYun === dy.index ? "bg-violet-50/50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-lg w-12 h-12 shadow-sm">
                  <span className="text-[10px] text-gray-400 leading-none mb-1">{dy.start_age}岁</span>
                  <span className={cn("text-lg font-bold leading-none", getElementColor(dy.gan_zhi))}>
                    {dy.gan_zhi}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{dy.start_year} - {dy.start_year + 9}</p>
                  <p className="text-[10px] text-gray-400">大运 {dy.index}</p>
                </div>
              </div>
              {expandedDaYun === dy.index ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
            </button>

            {expandedDaYun === dy.index && (
              <div className="p-4 bg-white border-t border-gray-50 grid grid-cols-5 gap-2">
                {dy.liu_nian.map((ln: any) => (
                  <button
                    key={ln.year}
                    onClick={() => setSelectedLiuNian(ln)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl border transition-all",
                      selectedLiuNian?.year === ln.year 
                        ? "border-brand-primary bg-violet-50 text-brand-primary shadow-sm scale-105 z-10" 
                        : "border-gray-100 bg-gray-50 hover:border-violet-200"
                    )}
                  >
                    <span className="text-[10px] mb-1">{ln.year}</span>
                    <span className={cn("font-bold text-sm", getElementColor(ln.gan_zhi))}>
                      {ln.gan_zhi}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Liu Yue Overlay / Drawer */}
      {selectedLiuNian && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLiuNian(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="text-brand-primary" /> {selectedLiuNian.year} {selectedLiuNian.gan_zhi}年
                </h3>
                <p className="text-xs text-gray-400">流月详情</p>
              </div>
              <button onClick={() => setSelectedLiuNian(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
              {selectedLiuNian.liu_yue.map((ly: any) => (
                <div key={ly.month} className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 mb-1">{ly.month}月</span>
                  <span className={cn("text-xl font-bold", getElementColor(ly.gan_zhi))}>
                    {ly.gan_zhi}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400 italic">基于《渊海子平》流月推算法计算</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
