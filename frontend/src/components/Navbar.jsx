import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, User, LogOut, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar({ onUploadClick }) {
  const { user, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/esplora?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" data-testid="navbar-logo">
            <span className="text-xl font-heading font-bold tracking-tight text-gray-900">
              Yellow<span className="text-yellow-500">Pecora</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                data-testid="search-input"
                type="text"
                placeholder="Cerca oggetti, categorie, collezionisti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <Button
                data-testid="upload-button"
                onClick={onUploadClick}
                className="rounded-full bg-gray-900 text-white hover:bg-gray-800 text-sm px-5"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Carica Oggetto</span>
                <span className="sm:hidden">Carica</span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none" data-testid="profile-dropdown-trigger">
                    <Avatar className="w-8 h-8 border border-gray-200">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback className="text-xs bg-gray-100">{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}`)} data-testid="dropdown-profile">
                    <User className="w-4 h-4 mr-2" /> Il mio Profilo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}?tab=desideri`)} data-testid="dropdown-wishlist">
                    <Heart className="w-4 h-4 mr-2" /> Lista Desideri
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}?tab=scambiabili`)} data-testid="dropdown-tradeable">
                    <Package className="w-4 h-4 mr-2" /> Scambiabili
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="dropdown-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                data-testid="login-button"
                onClick={login}
                variant="outline"
                className="rounded-full text-sm px-5 border-gray-200"
              >
                Accedi con Google
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="sm:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              data-testid="search-input-mobile"
              type="text"
              placeholder="Cerca oggetti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </form>
      </div>
    </nav>
  );
}
