import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Search, ChevronRight, Grid3x3, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CollectionsPage() {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState("categoria"); // "categoria" or "serie"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    tipo: "tutti", // tutti, vendita, scambio, collezione
  });

  useEffect(() => {
    if (user) {
      fetchAllUserItems();
    }
  }, [user]);

  const fetchAllUserItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collections/grouped`, { 
        withCredentials: true 
      });
      
      const items = [];
      res.data.forEach(collection => {
        if (collection.items && Array.isArray(collection.items)) {
          items.push(...collection.items);
        }
      });
      
      setAllItems(items);
    } catch (err) {
      console.error("Error fetching collections:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Filter by tipo
    if (activeFilters.tipo !== "tutti") {
      filtered = filtered.filter(item => {
        const type = item.transaction_type || "";
        if (activeFilters.tipo === "vendita") return type === "vendita" || type === "scambio_vendita";
        if (activeFilters.tipo === "scambio") return type === "scambio" || type === "scambio_vendita";
        if (activeFilters.tipo === "collezione") return type === "collezione";
        return true;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.series?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allItems, searchQuery, activeFilters]);

  // Group by categoria or serie
  const folders = useMemo(() => {
    const grouped = {};
    
    filteredItems.forEach(item => {
      const key = viewMode === "categoria" 
        ? item.category || "Altro"
        : item.series || "Altro";
      
      if (!grouped[key]) {
        grouped[key] = {
          name: key,
          items: [],
          coverImage: null
        };
      }
      
      grouped[key].items.push(item);
      
      // Set cover image (first item with image)
      if (!grouped[key].coverImage && item.images && item.images[0]) {
        grouped[key].coverImage = item.images[0];
      }
    });

    return Object.values(grouped).sort((a, b) => b.items.length - a.items.length);
  }, [filteredItems, viewMode]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Devi effettuare il login</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto pb-20">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 pt-4 pb-3">
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-3">
              Le Mie Collezioni
            </h1>
            
            {/* Toggle: Categoria / Serie */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => { setViewMode("categoria"); setSelectedFolder(null); }}
                className={`flex-1 text-xs font-semibold py-2 rounded-full transition-all duration-150 ${
                  viewMode === "categoria" 
                    ? "bg-white shadow-sm text-gray-900" 
                    : "text-gray-500"
                }`}
                data-testid="toggle-categoria"
              >
                Per Categoria
              </button>
              <button
                onClick={() => { setViewMode("serie"); setSelectedFolder(null); }}
                className={`flex-1 text-xs font-semibold py-2 rounded-full transition-all duration-150 ${
                  viewMode === "serie" 
                    ? "bg-white shadow-sm text-gray-900" 
                    : "text-gray-500"
                }`}
                data-testid="toggle-serie"
              >
                Per Serie
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca oggetti..."
                className="h-10 pl-10 rounded-xl bg-white border-gray-200 text-sm"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="px-4 pb-3 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              {["tutti", "vendita", "scambio", "collezione"].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setActiveFilters({ ...activeFilters, tipo })}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 active:scale-95 ${
                    activeFilters.tipo === tipo
                      ? "bg-yellow-400 border-yellow-400 text-gray-900 font-semibold"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                  data-testid={`filter-${tipo}`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {selectedFolder ? (
            <FolderView 
              folder={selectedFolder} 
              onBack={() => setSelectedFolder(null)} 
            />
          ) : (
            <FoldersGrid 
              folders={folders} 
              onSelectFolder={setSelectedFolder}
              totalItems={filteredItems.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Folders Grid
function FoldersGrid({ folders, onSelectFolder, totalItems }) {
  if (folders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Nessun oggetto trovato</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        {totalItems} oggetti • {folders.length} {folders.length === 1 ? 'gruppo' : 'gruppi'}
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {folders.map((folder, idx) => (
          <FolderCard 
            key={idx} 
            folder={folder} 
            onClick={() => onSelectFolder(folder)} 
          />
        ))}
      </div>
    </div>
  );
}

// Folder Card
function FolderCard({ folder, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-200 transition-all duration-150 active:scale-95 hover:shadow-md group"
      data-testid={`folder-${folder.name}`}
    >
      {/* Stacked effect */}
      <div className="absolute inset-0 bg-gray-100 translate-x-1 translate-y-1 rounded-xl" />
      <div className="absolute inset-0 bg-gray-50 translate-x-0.5 translate-y-0.5 rounded-xl" />
      
      {/* Cover Image */}
      <div className="relative h-full w-full">
        {folder.coverImage ? (
          <img 
            src={folder.coverImage} 
            alt={folder.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Label */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm mb-0.5 line-clamp-1">
            {folder.name}
          </h3>
          <p className="text-xs text-white/80">
            {folder.items.length} {folder.items.length === 1 ? 'oggetto' : 'oggetti'}
          </p>
        </div>

        {/* Arrow */}
        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </button>
  );
}

// Folder View (inside a folder)
function FolderView({ folder, onBack }) {
  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm text-gray-600 active:scale-95 transition-transform duration-150"
        data-testid="back-button"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Indietro</span>
      </button>

      {/* Folder Title */}
      <div className="mb-4">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-1">
          {folder.name}
        </h2>
        <p className="text-xs text-gray-500">
          {folder.items.length} {folder.items.length === 1 ? 'oggetto' : 'oggetti'}
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-3 gap-2">
        {folder.items.map((item, idx) => (
          <ItemCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

// Item Card
function ItemCard({ item }) {
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'vendita':
      case 'scambio_vendita':
        return 'bg-green-500 text-white';
      case 'scambio':
        return 'bg-blue-500 text-white';
      case 'collezione':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getBadgeLabel = (type) => {
    if (type === 'scambio_vendita') return 'V/S';
    if (type === 'vendita') return 'V';
    if (type === 'scambio') return 'S';
    if (type === 'collezione') return 'C';
    return '';
  };

  return (
    <div 
      className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white border border-gray-200 transition-all duration-150 active:scale-95"
      data-testid={`item-${item.item_id}`}
    >
      {/* Image */}
      {item.images && item.images[0] ? (
        <img 
          src={item.images[0]} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Package className="w-6 h-6 text-gray-300" />
        </div>
      )}

      {/* Badge */}
      {item.transaction_type && (
        <div className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getBadgeStyle(item.transaction_type)}`}>
          {getBadgeLabel(item.transaction_type)}
        </div>
      )}

      {/* Name overlay (on hover/tap) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity duration-150">
        <p className="text-white text-[10px] font-semibold line-clamp-2">
          {item.name}
        </p>
      </div>
    </div>
  );
}
