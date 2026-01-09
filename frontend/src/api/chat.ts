import api from './auth';

export interface ChatSession {
  id: string;
  archive_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  meta_data?: any;
}

export const chatApi = {
  createSession: (archiveId: string) => api.post<ChatSession>(`/chat/sessions?archive_id=${archiveId}`),
  listSessions: () => api.get<ChatSession[]>('/chat/sessions'),
  getMessages: (sessionId: string) => api.get<Message[]>(`/chat/sessions/${sessionId}/messages`),
  // Non-streaming completion for now
  sendMessage: (sessionId: string, content: string) => api.post('/chat/completions', { session_id: sessionId, content }),
  deleteSession: (sessionId: string) => api.delete(`/chat/sessions/${sessionId}`),
  getFacts: (sessionId: string) => api.get(`/chat/sessions/${sessionId}/facts`),
  deleteFact: (factId: string) => api.delete(`/chat/facts/${factId}`),
};
