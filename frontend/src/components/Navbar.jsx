import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import YellowPecoraMascot from "@/components/YellowPecoraMascot";
import { Search, Plus, User, LogOut, Package, Heart, Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Navbar({ onUploadClick, notifications = [], onNotificationsClear }) {
  const { user, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/esplora?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100" data-testid="navbar">
      {/* Site Title */}
      <div className="bg-gray-900 text-center py-1.5">
        <Link to="/" className="text-sm font-heading font-bold tracking-[0.25em] text-white uppercase" data-testid="site-title">
          FUN COLLECTION
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo + Home */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo">
              <YellowPecoraMascot className="w-8 h-8" />
              <span className="text-lg font-heading font-bold tracking-tight text-gray-900 hidden sm:inline">
                Yellow<span className="text-yellow-500">Pecora</span>
              </span>
            </Link>
            <Link
              to="/"
              className="ml-1 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              data-testid="home-button"
              title="Torna alla Home"
            >
              <Home className="w-4 h-4 text-gray-500" />
            </Link>
          </div>

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
          <div className="flex items-center gap-2">
            {user && (
              <Button
                data-testid="upload-button"
                onClick={onUploadClick}
                className="rounded-full bg-gray-900 text-white hover:bg-gray-800 text-sm px-4"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Carica Oggetto</span>
                <span className="sm:hidden">Carica</span>
              </Button>
            )}

            {/* Notifications */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="notification-bell">
                    <Bell className="w-5 h-5 text-gray-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifiche</span>
                    {notifications.length > 0 && onNotificationsClear && (
                      <button onClick={onNotificationsClear} className="text-[10px] text-gray-400 hover:text-gray-600" data-testid="clear-notifications">
                        Segna lette
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((n, i) => (
                      <DropdownMenuItem key={i} className="flex-col items-start gap-1 py-2.5 cursor-pointer"
                        onClick={() => n.link && navigate(n.link)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!n.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />}
                          <span className="text-sm font-medium text-gray-900 truncate">{n.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 pl-4">{n.message}</p>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <Bell className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Nessuna notifica</p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
