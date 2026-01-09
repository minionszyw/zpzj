import React, { useEffect, useState, useRef } from 'react';
import { archiveApi } from '../../api/archive';
import type { Archive } from '../../api/archive';
import { chatApi } from '../../api/chat';
import type { ChatSession, Message } from '../../api/chat';
import { BaziChart } from '../bazi/BaziChart';
import { MessageSquare, User, Send, ChevronLeft, ChevronRight, History, Brain } from 'lucide-react';
import { cn } from '../../utils/cn';
import ReactMarkdown from 'react-markdown';
import { MemoryModal } from './MemoryModal';
import { useAuthStore } from '../../store/useAuthStore';

export const ChatPage: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [baziData, setBaziData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    archiveApi.list().then((res) => {
      setArchives(res.data);
    });
    chatApi.listSessions().then((res) => {
      setSessions(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedArchiveId) {
      archiveApi.getBazi(selectedArchiveId).then((res) => {
        setBaziData(res.data);
      });
      const existingSession = sessions.find(s => s.archive_id === selectedArchiveId);
      if (existingSession) {
        setCurrentSessionId(existingSession.id);
      } else {
        chatApi.createSession(selectedArchiveId).then((res) => {
          setSessions([res.data, ...sessions]);
          setCurrentSessionId(res.data.id);
        });
      }
    }
  }, [selectedArchiveId]);

  useEffect(() => {
    if (currentSessionId) {
      chatApi.getMessages(currentSessionId).then((res) => {
        setMessages(res.data);
      });
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId) return;
    
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
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/chat/completions/stream?session_id=${currentSessionId}&content=${encodeURIComponent(userMsg.content)}`, {
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
                        // Not JSON or partial JSON
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

  const selectedArchive = archives.find(a => a.id === selectedArchiveId);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 relative overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"
      )}>
        <div className="p-4 border-b border-gray-100 font-bold flex justify-between items-center whitespace-nowrap">
          <span className="flex items-center gap-2"><User size={18} /> 档案列表</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {archives.map((archive) => (
            <button
              key={archive.id}
              onClick={() => setSelectedArchiveId(archive.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                selectedArchiveId === archive.id ? "bg-violet-50 text-brand-primary font-medium" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className="truncate">{archive.name}</span>
            </button>
          ))}
          {archives.length === 0 && (
            <div className="text-xs text-center text-gray-400 py-4">暂无档案</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Bazi Chart Area */}
        {baziData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                   <History size={16} /> {selectedArchive?.name} 的命盘
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="text-gray-400 hover:text-brand-primary flex items-center gap-1 text-xs"
                    >
                        <Brain size={16} /> 记忆
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-brand-primary">
                        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>
             </div>
             <BaziChart data={baziData} />
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-10">
                   <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                   <p>{selectedArchive ? `开始询问关于 ${selectedArchive.name} 的命理问题` : "请在左侧选择一个档案开始"}</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === 'user' 
                        ? "ml-auto bg-brand-primary text-white rounded-tr-none shadow-sm" 
                        : "mr-auto bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
                )}>
                   <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                     <ReactMarkdown>
                        {msg.content}
                     </ReactMarkdown>
                   </div>
                </div>
              ))}
              {loading && !messages.find(m => m.role === 'assistant' && m.content !== '') && (
                <div className="mr-auto bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm animate-pulse">
                   正在分析命局中...
                </div>
              )}
           </div>
           
           <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="relative flex items-center">
                <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white shadow-sm transition-all"
                    placeholder={selectedArchive ? `对 ${selectedArchive.name} 进行命理咨询...` : "请先选择档案"}
                    disabled={!selectedArchive || loading}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!selectedArchive || !inputValue.trim() || loading}
                    className="absolute right-2 p-2 text-brand-primary hover:bg-violet-50 rounded-lg disabled:opacity-30 transition-colors"
                >
                    <Send size={20} />
                </button>
              </div>
           </div>
        </div>
      </div>

      {currentSessionId && (
        <MemoryModal 
            isOpen={isMemoryModalOpen} 
            onClose={() => setIsMemoryModalOpen(false)} 
            sessionId={currentSessionId}
        />
      )}
    </div>
  );
};