import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import YellowPecoraMascot from "@/components/YellowPecoraMascot";
import { Plus, User, LogOut, Package, Heart, Home, Bell, MessageCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar({ onUploadClick, onLoginClick, onChatClick, onLogout, notifications = [], onNotificationsClear }) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left: Home + Logo text */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" data-testid="home-button" title="Home">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <Link to="/esplora" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="nav-explore">
              Esplora
            </Link>
            {user && (
              <Link to="/collezioni" className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="nav-collections">
                <Package className="w-3.5 h-3.5" /> Collezioni
              </Link>
            )}
            <Link to="/tribunale" className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="nav-tribunale">
              <Shield className="w-3.5 h-3.5" /> L'Oracolo
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {user && (
              <Button data-testid="upload-button" onClick={onUploadClick}
                className="rounded-full bg-gray-900 text-white hover:bg-gray-800 text-xs px-3 h-8" size="sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Carica</span>
              </Button>
            )}

            {/* Chat */}
            {user && (
              <button onClick={onChatClick} className="p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="chat-button" title="Messaggi">
                <MessageCircle className="w-5 h-5 text-gray-500" />
              </button>
            )}

            {/* Notifications */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" data-testid="notification-bell">
                    <Bell className="w-5 h-5 text-gray-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifiche</span>
                    {notifications.length > 0 && onNotificationsClear && (
                      <button onClick={onNotificationsClear} className="text-[10px] text-gray-400 hover:text-gray-600" data-testid="clear-notifications">Segna lette</button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((n, i) => (
                      <DropdownMenuItem key={i} className="flex-col items-start gap-1 py-2.5 cursor-pointer" onClick={() => n.link && navigate(n.link)}>
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

            {/* Yellow Pecora -> Profile/Collection */}
            {user && (
              <Link to={`/profilo/${user.user_id}?tab=collezioni`} className="p-1" data-testid="pecora-profile-link" title="La tua collezione">
                <YellowPecoraMascot className="w-8 h-8" />
              </Link>
            )}

            {/* Profile Dropdown */}
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
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}`)} data-testid="dropdown-profile">
                    <User className="w-4 h-4 mr-2" /> Profilo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}?tab=collezioni`)} data-testid="dropdown-collections">
                    <Package className="w-4 h-4 mr-2" /> Collezioni
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profilo/${user.user_id}?tab=desideri`)} data-testid="dropdown-wishlist">
                    <Heart className="w-4 h-4 mr-2" /> Desideri
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} data-testid="dropdown-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button data-testid="login-button" onClick={onLoginClick}
                variant="outline" className="rounded-full text-sm px-4 h-9 border-gray-200"
              >Accedi</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
