import { create } from 'zustand';
import { archiveApi } from '../api/archive';
import type { Archive } from '../api/archive';

interface ArchiveState {
  archives: Archive[];
  selectedArchiveId: string | null;
  loading: boolean;
  error: string | null;
  
  fetchArchives: () => Promise<void>;
  setSelectedArchiveId: (id: string | null) => void;
  refreshSelectedArchive: () => Promise<void>;
}

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  archives: [],
  selectedArchiveId: null,
  loading: false,
  error: null,

  fetchArchives: async () => {
    try {
      set({ loading: true, error: null });
      const res = await archiveApi.list();
      const archives = res.data;
      
      let currentId = get().selectedArchiveId;
      
      // If no archive selected, try to select "self" or the first one
      if (!currentId && archives.length > 0) {
        const self = archives.find(a => a.is_self);
        currentId = self ? self.id : archives[0].id;
      }
      
      set({ archives, selectedArchiveId: currentId, loading: false });
    } catch (err) {
      console.error('Failed to fetch archives', err);
      set({ error: '无法加载档案列表', loading: false });
    }
  },

  setSelectedArchiveId: (id) => {
    set({ selectedArchiveId: id });
  },

  refreshSelectedArchive: async () => {
    // This could be used to force a refresh of the currently selected archive's data
    // in components like BaziPage
    const id = get().selectedArchiveId;
    if (id) {
        // Just trigger a re-fetch of archives to ensure we have latest info
        await get().fetchArchives();
    }
  }
}));
