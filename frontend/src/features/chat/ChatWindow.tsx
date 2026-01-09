import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat';
import type { Message } from '../../api/chat';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { MessageSquare, Send, Brain, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import ReactMarkdown from 'react-markdown';
import { MemoryModal } from './MemoryModal';
import { useAuthStore } from '../../store/useAuthStore';

export const ChatWindow: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (sessionId) {
      chatApi.listSessions().then((res) => {
        const s = res.data.find(it => it.id === sessionId);
        if (s) {
          archiveApi.get(s.archive_id).then(res => setArchive(res.data));
        }
      });
      chatApi.getMessages(sessionId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;
    
    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: inputValue, 
        created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/chat/completions/stream?session_id=${sessionId}&content=${encodeURIComponent(userMsg.content)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

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
                        if (parsed.content) {
                            fullContent += parsed.content;
                            setMessages(prev => prev.map(m => 
                                m.id === aiMsgId ? { ...m, content: fullContent } : m
                            ));
                        }
                    } catch (e) {
                    }
                }
            }
        }
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: '发送失败，请稍后重试。' } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col md:relative md:inset-auto md:h-[calc(100vh-8rem)]">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-white p-3 border-b border-gray-100 shadow-sm sticky top-0 z-10 h-14">
        <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="p-1 text-gray-400 hover:text-brand-primary transition-colors">
                <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[150px]">
                    {archive?.name || '咨询中...'}
                </span>
                <span className="text-[10px] text-gray-400">AI 命理分析</span>
            </div>
        </div>

        <button 
            onClick={() => setIsMemoryModalOpen(true)}
            className="text-gray-400 hover:text-brand-primary p-2 transition-colors"
            title="记忆事实"
        >
            <Brain size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50/30 flex flex-col overflow-hidden relative">
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-20">
                   <MessageSquare size={48} className="mx-auto mb-4 opacity-5" />
                   <p className="text-sm">对 {archive?.name} 的命局进行深度咨询</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === 'user' 
                        ? "ml-auto bg-brand-primary text-white rounded-tr-none shadow-sm" 
                        : "mr-auto bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm"
                )}>
                   <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                     <ReactMarkdown>
                        {msg.content}
                     </ReactMarkdown>
                   </div>
                </div>
              ))}
              {loading && !messages.find(m => m.role === 'assistant' && m.content !== '') && (
                <div className="mr-auto bg-white text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm animate-pulse shadow-sm">
                   正在解析命局...
                </div>
              )}
           </div>
           
           <div className="p-4 border-t border-gray-100 bg-white pb-safe-area-inset-bottom">
              <div className="relative flex items-center">
                <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50 shadow-inner transition-all text-sm"
                    placeholder="输入您的问题..."
                    disabled={loading}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-2 p-2 text-brand-primary hover:bg-violet-50 rounded-lg disabled:opacity-30 transition-colors"
                >
                    <Send size={20} />
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
