import { create } from 'zustand';
import { chatApi } from '../api/chat';
import type { Message } from '../api/chat';

interface SessionState {
  messages: Message[];
  isStreaming: boolean;
  thinkingMessage: string | null;
}

interface ChatState {
  sessions: Record<string, SessionState>;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, content: string, token: string) => Promise<void>;
  initSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: {},

  initSession: (sessionId) => {
    if (!get().sessions[sessionId]) {
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: { messages: [], isStreaming: false, thinkingMessage: null }
        }
      }));
    }
  },

  fetchMessages: async (sessionId) => {
    // Only fetch if not already streaming to avoid overwriting live state
    if (get().sessions[sessionId]?.isStreaming) return;
    
    try {
      const res = await chatApi.getMessages(sessionId);
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: { 
            ...(state.sessions[sessionId] || { isStreaming: false, thinkingMessage: null }),
            messages: res.data 
          }
        }
      }));
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  },

  sendMessage: async (sessionId, content, token) => {
    const state = get();
    const session = state.sessions[sessionId] || { messages: [], isStreaming: false, thinkingMessage: null };
    
    if (session.isStreaming) return;

    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: content, 
        created_at: new Date().toISOString() 
    };

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    // Add user message and empty AI message
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { 
            ...session, 
            messages: [...session.messages, userMsg, aiMsg],
            isStreaming: true,
            thinkingMessage: null
        }
      }
    }));

    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/chat/completions/stream?session_id=${sessionId}&content=${encodeURIComponent(content)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        if (!response.body) throw new Error('No response body');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.status === 'thinking') {
                            set((state) => ({
                                sessions: {
                                    ...state.sessions,
                                    [sessionId]: { ...state.sessions[sessionId], thinkingMessage: parsed.message }
                                }
                            }));
                        } else if (parsed.content) {
                            fullContent += parsed.content;
                            set((state) => {
                                const currentSession = state.sessions[sessionId];
                                const newMessages = [...currentSession.messages];
                                const lastIdx = newMessages.findIndex(m => m.id === aiMsgId);
                                if (lastIdx !== -1) {
                                    newMessages[lastIdx] = { ...newMessages[lastIdx], content: fullContent };
                                }
                                return {
                                    sessions: {
                                        ...state.sessions,
                                        [sessionId]: { ...currentSession, messages: newMessages, thinkingMessage: null }
                                    }
                                };
                            });
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (err) {
      console.error('Streaming failed', err);
      set((state) => {
        const currentSession = state.sessions[sessionId];
        const newMessages = [...currentSession.messages];
        const lastIdx = newMessages.findIndex(m => m.id === aiMsgId);
        if (lastIdx !== -1) {
            newMessages[lastIdx] = { ...newMessages[lastIdx], content: '⚠️ 咨询服务暂时不可用，请稍后重试。' };
        }
        return {
            sessions: {
                ...state.sessions,
                [sessionId]: { ...currentSession, messages: newMessages, isStreaming: false }
            }
        };
      });
    } finally {
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: { ...state.sessions[sessionId], isStreaming: false, thinkingMessage: null }
        }
      }));
    }
  }
}));