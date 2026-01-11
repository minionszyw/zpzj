import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email) return;
    try {
      setLoading(true);
      setError('');
      await authApi.sendCode(email);
      setIsSent(true);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : '发送验证码失败，请检查邮箱格式');
      } else {
        setError('发送失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!code) return;
    try {
      setLoading(true);
      setError('');
      const response = await authApi.login(email, code);
      setAuth(response.data.user, response.data.access_token);
      navigate('/');
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : '登录失败，验证码错误');
      } else {
        setError('登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/50 dark:bg-stone-950 flex justify-center selection:bg-brand-accent/20">
      {/* 
        Main App Container - Same as Layout.tsx
      */}
      <div className="w-full max-w-[480px] bg-paper-light dark:bg-stone-900 shadow-xl min-h-screen relative flex flex-col items-center overflow-hidden px-6 py-12">
        
        {/* Background seal pattern decorator - Responsive and contained */}
        <div className="absolute top-[-5%] -right-16 w-64 h-64 border-[30px] border-brand-accent/5 rounded-full rotate-12 pointer-events-none" />
        <div className="absolute bottom-[5%] -left-12 w-48 h-48 border-[15px] border-ink-100/30 rounded-full -rotate-12 pointer-events-none" />

        <div className="w-full z-10 flex flex-col items-center my-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-accent rounded-2xl shadow-xl shadow-brand-accent/20 mb-6 rotate-3 transform transition-transform hover:rotate-0 duration-500">
              <span className="text-4xl font-serif font-black text-white">真</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
              子平真君
            </h1>
            <p className="mt-3 text-ink-500 dark:text-ink-400 font-serif tracking-widest opacity-80 uppercase text-xs">
              高精度八字排盘 · AI 咨询
            </p>
          </div>

          <Card className="w-full p-8 shadow-2xl shadow-ink-900/5 border-ink-100/50 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5 ml-1">电子邮箱</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail size={18} className="text-ink-300 group-focus-within:text-brand-accent transition-colors" />
                      </div>
                      <input
                          type="email"
                          disabled={isSent || loading}
                          className={cn(
                              "block w-full pl-11 pr-3 py-3.5 border-2 border-ink-50 dark:border-ink-700 bg-ink-50/30 dark:bg-stone-900/30 rounded-xl outline-none transition-all font-mono text-sm",
                              "focus:border-brand-accent/20 focus:bg-white dark:focus:bg-stone-900 focus:ring-4 focus:ring-brand-accent/5",
                              isSent && "opacity-50 grayscale bg-ink-100 dark:bg-stone-700"
                          )}
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
                </div>

                {isSent && (
                  <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5 ml-1">验证码</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <ShieldCheck size={18} className="text-ink-300 group-focus-within:text-brand-accent transition-colors" />
                      </div>
                      <input
                          type="text"
                          maxLength={6}
                          autoFocus
                          className="block w-full pl-11 pr-3 py-3.5 border-2 border-ink-50 dark:border-ink-700 bg-ink-50/30 dark:bg-stone-900/30 rounded-xl outline-none transition-all font-mono tracking-[0.5em] text-center text-lg font-bold"
                          placeholder="000000"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <button 
                      onClick={() => setIsSent(false)}
                      className="mt-2.5 text-[10px] text-brand-accent font-bold hover:underline ml-1"
                    >
                      修改邮箱?
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg animate-shake">
                  <p className="text-red-600 text-[11px] font-medium text-center">{error}</p>
                </div>
              )}

              <div className="pt-2">
                {!isSent ? (
                  <Button
                    onClick={handleSendCode}
                    disabled={loading || !email}
                    className="w-full py-7 rounded-xl text-base font-serif font-bold group shadow-lg shadow-brand-primary/10"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        发送验证码
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleLogin}
                    disabled={loading || code.length !== 6}
                    className="w-full py-7 rounded-xl text-base font-serif font-bold bg-brand-accent hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      '进入咨询'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <p className="mt-10 text-center text-[10px] md:text-xs text-ink-300 dark:text-ink-500 font-serif tracking-widest uppercase">
            凡事预则立 · 不预则废
          </p>
        </div>
      </div>
    </div>
  );
};
