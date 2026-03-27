import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthCallback from "@/components/AuthCallback";
import Navbar from "@/components/Navbar";
import UploadModal from "@/components/UploadModal";
import LoginModal from "@/components/LoginModal";
import ChatDrawer from "@/components/ChatDrawer";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import TribunalePage from "@/pages/TribunalePage";
import axios from "axios";
import "@/App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AppRouter() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/notifications`, { withCredentials: true });
      setNotifications(res.data);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const clearNotifications = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar
        onUploadClick={() => setUploadOpen(true)}
        onLoginClick={() => setLoginOpen(true)}
        onChatClick={() => setChatOpen(true)}
        onLogout={logout}
        notifications={notifications}
        onNotificationsClear={clearNotifications}
      />
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/esplora" element={<ExplorePage />} />
          <Route path="/oggetto/:id" element={<ItemDetailPage />} />
          <Route path="/profilo/:userId" element={<ProfilePage />} />
          <Route path="/tribunale" element={<TribunalePage />} />
        </Routes>
      </main>
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onItemCreated={fetchNotifications} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-heading font-bold text-gray-900">
              FUN <span className="text-yellow-500">COLLECTION</span>
            </span>
            <p className="text-xs text-gray-400">Il marketplace per collezionisti. Scambia, colleziona, divertiti.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
