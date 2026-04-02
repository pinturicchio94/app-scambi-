import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import YellowPecoraMascot from "@/components/YellowPecoraMascot";
import { MOCK_USERS } from "@/data/mockData";
import { ArrowRight, Sparkles, ArrowLeftRight, MapPin, TrendingUp, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function HorizontalCarousel({ title, icon, items, seeAllLink }) {
  return (
    <section className="py-8" data-testid={`carousel-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-gray-900">{title}</h2>
        </div>
        <Link
          to={seeAllLink || "/esplora"}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          Vedi tutti <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.item_id} className="min-w-[200px] sm:min-w-[240px] snap-start">
            <ItemCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectorCard({ user: collector }) {
  return (
    <Link
      to={`/profilo/${collector.user_id}`}
      className="flex flex-col items-center gap-3 min-w-[140px] sm:min-w-[160px] p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-all group"
      data-testid={`collector-card-${collector.user_id}`}
    >
      <img
        src={collector.picture}
        alt={collector.name}
        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 group-hover:border-yellow-300 transition-colors"
      />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900 truncate">{collector.name}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{collector.location}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Seed mock data first
        await axios.post(`${API}/seed`).catch(() => {});
        const res = await axios.get(`${API}/items`);
        setItems(res.data);
      } catch (err) {
        console.error("Fetch items error:", err);
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const newArrivals = items.slice(0, 6);
  const trending = [...items].sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0)).slice(0, 6);
  const dailyItem = items[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="home-page">
      {/* Standalone Search Bar */}
      <section className="mt-6 sm:mt-8 mb-6" data-testid="homepage-search">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/esplora?search=${encodeURIComponent(searchQuery)}`; }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca nella collezione: Funko, Pokemon, Carte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 pr-32 text-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
                data-testid="homepage-search-input"
              />
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-6 h-10"
                data-testid="homepage-search-btn"
              >
                Cerca
              </Button>
            </div>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">🔍 Trova il tuo prossimo pezzo da collezione</p>
        </div>
      </section>

      {/* Yellow Pecora Banner - RIDIMENSIONATA */}
      <section className="mt-6" data-testid="yellow-pecora-banner">
        <div className="bg-yellow-400 rounded-2xl p-4 sm:p-6 flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="flex-1 z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800">Proposta del Giorno</span>
            </div>
            {dailyItem ? (
              <>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-1 line-clamp-1">
                  {dailyItem.name}
                </h2>
                <p className="text-xs text-yellow-900/70 mb-3 line-clamp-2 max-w-md">
                  Consigliato dalla Yellow Pecora! Alto potenziale di scambio.
                </p>
                <div className="flex gap-2">
                  <Link to={`/oggetto/${dailyItem.item_id}`}>
                    <Button size="sm" className="rounded-full bg-gray-900 text-white hover:bg-gray-800 text-xs h-8 px-4" data-testid="daily-item-cta">
                      <ArrowLeftRight className="w-3 h-3 mr-1" /> Dettagli
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-6 w-48 bg-yellow-500/30 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-yellow-500/20 rounded animate-pulse" />
              </div>
            )}
          </div>
          {/* Daily item image + Mascot - RIDOTTO */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {dailyItem?.images?.[0] && (
              <Link to={`/oggetto/${dailyItem.item_id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-yellow-300 shadow-lg block hover:scale-105 transition-transform" data-testid="daily-item-image-link">
                <img src={dailyItem.images[0]} alt={dailyItem?.name} className="w-full h-full object-cover" />
              </Link>
            )}
            <YellowPecoraMascot className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow" />
          </div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-2 right-16 w-20 h-20 border-2 border-yellow-800 rounded-full" />
            <div className="absolute bottom-4 left-6 w-12 h-12 border-2 border-yellow-800 rounded-full" />
          </div>
        </div>
      </section>

      {/* Match Perfetti Banner (shown to logged-in users) */}
      {user && items.length > 2 && (
        <section className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5 sm:p-6" data-testid="perfect-match-banner">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-5 h-5 text-yellow-700" />
            <h2 className="text-lg font-heading font-semibold text-yellow-900">Scambi Consigliati</h2>
          </div>
          <p className="text-sm text-yellow-800/70 mb-4">La Yellow Pecora ha trovato possibili match per te!</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {items.slice(0, 3).map((item) => (
              <Link
                key={item.item_id}
                to={`/oggetto/${item.item_id}`}
                className="flex items-center gap-3 min-w-[260px] bg-white rounded-lg p-3 border border-yellow-200 hover:border-yellow-400 transition-colors"
              >
                <img src={item.images?.[0]} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.owner_name}</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] flex-shrink-0">
                  Match!
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Caricamento...</p>
        </div>
      ) : (
        <>
          {/* Nuovi Arrivi */}
          <HorizontalCarousel
            title="Nuovi Arrivi"
            icon={<Clock className="w-5 h-5 text-gray-400" />}
            items={newArrivals}
            seeAllLink="/esplora?sort=newest"
          />

          {/* Trending */}
          <HorizontalCarousel
            title="Trending"
            icon={<TrendingUp className="w-5 h-5 text-gray-400" />}
            items={trending}
            seeAllLink="/esplora?sort=value"
          />

          {/* Collezionisti vicino a te */}
          <section className="py-8" data-testid="nearby-collectors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-gray-900">Collezionisti vicino a te</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
              {MOCK_USERS.map((u) => (
                <CollectorCard key={u.user_id} user={u} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
