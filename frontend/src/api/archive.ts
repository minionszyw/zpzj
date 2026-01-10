import api from './auth';

export interface Archive {
  id: string;
  name: string;
  gender: number; // Changed to number
  birth_time: string;
  calendar_type: string; // Changed to string (SOLAR/LUNAR)
  lat: number;
  lng: number;
  location_name: string;
  is_self: boolean;
  relation: string;
}

export interface ArchiveCreate {
  name: string;
  gender: number;
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