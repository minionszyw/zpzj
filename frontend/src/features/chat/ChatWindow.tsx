import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { chatApi } from '../../api/chat';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { MessageSquare, Send, Brain, ChevronLeft } from 'lucide-react';
import { MemoryModal } from './MemoryModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { ChatLoading } from './ChatLoading';
import { Virtuoso } from 'react-virtuoso';
import TextareaAutosize from 'react-textarea-autosize';
import { STRINGS } from '../../constants/strings';

export const ChatWindow: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const { token } = useAuthStore();
  
  const { sessions, fetchMessages, sendMessage, initSession } = useChatStore();
  const currentSession = sessionId ? sessions[sessionId] : null;
  const messages = currentSession?.messages || [];
  const isStreaming = currentSession?.isStreaming || false;
  const thinkingMessage = currentSession?.thinkingMessage || null;

  useEffect(() => {
    if (sessionId) {
      initSession(sessionId);
      chatApi.listSessions().then((res) => {
        const s = res.data.find(it => it.id === sessionId);
        if (s) {
          archiveApi.get(s.archive_id).then(res => setArchive(res.data));
        }
      });
      fetchMessages(sessionId);
    }
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || !token) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(sessionId, content, token);
  };

  const handleBack = () => {
      if (location.state?.from) {
          navigate(location.state.from);
      } else {
          navigate('/');
      }
  };

  return (
    <div className="absolute inset-0 bg-paper-light dark:bg-stone-900 z-40 flex flex-col bottom-20">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-paper-light/80 backdrop-blur-md p-3 border-b border-ink-100 sticky top-0 z-10 h-14">
        <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-1 text-ink-500 hover:text-ink-900 transition-colors">
                <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-ink-900 leading-tight truncate max-w-[150px] font-serif">
                    {archive?.name || STRINGS.CHAT.DEFAULT_TITLE}
                </span>
            </div>
        </div>

        <button 
            onClick={() => setIsMemoryModalOpen(true)}
            className="text-ink-400 hover:text-brand-accent p-2 transition-colors"
            title={STRINGS.CHAT.MEMORY_BUTTON_TITLE}
        >
            <Brain size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
           {messages.length === 0 && !isStreaming ? (
                <div className="flex flex-col items-center justify-center h-full text-ink-300">
                   <div className="w-16 h-16 rounded-full border-2 border-ink-100 flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="opacity-20" />
                   </div>
                   <p className="text-sm font-serif">{STRINGS.CHAT.EMPTY_STATE_TITLE}</p>
                   <p className="text-xs mt-2">{STRINGS.CHAT.EMPTY_STATE_DESC}</p>
                </div>
           ) : (
               <Virtuoso
                 className="flex-1"
                 data={messages}
                 followOutput="auto"
                 itemContent={(_, msg) => {
                    if (!msg.content && msg.role === 'assistant' && !isStreaming) return null; // Skip empty non-streaming
                    // Wait, if streaming and content is empty (just started), we still want to render if needed, but usually content builds up.
                    // The original code was: (msg.content || (isStreaming && msg.role === 'assistant') || msg.role === 'user')
                    if (msg.content || (isStreaming && msg.role === 'assistant') || msg.role === 'user') {
                        return <div className="px-4 py-2"><MessageBubble role={msg.role} content={msg.content} /></div>;
                    }
                    return null;
                 }}
                 components={{
                     Footer: () => isStreaming ? <div className="px-4 pb-2"><ChatLoading message={thinkingMessage} /></div> : null
                 }}
               />
           )}
           
           <div className="p-4 bg-paper-light dark:bg-stone-900 border-t border-ink-100 dark:border-ink-800 pb-safe-area-inset-bottom">
              <div className="relative flex items-end gap-2 bg-white dark:bg-stone-800 border border-ink-200 dark:border-ink-700 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-ink-100 transition-all">
                <TextareaAutosize
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-2.5 pl-2 text-sm text-ink-900 placeholder:text-ink-300 outline-none"
                    placeholder={STRINGS.CHAT.INPUT_PLACEHOLDER}
                    disabled={isStreaming}
                    value={inputValue}
                    maxRows={6}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isStreaming}
                    className="p-2 mb-0.5 bg-ink-900 text-white rounded-xl hover:bg-ink-700 disabled:opacity-50 disabled:bg-ink-200 transition-colors"
                >
                    <Send size={18} />
                </button>
              </div>
           </div>
      </div>

      {sessionId && (
        <MemoryModal 
            isOpen={isMemoryModalOpen} 
            onClose={() => setIsMemoryModalOpen(false)} 
            sessionId={sessionId}
        />
      )}
    </div>
  );
};