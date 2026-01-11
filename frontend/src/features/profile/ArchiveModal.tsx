import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition, Combobox, Disclosure } from '@headlessui/react';
import { X, Check, ChevronsUpDown, Search, ChevronRight, Settings2, Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { zhCN } from 'date-fns/locale/zh-CN';
import "react-datepicker/dist/react-datepicker.css";
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// 注册中文语言包
registerLocale('zh-CN', zhCN);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  archive?: Archive;
  onSuccess: () => void;
}

export const ArchiveModal: React.FC<Props> = ({ isOpen, onClose, archive, onSuccess }) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    gender: 1,
    birth_time: '',
    calendar_type: 'SOLAR',
    lat: 39.9042,
    lng: 116.4074,
    location_name: '北京市',
    relation: '',
    is_self: false,
    algorithms_config: {
        time_mode: 'TRUE_SOLAR',
        month_mode: 'SOLAR_TERM',
        zi_shi_mode: 'LATE_ZI_IN_DAY'
    }
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (debouncedQuery) {
      setSearching(true);
      archiveApi.searchLocations(debouncedQuery).then(res => {
        setSearchResults(res.data);
      }).finally(() => {
        setSearching(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (archive) {
      const bDate = new Date(archive.birth_time);
      setFormData({
        name: archive.name,
        gender: archive.gender,
        birth_time: archive.birth_time,
        calendar_type: archive.calendar_type,
        lat: archive.lat,
        lng: archive.lng,
        location_name: archive.location_name,
        relation: archive.relation || '',
        is_self: archive.is_self,
        // Ensure default values if missing
        algorithms_config: {
            time_mode: 'TRUE_SOLAR',
            month_mode: 'SOLAR_TERM',
            zi_shi_mode: 'LATE_ZI_IN_DAY',
            ...(archive as any).algorithms_config
        }
      });
      setSelectedDate(bDate);
      setQuery(archive.location_name);
    } else {
      setFormData({
        name: '',
        gender: 1,
        birth_time: '',
        calendar_type: 'SOLAR',
        lat: 39.9042,
        lng: 116.4074,
        location_name: '北京市',
        relation: '',
        is_self: false,
        algorithms_config: {
            time_mode: 'TRUE_SOLAR',
            month_mode: 'SOLAR_TERM',
            zi_shi_mode: 'LATE_ZI_IN_DAY'
        }
      });
      setSelectedDate(null);
      setQuery('北京市');
    }
  }, [archive, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
        alert('请选择出生时间');
        return;
    }
    
    // 格式化为后端需要的字符串
    const payload = {
        ...formData,
        birth_time: selectedDate.toISOString()
    };

    try {
      setLoading(true);
      if (archive) {
        await archiveApi.update(archive.id, payload);
      } else {
        await archiveApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-paper-light dark:bg-stone-900 p-6 shadow-2xl transition-all border border-ink-100 dark:border-ink-800">
                <div className="flex justify-between items-center mb-6 border-b border-ink-100 dark:border-ink-800 pb-4">
                  <Dialog.Title as="h3" className="text-lg font-bold font-serif text-ink-900 dark:text-ink-100">
                    {archive ? '编辑档案' : '新建档案'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-ink-400 hover:text-ink-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-2">姓名</label>
                    <Input
                      required
                      variant="outline"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-500 uppercase mb-2">性别</label>
                      <select
                        className="block w-full rounded-md border border-ink-200 bg-white dark:bg-stone-800 dark:border-ink-700 shadow-sm focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2.5 outline-none text-ink-900 dark:text-ink-100"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                      >
                        <option value={1}>男</option>
                        <option value={0}>女</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-500 uppercase mb-2">历法</label>
                      <select
                        className="block w-full rounded-md border border-ink-200 bg-white dark:bg-stone-800 dark:border-ink-700 shadow-sm focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2.5 outline-none text-ink-900 dark:text-ink-100"
                        value={formData.calendar_type}
                        onChange={(e) => setFormData({ ...formData, calendar_type: e.target.value })}
                      >
                        <option value="SOLAR">公历</option>
                        <option value="LUNAR">农历</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-2">出生时间</label>
                    <div className="relative">
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="时间"
                            dateFormat="yyyy-MM-dd HH:mm"
                            locale="zh-CN"
                            placeholderText="点击选择出生时间"
                            required
                            className="block w-full rounded-md border border-ink-200 bg-white dark:bg-stone-800 dark:border-ink-700 shadow-sm focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2.5 outline-none text-ink-900 dark:text-ink-100 pl-10"
                            wrapperClassName="w-full"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Calendar size={16} className="text-ink-400" />
                        </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-2">出生地点 (自动校正真太阳时)</label>
                    <Combobox
                      value={searchResults.find(l => l.display_name === formData.location_name) || { display_name: formData.location_name, lat: formData.lat, lng: formData.lng }}
                      onChange={(val: any) => {
                        if (!val) return;
                        setFormData({
                          ...formData,
                          location_name: val.display_name,
                          lat: val.lat,
                          lng: val.lng
                        });
                        setQuery(val.display_name);
                      }}
                    >
                      <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-ink-200 bg-white dark:bg-stone-800 dark:border-ink-700 text-left shadow-sm focus-within:ring-1 focus-within:ring-brand-accent focus-within:border-brand-accent sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-2.5 pl-10 pr-10 text-sm leading-5 text-ink-900 dark:text-ink-100 bg-transparent focus:ring-0 outline-none"
                            displayValue={(loc: any) => loc?.display_name || loc || ''}
                            onChange={(event) => setQuery(event.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-ink-400" aria-hidden="true" />
                          </div>
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setQuery('')}
                        >
                          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-stone-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50 border border-ink-100 dark:border-ink-700">
                            {searching ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-ink-500 italic">
                                    正在搜索...
                                </div>
                            ) : searchResults.length === 0 && query !== '' ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-ink-500">
                                未找到匹配地点
                              </div>
                            ) : (
                              searchResults.map((loc) => (
                                <Combobox.Option
                                  key={loc.display_name}
                                  className={({ active }) =>
                                    cn(
                                      'relative cursor-default select-none py-2.5 pl-10 pr-4',
                                      active ? 'bg-ink-50 dark:bg-stone-700 text-brand-accent' : 'text-ink-900 dark:text-ink-100'
                                    )
                                  }
                                  value={loc}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-bold' : 'font-normal')}>
                                        {loc.display_name}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={cn(
                                            'absolute inset-y-0 left-0 flex items-center pl-3',
                                            active ? 'text-brand-accent' : 'text-brand-accent'
                                          )}
                                        >
                                          <Check className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                    <div className="mt-1 flex gap-4 text-[10px] text-ink-400 font-mono pl-1">
                        <span>Lat: {formData.lat.toFixed(4)}</span>
                        <span>Lng: {formData.lng.toFixed(4)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-2">关系 (如：朋友、客户)</label>
                    <Input
                      variant="outline"
                      placeholder="例如：自己、母亲、合伙人"
                      value={formData.relation}
                      onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                      className="bg-white dark:bg-stone-800"
                    />
                  </div>

                  {/* Advanced Settings Disclosure */}
                  <div className="py-2">
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-ink-50 dark:bg-stone-800 px-4 py-3 text-left text-sm font-medium hover:bg-ink-100 dark:hover:bg-stone-700 focus:outline-none transition-all">
                            <span className="flex items-center gap-2 font-bold text-xs uppercase text-ink-500">
                                <Settings2 size={14} /> 命理算法偏好 (高级)
                            </span>
                            <ChevronRight
                              className={cn("h-4 w-4 text-ink-400 transition-transform", open && "rotate-90")}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-ink-500 space-y-4 border-x border-b border-ink-100 dark:border-ink-800 rounded-b-lg -mt-1 bg-white dark:bg-stone-900/50">
                            <div>
                                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">时间模式</label>
                                <select
                                    className="block w-full rounded border-ink-200 dark:border-ink-700 bg-white dark:bg-stone-800 text-xs p-2 border outline-none"
                                    value={formData.algorithms_config.time_mode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        algorithms_config: { ...formData.algorithms_config, time_mode: e.target.value }
                                    })}
                                >
                                    <option value="TRUE_Solar">真太阳时 (推荐)</option>
                                    <option value="MEAN_Solar">平太阳时 (北京时间)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">定月模式</label>
                                <select
                                    className="block w-full rounded border-ink-200 dark:border-ink-700 bg-white dark:bg-stone-800 text-xs p-2 border outline-none"
                                    value={formData.algorithms_config.month_mode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        algorithms_config: { ...formData.algorithms_config, month_mode: e.target.value }
                                    })}
                                >
                                    <option value="Solar_TERM">节气定月 (推荐)</option>
                                    <option value="LUNAR_MONTH">农历月定月</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">子时模式</label>
                                <select
                                    className="block w-full rounded border-ink-200 dark:border-ink-700 bg-white dark:bg-stone-800 text-xs p-2 border outline-none"
                                    value={formData.algorithms_config.zi_shi_mode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        algorithms_config: { ...formData.algorithms_config, zi_shi_mode: e.target.value }
                                    })}
                                >
                                    <option value="LATE_ZI_IN_DAY">晚子时不换日 (推荐)</option>
                                    <option value="NEXT_DAY">23点换日 (早晚子时皆换日)</option>
                                </select>
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      id="is_self"
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-ink-300 rounded"
                      checked={formData.is_self}
                      onChange={(e) => setFormData({ ...formData, is_self: e.target.checked })}
                    />
                    <label htmlFor="is_self" className="text-sm font-medium text-ink-700 dark:text-ink-300">这是我的档案</label>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      fullWidth
                      size="lg"
                    >
                      {loading ? '正在保存...' : '保存档案'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};