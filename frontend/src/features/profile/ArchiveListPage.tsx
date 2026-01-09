import React, { useEffect, useState } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { Plus, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { ArchiveModal } from './ArchiveModal';
import { format } from 'date-fns';

export const ArchiveListPage: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Archive | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const response = await archiveApi.list();
      setArchives(response.data);
    } catch (err) {
      console.error('Failed to fetch archives', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleCreate = () => {
    setEditingArchive(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (archive: Archive) => {
    setEditingArchive(archive);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个档案吗？')) {
      try {
        await archiveApi.delete(id);
        fetchArchives();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">档案管理</h1>
        <button
          onClick={handleCreate}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-violet-700 transition-colors"
        >
          <Plus size={20} />
          <span>添加档案</span>
        </button>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archives.map((archive) => (
            <div key={archive.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-100 text-brand-primary rounded-full flex items-center justify-center">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{archive.name}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {archive.relation || (archive.is_self ? '自己' : '其他')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(archive)} className="p-2 text-gray-400 hover:text-brand-primary">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(archive.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="text-gray-400">出生：</span>{format(new Date(archive.birth_time), 'yyyy-MM-dd HH:mm')}</p>
                  <p><span className="text-gray-400">地点：</span>{archive.location_name}</p>
                  <p><span className="text-gray-400">类型：</span>{archive.calendar_type.toLowerCase() === 'solar' ? '公历' : '农历'}</p>
                </div>
              </div>
            </div>
          ))}
          {archives.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              暂无档案，点击右上角添加。
            </div>
          )}
        </div>
      )}

      <ArchiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        archive={editingArchive}
        onSuccess={fetchArchives}
      />
    </div>
  );
};
