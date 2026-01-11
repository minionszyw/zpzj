import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';
import { Layout } from './components/Layout';
import { SessionListPage } from './features/chat/SessionListPage';
import { ChatWindow } from './features/chat/ChatWindow';
import { BaziPage } from './features/bazi/BaziPage';
import { MePage } from './features/profile/MePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    document.documentElement.lang = 'zh-CN';
  }, []);

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;