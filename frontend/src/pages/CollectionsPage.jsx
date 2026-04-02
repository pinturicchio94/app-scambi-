import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Package, Grid3x3, List, ArrowUpDown, Filter, Search, 
  Sparkles, TrendingUp, Box, Lock, Globe, Edit, MapPin, Calendar, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [collections, selectedCollection, filterCategory, sortBy, searchQuery]);

  const fetchCollections = async () => {
    try {
      const res = await axios.get(`${API}/collections/grouped`, { withCredentials: true });
      setCollections(res.data);
    } catch (err) {
      console.error("Error fetching collections:", err);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let allItems = [];
    
    // Flatten items from collections
    collections.forEach(coll => {
      allItems = [...allItems, ...coll.items];
    });

    // Filter by collection
    if (selectedCollection !== "all") {
      allItems = allItems.filter(item => item.collection_name === selectedCollection);
    }

    // Filter by category type
    if (filterCategory === "sealed") {
      allItems = allItems.filter(item => item.sealed);
    } else if (filterCategory !== "all") {
      allItems = allItems.filter(item => item.category === filterCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allItems = allItems.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "name_asc") {
      allItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      allItems.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "value_desc") {
      allItems.sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));
    } else if (sortBy === "value_asc") {
      allItems.sort((a, b) => (a.estimated_value || 0) - (b.estimated_value || 0));
    } else if (sortBy === "date_desc") {
      allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "date_asc") {
      allItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setFilteredItems(allItems);
  };

  // Get unique categories from all items
  const getAllCategories = () => {
    const cats = new Set();
    collections.forEach(coll => {
      coll.items.forEach(item => {
        if (item.category) cats.add(item.category);
      });
    });
    return Array.from(cats);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="collections-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Le Mie Collezioni</h1>
            <p className="text-sm text-gray-500">{filteredItems.length} oggetti in totale</p>
          </div>
        </div>
      </div>

      {/* Collections Overview */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {collections.map((coll, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCollection(coll.collection_name)}
              className={`text-left border-2 rounded-xl p-4 transition-all hover:border-purple-300 ${
                selectedCollection === coll.collection_name 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 bg-white'
              }`}
              data-testid={`collection-card-${idx}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-900 flex-1">{coll.collection_name}</h3>
                {coll.sealed_count > 0 && (
                  <Badge className="text-[9px] bg-blue-100 text-blue-800 border-0">
                    <Box className="w-2.5 h-2.5 mr-0.5" />{coll.sealed_count} Sealed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <span>{coll.item_count} oggetti</span>
                {coll.total_value > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />€{coll.total_value}
                  </span>
                )}
              </div>
              {coll.percentage > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>Completamento</span>
                    <span className="font-semibold">{coll.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${coll.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cerca oggetto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
              data-testid="search-input"
            />
          </div>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="category-filter">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              <SelectItem value="sealed">🔒 Box Sigillate</SelectItem>
              {getAllCategories().map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="sort-select">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Più recenti</SelectItem>
              <SelectItem value="date_asc">Più vecchi</SelectItem>
              <SelectItem value="name_asc">Nome A-Z</SelectItem>
              <SelectItem value="name_desc">Nome Z-A</SelectItem>
              <SelectItem value="value_desc">Valore ↓</SelectItem>
              <SelectItem value="value_asc">Valore ↑</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-500"}`}
              data-testid="grid-view-btn"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-500"}`}
              data-testid="list-view-btn"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {selectedCollection !== "all" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedCollection("all")}
              className="h-9 text-xs"
            >
              Mostra tutto
            </Button>
          )}
        </div>
      </div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nessun oggetto trovato</p>
          {selectedCollection !== "all" && (
            <Button 
              variant="link" 
              onClick={() => setSelectedCollection("all")}
              className="mt-2 text-xs"
            >
              Mostra tutte le collezioni
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="items-grid">
          {filteredItems.map((item) => (
            <ItemCardCompact key={item.item_id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3" data-testid="items-list">
          {filteredItems.map((item) => (
            <ItemRowDetailed key={item.item_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// Compact Grid Card
function ItemCardCompact({ item }) {
  return (
    <Link 
      to={`/oggetto/${item.item_id}`} 
      className="group flex flex-col gap-2 relative"
      data-testid={`item-card-${item.item_id}`}
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative border border-gray-100">
        <img
          src={item.images?.[0] || "https://via.placeholder.com/300"}
          alt={item.name}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {item.sealed && (
          <div className="absolute top-2 right-2">
            <Badge className="text-[9px] bg-blue-500 text-white border-0 shadow-md">
              <Box className="w-2.5 h-2.5 mr-0.5" />Sealed
            </Badge>
          </div>
        )}
        {item.visibility === "private" && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[9px] bg-gray-900 text-white border-0">
              <Lock className="w-2.5 h-2.5" />
            </Badge>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 group-hover:underline">
          {item.name}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>{item.condition}</span>
          {item.estimated_value && (
            <span className="font-semibold text-gray-900">€{item.estimated_value}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Detailed List Row
function ItemRowDetailed({ item }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors bg-white" data-testid={`item-row-${item.item_id}`}>
      <div className="flex items-start gap-4">
        <Link to={`/oggetto/${item.item_id}`} className="flex-shrink-0">
          <img 
            src={item.images?.[0] || "https://via.placeholder.com/100"} 
            alt={item.name}
            className="w-20 h-20 rounded-lg object-cover border border-gray-100"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-3">
              <Link 
                to={`/oggetto/${item.item_id}`} 
                className="text-sm font-semibold text-gray-900 hover:underline block truncate"
              >
                {item.name}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.collection_name} • {item.condition}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.sealed && (
                <Badge className="text-[9px] bg-blue-100 text-blue-800 border-0">
                  <Box className="w-2.5 h-2.5 mr-0.5" />Sealed
                </Badge>
              )}
              {item.visibility === "private" ? (
                <Badge className="text-[9px] bg-gray-100 text-gray-600 border-0">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />Privato
                </Badge>
              ) : (
                <Badge className="text-[9px] bg-green-100 text-green-700 border-0">
                  <Globe className="w-2.5 h-2.5 mr-0.5" />Pubblico
                </Badge>
              )}
            </div>
          </div>

          {/* Purchase Info */}
          {item.purchase_info && (item.purchase_info.store || item.purchase_info.date || item.purchase_info.price) && (
            <div className="bg-gray-50 rounded-lg p-2 mb-2">
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
                {item.purchase_info.store && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.purchase_info.store}
                  </span>
                )}
                {item.purchase_info.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.purchase_info.date).toLocaleDateString('it-IT')}
                  </span>
                )}
                {item.purchase_info.price && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Pagato €{item.purchase_info.price}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {item.estimated_value && (
                <span className="font-semibold text-gray-900">Valore: €{item.estimated_value}</span>
              )}
            </div>
            <Link to={`/oggetto/${item.item_id}`}>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full">
                <Edit className="w-3 h-3 mr-1" />
                Dettagli
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
