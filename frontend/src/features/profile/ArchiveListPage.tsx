import React, { useEffect, useState } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { useArchiveStore } from '../../store/useArchiveStore';
import { Plus, Edit2, Trash2, User as UserIcon, MapPin, Calendar, Clock } from 'lucide-react';
import { ArchiveModal } from './ArchiveModal';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

export const ArchiveListPage: React.FC = () => {
  const { archives, fetchArchives, loading } = useArchiveStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Archive | undefined>();

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
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-serif text-ink-900 dark:text-ink-100">档案管理</h1>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} />
          <span>添加档案</span>
        </Button>
      </div>

      {loading && archives.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-ink-100/50 rounded-xl animate-pulse"></div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archives.map((archive, index) => (
            <Card 
                key={archive.id} 
                className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border",
                        archive.is_self 
                            ? "bg-brand-accent/10 border-brand-accent text-brand-accent" 
                            : "bg-ink-50 border-ink-200 text-ink-400"
                    )}>
                      {archive.is_self ? <span className="font-serif font-bold">我</span> : <UserIcon size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg font-serif text-ink-900 dark:text-ink-100">{archive.name}</h3>
                      <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border",
                          archive.is_self 
                            ? "bg-brand-accent/5 border-brand-accent/30 text-brand-accent"
                            : "bg-ink-50 border-ink-200 text-ink-500"
                      )}>
                        {archive.relation || (archive.is_self ? '本人' : '未标记')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(archive)} className="p-2 text-ink-400 hover:text-brand-primary hover:bg-ink-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(archive.id)} className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-xs text-ink-600 dark:text-ink-400 mt-2">
                  <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-ink-400" />
                      <span>{format(new Date(archive.birth_time), 'yyyy年MM月dd日')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Clock size={14} className="text-ink-400" />
                      <span>{format(new Date(archive.birth_time), 'HH:mm')}</span>
                      <span className="text-ink-400 scale-90 px-1 border border-ink-200 rounded">
                        {archive.calendar_type === 'SOLAR' ? '公' : '农'}
                      </span>
                  </div>
                  <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-ink-400" />
                      <span className="truncate">{archive.location_name}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {archives.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-ink-400 bg-white dark:bg-stone-900 rounded-xl border border-dashed border-ink-200 dark:border-ink-700 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center">
                  <UserIcon size={32} className="opacity-20" />
              </div>
              <p>暂无档案，请点击右上角添加。</p>
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