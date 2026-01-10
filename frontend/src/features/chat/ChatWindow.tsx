import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat';
import type { Message } from '../../api/chat';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { MessageSquare, Send, Brain, ChevronLeft } from 'lucide-react';
import { MemoryModal } from './MemoryModal';
import { useAuthStore } from '../../store/useAuthStore';
import { MessageBubble } from './MessageBubble';
import { ChatLoading } from './ChatLoading';
import { Button } from '../../components/ui/Button';
import { UserAvatar } from '../../components/UserAvatar';

export const ChatWindow: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token, user } = useAuthStore(); // Destructure user here

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

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

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
        m.id === aiMsgId ? { ...m, content: '⚠️ 咨询服务暂时不可用，可能是网络波动或系统正在维护，请稍后重试。' } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-paper-light z-40 flex flex-col md:relative md:inset-auto md:h-[calc(100vh-2rem)] md:bg-transparent">
      {/* Top Bar (Mobile Only - Desktop has Sidebar) */}
      <div className="md:hidden flex justify-between items-center bg-paper-light/80 backdrop-blur-md p-3 border-b border-ink-100 sticky top-0 z-10 h-14">
        <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="p-1 text-ink-500 hover:text-ink-900 transition-colors">
                <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-ink-900 leading-tight truncate max-w-[150px] font-serif">
                    {archive?.name || '咨询中...'}
                </span>
                <span className="text-[10px] text-ink-400">AI 命理分析</span>
            </div>
        </div>

        <button 
            onClick={() => setIsMemoryModalOpen(true)}
            className="text-ink-400 hover:text-brand-accent p-2 transition-colors"
            title="记忆事实"
        >
            <Brain size={20} />
        </button>
      </div>

      {/* Desktop Header Enhancement */}
      <div className="hidden md:flex justify-between items-center p-4 border-b border-ink-100 bg-white dark:bg-stone-900 rounded-t-xl mx-4 mt-4">
         <div className="flex items-center gap-3">
             {archive?.is_self ? (
                 <UserAvatar avatarUrl={user?.avatar_url} size="md" />
             ) : (
                 <div className="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center font-serif text-lg font-bold text-ink-700">
                     {archive?.name?.[0] || '客'}
                 </div>
             )}
             <div>
                 <h2 className="font-serif font-bold text-ink-900">{archive?.name || '命主'}</h2>
                 <p className="text-xs text-ink-500">
                    {archive?.location_name ? `${archive.location_name} · ` : ''} 
                    {archive?.birth_time ? new Date(archive.birth_time).toLocaleDateString() : ''}
                 </p>
             </div>
         </div>
         <Button variant="ghost" size="sm" onClick={() => setIsMemoryModalOpen(true)}>
            <Brain size={16} className="mr-2" />
            记忆库
         </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative md:mx-4 md:mb-4 md:bg-white md:dark:bg-stone-900 md:border-x md:border-b md:border-ink-100 md:rounded-b-xl">
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-ink-300">
                   <div className="w-16 h-16 rounded-full border-2 border-ink-100 flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="opacity-20" />
                   </div>
                   <p className="text-sm font-serif">请描述您想咨询的问题</p>
                   <p className="text-xs mt-2">例如：“我的财运如何？” “适合往哪个方向发展？”</p>
                </div>
              )}
              
              {messages.map((msg) => (
                (msg.content || !loading || msg.role === 'user') && (
                    <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                )
              ))}

              {loading && (
                  <ChatLoading />
              )}
           </div>
           
           <div className="p-4 bg-paper-light dark:bg-stone-900 border-t border-ink-100 dark:border-ink-800 pb-safe-area-inset-bottom">
              <div className="relative flex items-end gap-2 bg-white dark:bg-stone-800 border border-ink-200 dark:border-ink-700 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-ink-100 transition-all">
                <textarea
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 pl-2 text-sm text-ink-900 placeholder:text-ink-300 outline-none"
                    placeholder="请输入您的问题..."
                    disabled={loading}
                    value={inputValue}
                    rows={1}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || loading}
                    className="p-2 mb-0.5 bg-ink-900 text-white rounded-xl hover:bg-ink-700 disabled:opacity-50 disabled:bg-ink-200 transition-colors"
                >
                    <Send size={18} />
                </button>
              </div>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-ink-300 transform scale-90">
                    AI生成内容仅供参考，请理性对待
                 </p>
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
