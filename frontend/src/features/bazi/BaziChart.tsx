import React from 'react';
import { cn } from '../../utils/cn';

interface Props {
  data: any;
}

export const BaziChart: React.FC<Props> = ({ data }) => {
  const { core } = data;
  if (!core) return null;

  // Let's use Year, Month, Day, Hour from left to right for better readability on screen.
  const displayPillars = [core.year, core.month, core.day, core.time];
  const labels = ['年柱', '月柱', '日柱', '时柱'];

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
    <div className="w-full overflow-x-auto">
      <div className="min-w-[400px] grid grid-cols-4 gap-2">
        {displayPillars.map((pillar, i) => (
          <div key={i} className="flex flex-col items-center border rounded-lg p-2 bg-gray-50">
            <span className="text-xs text-gray-400 mb-1">{labels[i]}</span>
            
            {/* Ten Gods (Gan) */}
            <span className="text-xs font-medium text-violet-500 mb-1">{pillar.shi_shen_gan}</span>
            
            {/* Heavenly Stem */}
            <span className={cn("text-2xl font-bold mb-1", getElementColor(pillar.gan))}>
              {pillar.gan}
            </span>
            
            {/* Earthly Branch */}
            <span className={cn("text-2xl font-bold mb-1", getElementColor(pillar.zhi))}>
              {pillar.zhi}
            </span>
            
            {/* Ten Gods (Zhi) */}
            <div className="flex flex-col items-center gap-0.5 mt-1">
              {pillar.shi_shen_zhi.map((s: string, j: number) => (
                <span key={j} className="text-[10px] text-gray-500 leading-none">{s}</span>
              ))}
            </div>

            {/* Hidden Stems */}
            <div className="mt-2 flex gap-1">
              {pillar.hide_gan.map((g: string, j: number) => (
                <span key={j} className={cn("text-xs", getElementColor(g))}>{g}</span>
              ))}
            </div>

            {/* Na Yin */}
            <span className="text-[10px] text-gray-400 mt-2">{pillar.na_yin}</span>
          </div>
        ))}
      </div>
      
      {/* Additional Info */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-3">
        <div>
          <span className="text-gray-400 mr-2">公历:</span>
          {data.birth_solar_datetime}
        </div>
        <div>
          <span className="text-gray-400 mr-2">农历:</span>
          {data.birth_lunar_datetime}
        </div>
        {data.geju && (
          <div className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-xs font-bold">
            格局: {data.geju.name}
          </div>
        )}
      </div>
    </div>
  );
};
