import api from './auth';

export interface Archive {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birth_time: string;
  calendar_type: 'solar' | 'lunar';
  lat: number;
  lng: number;
  location_name: string;
  is_self: boolean;
  relation: string;
}

export interface ArchiveCreate {
  name: string;
  gender: string;
  birth_time: string;
  calendar_type: string;
  lat: number;
  lng: number;
  location_name: string;
  is_self?: boolean;
  relation?: string;
}

export const archiveApi = {
  list: () => api.get<Archive[]>('/archives/'),
  get: (id: string) => api.get<Archive>(`/archives/${id}`),
  create: (data: ArchiveCreate) => api.post<Archive>('/archives/', data),
  update: (id: string, data: Partial<ArchiveCreate>) => api.patch<Archive>(`/archives/${id}`, data),
  delete: (id: string) => api.delete(`/archives/${id}`),
  getBazi: (id: string) => api.get(`/archives/${id}/bazi`),
  searchLocations: (query: string) => api.get(`/archives/locations?query=${query}`),
};
