import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthCallback from "@/components/AuthCallback";
import Navbar from "@/components/Navbar";
import UploadModal from "@/components/UploadModal";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import "@/App.css";

function AppRouter() {
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);

  // Check URL fragment for session_id synchronously during render (prevents race conditions)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar onUploadClick={() => setUploadOpen(true)} />
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/esplora" element={<ExplorePage />} />
          <Route path="/oggetto/:id" element={<ItemDetailPage />} />
          <Route path="/profilo/:userId" element={<ProfilePage />} />
        </Routes>
      </main>
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-heading font-bold text-gray-900">
              Yellow<span className="text-yellow-500">Pecora</span>
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
