import React, { useEffect, useState } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { BaziChart } from './BaziChart';
import { FortuneSection } from './FortuneSection';
import { User, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Card } from '../../components/ui/Card';

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
    <div className="flex flex-col gap-6 pb-20 md:pb-8">
      {/* Archive Selector - Not sticky on mobile to allow BaziChart header to stick */}
      <Card className="p-4 flex justify-between items-center z-40 relative overflow-visible">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100/50 transition-all border border-ink-200">
              <User className="h-4 w-4 text-brand-accent" />
              <span className="max-w-[120px] truncate font-serif">
                {selectedArchive?.name || '选择档案'}
              </span>
              <ChevronDown className="-mr-1 h-4 w-4 text-ink-400" aria-hidden="true" />
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
            <Menu.Items className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-md bg-white dark:bg-stone-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-ink-100 dark:border-ink-700">
              <div className="py-1">
                {archives.map((archive) => (
                  <Menu.Item key={archive.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedArchiveId(archive.id)}
                        className={cn(
                          active ? 'bg-ink-50 dark:bg-stone-700 text-brand-accent' : 'text-ink-700 dark:text-ink-200',
                          'block w-full text-left px-4 py-2 text-sm transition-colors',
                          selectedArchiveId === archive.id && 'font-bold bg-ink-50 dark:bg-stone-700 text-brand-accent font-serif'
                        )}
                      >
                        <div className="flex justify-between items-center">
                            <span>{archive.name}</span>
                            {archive.is_self && <span className="text-[9px] border border-brand-accent text-brand-accent px-1 rounded-sm scale-90">自己</span>}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
                {archives.length === 0 && (
                    <div className="px-4 py-2 text-xs text-ink-400">暂无档案，请在“我的”页面添加</div>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        
        <span className="text-xs text-ink-400 truncate max-w-[150px] font-mono">
          {selectedArchive?.location_name}
        </span>
      </Card>

      {/* Main Content Area */}
      <div className="min-h-[400px] flex flex-col gap-6">
        {loading && (
          <Card className="p-12 flex flex-col items-center justify-center gap-4 border-none shadow-none bg-transparent">
            <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin opacity-80"></div>
            <p className="text-sm text-ink-500 animate-pulse font-serif tracking-widest">推演中...</p>
          </Card>
        )}

        {error && !loading && (
          <Card className="p-8 flex flex-col items-center justify-center text-center gap-4 border-brand-accent/20 bg-brand-accent/5">
            <AlertCircle className="text-brand-accent w-10 h-10 opacity-80" />
            <p className="text-sm text-ink-600 font-medium">{error}</p>
            <button 
                onClick={() => setSelectedArchiveId(selectedArchiveId)}
                className="mt-2 text-xs text-brand-accent font-bold hover:underline"
            >
                重试
            </button>
          </Card>
        )}

        {!loading && !error && baziData && (
          <>
            <BaziChart data={baziData} />
            
            <FortuneSection fortune={baziData.fortune} />
          </>
        )}

        {!loading && !error && !baziData && !selectedArchiveId && (
          <Card className="p-20 flex flex-col items-center justify-center text-center gap-4 text-ink-300 border-dashed">
            <User size={48} className="opacity-20" />
            <p className="text-sm">尚未选择或创建档案</p>
          </Card>
        )}
      </div>
    </div>
  );
};
