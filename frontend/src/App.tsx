import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';

// Lazy load pages
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const SessionListPage = lazy(() => import('./features/chat/SessionListPage').then(module => ({ default: module.SessionListPage })));
const ChatWindow = lazy(() => import('./features/chat/ChatWindow').then(module => ({ default: module.ChatWindow })));
const BaziPage = lazy(() => import('./features/bazi/BaziPage').then(module => ({ default: module.BaziPage })));
const MePage = lazy(() => import('./features/profile/MePage').then(module => ({ default: module.MePage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PageLoading = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh] text-ink-400">
    <div className="animate-pulse font-serif">加载中...</div>
  </div>
);

function App() {
  useEffect(() => {
    document.documentElement.lang = 'zh-CN';
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SessionListPage />} />
            <Route path="chat/:sessionId" element={<ChatWindow />} />
            <Route path="bazi" element={<BaziPage />} />
            <Route path="me" element={<MePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;