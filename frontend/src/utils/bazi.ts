// 五行配色与辅助函数
export const getElementColorClass = (char: string): string => {
  const map: Record<string, string> = {
    // 木 (Wood) - Green
    '甲': 'text-wuxing-wood', '乙': 'text-wuxing-wood',
    '寅': 'text-wuxing-wood', '卯': 'text-wuxing-wood',
    
    // 火 (Fire) - Red
    '丙': 'text-wuxing-fire', '丁': 'text-wuxing-fire',
    '巳': 'text-wuxing-fire', '午': 'text-wuxing-fire',
    
    // 土 (Earth) - Brown/Yellow
    '戊': 'text-wuxing-earth', '己': 'text-wuxing-earth',
    '辰': 'text-wuxing-earth', '戌': 'text-wuxing-earth',
    '丑': 'text-wuxing-earth', '未': 'text-wuxing-earth',
    
    // 金 (Metal) - Gold/Yellow
    '庚': 'text-wuxing-gold', '辛': 'text-wuxing-gold',
    '申': 'text-wuxing-gold', '酉': 'text-wuxing-gold',
    
    // 水 (Water) - Black/Blue
    '壬': 'text-wuxing-water', '癸': 'text-wuxing-water',
    '亥': 'text-wuxing-water', '子': 'text-wuxing-water',
  };

  return map[char] || 'text-ink-900';
};

export const getTenGodColorClass = (): string => {
    // Simply return a subtle secondary color for Ten Gods to avoid visual clutter
    return 'text-ink-500';
};