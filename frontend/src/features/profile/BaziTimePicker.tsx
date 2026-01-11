import React, { useMemo } from 'react';

interface Props {
  value: string; // ISO string or naive string
  onChange: (value: string) => void;
}

export const BaziTimePicker: React.FC<Props> = ({ value, onChange }) => {
  const date = useMemo(() => value ? new Date(value) : new Date(), [value]);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = currentYear + 5; i >= 1900; i--) arr.push(i);
    return arr;
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const updateDate = (newParts: { y?: number; m?: number; d?: number; h?: number; min?: number }) => {
    const nY = newParts.y ?? year;
    const nM = newParts.m ?? month;
    const maxDays = new Date(nY, nM, 0).getDate();
    const nD = Math.min(newParts.d ?? day, maxDays);
    const nH = newParts.h ?? hour;
    const nMin = newParts.min ?? minute;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const naiveStr = `${nY}-${pad(nM)}-${pad(nD)}T${pad(nH)}:${pad(nMin)}:00`;
    onChange(naiveStr);
  };

  const selectClass = "bg-white dark:bg-stone-800 border-none text-sm text-ink-900 dark:text-ink-100 p-2 focus:ring-0 cursor-pointer appearance-none text-center w-full";

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-stone-800 border border-ink-200 dark:border-ink-700 rounded-md overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-brand-accent focus-within:border-brand-accent">
      <div className="flex-1 flex flex-col items-center border-r border-ink-100 dark:border-ink-700">
        <select value={year} onChange={(e) => updateDate({ y: parseInt(e.target.value) })} className={selectClass}>
          {years.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>
      <div className="w-16 flex flex-col items-center border-r border-ink-100 dark:border-ink-700">
        <select value={month} onChange={(e) => updateDate({ m: parseInt(e.target.value) })} className={selectClass}>
          {months.map(m => <option key={m} value={m}>{m}月</option>)}
        </select>
      </div>
      <div className="w-16 flex flex-col items-center border-r border-ink-100 dark:border-ink-700">
        <select value={day} onChange={(e) => updateDate({ d: parseInt(e.target.value) })} className={selectClass}>
          {days.map(d => <option key={d} value={d}>{d}日</option>)}
        </select>
      </div>
      <div className="w-16 flex flex-col items-center border-r border-ink-100 dark:border-ink-700">
        <select value={hour} onChange={(e) => updateDate({ h: parseInt(e.target.value) })} className={selectClass}>
          {hours.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}时</option>)}
        </select>
      </div>
      <div className="w-16 flex flex-col items-center">
        <select value={minute} onChange={(e) => updateDate({ min: parseInt(e.target.value) })} className={selectClass}>
          {minutes.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}分</option>)}
        </select>
      </div>
    </div>
  );
};