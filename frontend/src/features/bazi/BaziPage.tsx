import React, { useEffect, useState } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { BaziChart } from './BaziChart';
import { FortuneSection } from './FortuneSection';
import { User, ChevronDown, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const BaziPage: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [baziData, setBaziData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    archiveApi.list().then((res) => {
      setArchives(res.data);
      if (res.data.length > 0) {
        const self = res.data.find(a => a.is_self);
        setSelectedArchiveId(self ? self.id : res.data[0].id);
      }
    }).catch(err => {
      console.error('Failed to load archives', err);
      setError('无法加载档案列表');
    });
  }, []);

  useEffect(() => {
    if (selectedArchiveId) {
      setLoading(true);
      setError(null);
      setBaziData(null); // Clear previous data while loading
      
      archiveApi.getBazi(selectedArchiveId)
        .then((res) => {
          if (res.data && res.data.core) {
            setBaziData(res.data);
          } else {
            setError('返回的命盘数据格式不正确');
          }
        })
        .catch(err => {
          console.error('Failed to get bazi data', err);
          setError(err.response?.data?.detail || '获取排盘数据失败，请检查档案信息是否完整');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedArchiveId]);

  const selectedArchive = archives.find(a => a.id === selectedArchiveId);

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-8">
      {/* Archive Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all">
              <User className="h-4 w-4 text-brand-primary" />
              <span className="max-w-[120px] truncate">
                {selectedArchive?.name || '选择档案'}
              </span>
              <ChevronDown className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
              <div className="py-1">
                {archives.map((archive) => (
                  <Menu.Item key={archive.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedArchiveId(archive.id)}
                        className={cn(
                          active ? 'bg-violet-50 text-brand-primary' : 'text-gray-700',
                          'block w-full text-left px-4 py-2 text-sm transition-colors',
                          selectedArchiveId === archive.id && 'font-bold bg-violet-50 text-brand-primary'
                        )}
                      >
                        <div className="flex justify-between items-center">
                            <span>{archive.name}</span>
                            {archive.is_self && <span className="text-[9px] bg-brand-primary text-white px-1 rounded">自己</span>}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
                {archives.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400">暂无档案，请在“我的”页面添加</div>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        
        <span className="text-xs text-gray-400 truncate max-w-[150px]">
          {selectedArchive?.location_name}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px] flex flex-col gap-4">
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 animate-pulse font-medium">正在进行高精度排盘...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="text-red-500 w-12 h-12 opacity-50" />
            <p className="text-sm text-gray-600 font-medium">{error}</p>
            <button 
                onClick={() => setSelectedArchiveId(selectedArchiveId)}
                className="mt-2 text-xs text-brand-primary font-bold hover:underline"
            >
                重试
            </button>
          </div>
        )}

        {!loading && !error && baziData && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <BaziChart data={baziData} />
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                <CalendarDays className="h-5 w-5 text-brand-primary" />
                <h3 className="text-sm font-bold text-gray-800">运程分析 (大运/流年/流月)</h3>
              </div>
              <FortuneSection fortune={baziData.fortune} />
            </div>
          </>
        )}

        {!loading && !error && !baziData && !selectedArchiveId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 flex flex-col items-center justify-center text-center gap-4 text-gray-400">
            <User size={48} className="opacity-10" />
            <p className="text-sm">尚未选择或创建档案</p>
          </div>
        )}
      </div>
    </div>
  );
};