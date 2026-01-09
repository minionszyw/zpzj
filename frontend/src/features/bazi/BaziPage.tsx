import React, { useEffect, useState } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { BaziChart } from './BaziChart';
import { FortuneSection } from './FortuneSection';
import { User, ChevronDown, CalendarDays } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const BaziPage: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [baziData, setBaziData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    archiveApi.list().then((res) => {
      setArchives(res.data);
      if (res.data.length > 0) {
        // Try to find "self" or just take the first one
        const self = res.data.find(a => a.is_self);
        setSelectedArchiveId(self ? self.id : res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedArchiveId) {
      setLoading(true);
      archiveApi.getBazi(selectedArchiveId).then((res) => {
        setBaziData(res.data);
      }).finally(() => {
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
            <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <User className="h-4 w-4 text-brand-primary" />
              {selectedArchive?.name || '选择档案'}
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
            <Menu.Items className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {archives.map((archive) => (
                  <Menu.Item key={archive.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedArchiveId(archive.id)}
                        className={cn(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full text-left px-4 py-2 text-sm',
                          selectedArchiveId === archive.id && 'font-bold text-brand-primary'
                        )}
                      >
                        {archive.name} {archive.is_self && '(自己)'}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        
        <span className="text-xs text-gray-400">
          {selectedArchive?.location_name}
        </span>
      </div>

      {/* Bazi Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400 animate-pulse">
            正在排盘...
          </div>
        ) : baziData ? (
          <>
            <BaziChart data={baziData} />
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-primary" /> 运程分析 (大运/流年/流月)
              </h3>
              <FortuneSection fortune={baziData.fortune} />
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-400">
            暂无档案数据
          </div>
        )}
      </div>
    </div>
  );
};
