import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';

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
  const [loading, setLoading] = useState(false);

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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {archive ? '编辑档案' : '添加档案'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">姓名</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">性别</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                      >
                        <option value={1}>男</option>
                        <option value={0}>女</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">历法</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                        value={formData.calendar_type}
                        onChange={(e) => setFormData({ ...formData, calendar_type: e.target.value })}
                      >
                        <option value="SOLAR">公历</option>
                        <option value="LUNAR">农历</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">出生时间</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                      value={formData.birth_time}
                      onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">出生地点 (城市)</label>
                    <input
                      type="text"
                      required
                      placeholder="如：北京市"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">关系 (如：朋友、客户)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                      value={formData.relation}
                      onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                      checked={formData.is_self}
                      onChange={(e) => setFormData({ ...formData, is_self: e.target.checked })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">这是我的档案</label>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      {loading ? '保存中...' : '保存'}
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