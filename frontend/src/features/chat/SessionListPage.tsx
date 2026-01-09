import React, { useEffect, useState } from 'react';
import { chatApi } from '../../api/chat';
import type { ChatSession } from '../../api/chat';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { Plus, MessageSquare, Trash2, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const SessionListPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionRes, archiveRes] = await Promise.all([
        chatApi.listSessions(),
        archiveApi.list()
      ]);
      setSessions(sessionRes.data);
      setArchives(archiveRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (archiveId: string) => {
    try {
      const res = await chatApi.createSession(archiveId);
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      alert('创建会话失败');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个会话吗？')) {
      try {
        await chatApi.deleteSession(id);
        setSessions(sessions.filter(s => s.id !== id));
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const getArchiveName = (id: string) => {
    return archives.find(a => a.id === id)?.name || '未知档案';
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">咨询历史</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white p-2 rounded-full shadow-lg hover:bg-violet-700 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">加载中...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => navigate(`/chat/${session.id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-brand-primary/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-violet-50 text-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{session.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User size={12} /> {getArchiveName(session.archive_id)}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(session.created_at), 'MM-dd HH:mm')}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
              <p>暂无咨询记录，点击上方按钮发起</p>
            </div>
          )}
        </div>
      )}

      {/* Archive Selector Modal */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 mb-4">
                    选择咨询对象
                  </Dialog.Title>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {archives.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleCreateSession(a.id)}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-violet-50 hover:text-brand-primary transition-colors border border-gray-50 flex items-center gap-2"
                      >
                        <User size={16} />
                        <span className="font-medium">{a.name}</span>
                        {a.is_self && <span className="text-[10px] bg-violet-100 px-1.5 py-0.5 rounded ml-auto">自己</span>}
                      </button>
                    ))}
                    {archives.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        请先在“我的”页面添加档案
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      取消
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
