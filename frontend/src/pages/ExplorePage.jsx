import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ItemCard from "@/components/ItemCard";
import { CATEGORIES, TRANSACTION_TYPES } from "@/data/mockData";
import { Filter, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function FilterSidebar({ filters, setFilters, className = "" }) {
  const toggleCategory = (catId) => {
    setFilters((f) => ({
      ...f,
      category: f.category === catId ? "" : catId,
      subcategory: "",
    }));
  };

  const toggleSubcategory = (sub) => {
    setFilters((f) => ({ ...f, subcategory: f.subcategory === sub ? "" : sub }));
  };

  const toggleTransaction = (type) => {
    setFilters((f) => ({ ...f, transaction_type: f.transaction_type === type ? "" : type }));
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === filters.category);

  return (
    <div className={className}>
      {/* Transaction Type */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Tipo Transazione</h3>
        <div className="space-y-2.5">
          {TRANSACTION_TYPES.map((t) => (
            <label key={t.id} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={filters.transaction_type === t.id}
                onCheckedChange={() => toggleTransaction(t.id)}
                data-testid={`filter-transaction-${t.id}`}
              />
              <span className="text-sm text-gray-700">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Categoria</h3>
        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={filters.category === cat.id}
                onCheckedChange={() => toggleCategory(cat.id)}
                data-testid={`filter-category-${cat.id}`}
              />
              <span className="text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategories (if category selected) */}
      {selectedCategory && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Sottocategoria</h3>
          <div className="space-y-2.5">
            {selectedCategory.subcategories.map((sub) => (
              <label key={sub} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={filters.subcategory === sub}
                  onCheckedChange={() => toggleSubcategory(sub)}
                  data-testid={`filter-subcategory-${sub}`}
                />
                <span className="text-sm text-gray-700">{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      {(filters.category || filters.transaction_type || filters.subcategory) && (
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full text-sm"
          onClick={() => setFilters({ category: "", subcategory: "", transaction_type: "", search: filters.search })}
          data-testid="filter-reset"
        >
          <X className="w-3.5 h-3.5 mr-1" /> Resetta Filtri
        </Button>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    transaction_type: "",
    search: searchParams.get("search") || "",
  });

  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setFilters((f) => ({ ...f, search: s }));
  }, [searchParams]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.category) {
          const cat = CATEGORIES.find((c) => c.id === filters.category);
          if (cat) params.set("category", cat.label);
        }
        if (filters.subcategory) params.set("subcategory", filters.subcategory);
        if (filters.transaction_type) params.set("transaction_type", filters.transaction_type);
        params.set("sort", sortBy);
        const res = await axios.get(`${API}/items?${params.toString()}`);
        setItems(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    };
    fetchItems();
  }, [filters, sortBy]);

  const activeFilterCount = [filters.category, filters.subcategory, filters.transaction_type].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="explore-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900">Esplora</h1>
          {filters.search && (
            <p className="text-sm text-gray-500 mt-1">
              Risultati per "<span className="font-medium text-gray-700">{filters.search}</span>"
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] rounded-full text-xs h-9 border-gray-200" data-testid="sort-select">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Ordina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Ultimi caricamenti</SelectItem>
              <SelectItem value="oldest">Meno recenti</SelectItem>
              <SelectItem value="price_asc">Prezzo crescente</SelectItem>
              <SelectItem value="price_desc">Prezzo decrescente</SelectItem>
              <SelectItem value="value">Piu pregiati</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden rounded-full text-xs h-9" data-testid="mobile-filter-toggle">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                Filtri
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 bg-gray-900 text-white text-[9px] px-1.5">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Filtri</SheetTitle>
                <SheetDescription>Filtra gli oggetti per categoria e tipo.</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar filters={filters} setFilters={setFilters} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" data-testid="active-filters">
          {filters.category && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0 pl-2.5 pr-1.5 py-1 cursor-pointer hover:bg-gray-200"
              onClick={() => setFilters(f => ({...f, category: "", subcategory: ""}))}
            >
              {CATEGORIES.find(c => c.id === filters.category)?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filters.subcategory && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0 pl-2.5 pr-1.5 py-1 cursor-pointer hover:bg-gray-200"
              onClick={() => setFilters(f => ({...f, subcategory: ""}))}
            >
              {filters.subcategory}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filters.transaction_type && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0 pl-2.5 pr-1.5 py-1 cursor-pointer hover:bg-gray-200"
              onClick={() => setFilters(f => ({...f, transaction_type: ""}))}
            >
              {TRANSACTION_TYPES.find(t => t.id === filters.transaction_type)?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          className="hidden md:block w-56 flex-shrink-0 pr-6 border-r border-gray-100"
        />

        {/* Items Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20" data-testid="no-results">
              <Filter className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Nessun oggetto trovato</p>
              <p className="text-gray-400 text-xs mt-1">Prova a cambiare i filtri</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" data-testid="items-grid">
              {items.map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
