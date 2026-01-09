import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { X, Check, ChevronsUpDown, Search } from 'lucide-react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';

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
  });
  
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
      setFormData({
        name: archive.name,
        gender: archive.gender,
        birth_time: archive.birth_time.slice(0, 16),
        calendar_type: archive.calendar_type,
        lat: archive.lat,
        lng: archive.lng,
        location_name: archive.location_name,
        relation: archive.relation || '',
        is_self: archive.is_self,
      });
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
      });
      setQuery('北京市');
    }
  }, [archive, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (archive) {
        await archiveApi.update(archive.id, formData);
      } else {
        await archiveApi.create(formData);
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
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                    {archive ? '编辑档案' : '新建档案'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">姓名</label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">性别</label>
                      <select
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                      >
                        <option value={1}>男</option>
                        <option value={0}>女</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">历法</label>
                      <select
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                        value={formData.calendar_type}
                        onChange={(e) => setFormData({ ...formData, calendar_type: e.target.value })}
                      >
                        <option value="SOLAR">公历</option>
                        <option value="LUNAR">农历</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">出生时间</label>
                    <input
                      type="datetime-local"
                      step="1"
                      required
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                      value={formData.birth_time}
                      onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">出生地点 (真太阳时计算关键)</label>
                    <Combobox
                      value={formData.location_name}
                      onChange={(val: any) => {
                        if (typeof val === 'string') return;
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
                        <div className="relative w-full cursor-default overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left shadow-inner focus-within:ring-2 focus-within:ring-brand-primary sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-3 pl-10 pr-10 text-sm leading-5 text-gray-900 bg-transparent focus:ring-0"
                            displayValue={(name: string) => name}
                            onChange={(event) => setQuery(event.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </div>
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setQuery('')}
                        >
                          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50 border border-gray-100">
                            {searching ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                                    正在搜索...
                                </div>
                            ) : searchResults.length === 0 && query !== '' ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                未找到匹配地点
                              </div>
                            ) : (
                              searchResults.map((loc) => (
                                <Combobox.Option
                                  key={loc.display_name}
                                  className={({ active }) =>
                                    cn(
                                      'relative cursor-default select-none py-2.5 pl-10 pr-4',
                                      active ? 'bg-violet-50 text-brand-primary' : 'text-gray-900'
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
                                            active ? 'text-brand-primary' : 'text-brand-primary'
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
                    <div className="mt-1 flex gap-2 text-[10px] text-gray-400 font-mono">
                        <span>Lat: {formData.lat.toFixed(4)}</span>
                        <span>Lng: {formData.lng.toFixed(4)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">关系 (如：朋友、客户)</label>
                    <input
                      type="text"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-inner focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-3 border"
                      placeholder="例如：自己、母亲、合伙人"
                      value={formData.relation}
                      onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      id="is_self"
                      className="h-5 w-5 text-brand-primary focus:ring-brand-primary border-gray-300 rounded-lg shadow-sm"
                      checked={formData.is_self}
                      onChange={(e) => setFormData({ ...formData, is_self: e.target.checked })}
                    />
                    <label htmlFor="is_self" className="text-sm font-medium text-gray-700">这是我的档案</label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {loading ? '正在保存...' : '保存档案'}
                    </button>
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
