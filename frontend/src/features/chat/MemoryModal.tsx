import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Trash2, Brain } from 'lucide-react';
import { chatApi } from '../../api/chat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const MemoryModal: React.FC<Props> = ({ isOpen, onClose, sessionId }) => {
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFacts = async () => {
    try {
      setLoading(true);
      const res = await chatApi.getFacts(sessionId);
      setFacts(res.data);
    } catch (err) {
      console.error('Failed to fetch facts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFacts();
    }
  }, [isOpen, sessionId]);

  const handleDelete = async (id: string) => {
    try {
      await chatApi.deleteFact(id);
      setFacts(facts.filter(f => f.id !== id));
    } catch (err) {
      alert('删除失败');
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                    <Brain className="text-brand-primary" /> AI 事实记忆
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    这是 AI 从咨询过程中提取的关于该档案的事实信息，用于长期分析参考。您可以手动删除不准确的信息。
                  </p>

                  {loading ? (
                    <p className="text-center py-8 text-gray-400">加载中...</p>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {facts.map((fact) => (
                        <div key={fact.id} className="group bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-start">
                          <p className="text-sm text-gray-700">{fact.content}</p>
                          <button 
                            onClick={() => handleDelete(fact.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {facts.length === 0 && (
                        <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl">
                          暂无记忆事实
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    关闭
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
