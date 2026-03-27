import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, ShoppingCart, Heart, ShieldCheck, ShieldAlert } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ItemCard({ item }) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isSwap = item.transaction_type === "scambio";

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await axios.delete(`${API}/wishlist/${item.item_id}`, { withCredentials: true });
        setWishlisted(false);
      } else {
        await axios.post(`${API}/wishlist/add`, { item_id: item.item_id }, { withCredentials: true });
        setWishlisted(true);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    }
    setWishlistLoading(false);
  };

  return (
    <div className="group flex flex-col gap-3 relative" data-testid={`item-card-${item.item_id}`}>
      <Link to={`/oggetto/${item.item_id}`} className="flex flex-col gap-3 cursor-pointer">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative border border-gray-100">
          <img
            src={item.images?.[0] || "https://via.placeholder.com/400"}
            alt={item.name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Transaction type badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="secondary"
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${
                isSwap
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {isSwap ? (
                <><ArrowLeftRight className="w-3 h-3 mr-1" />Scambio</>
              ) : (
                <><ShoppingCart className="w-3 h-3 mr-1" />Vendita</>
              )}
            </Badge>
          </div>

          {/* Community Verified Badge */}
          {item.community_verified && (
            <div className="absolute top-3 right-12 z-10" data-testid={`verified-badge-${item.item_id}`}>
              <div className="bg-blue-500 text-white rounded-full p-1 shadow-md" title="Verificato dalla Community">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
          {item.flagged_fake && (
            <div className="absolute top-3 right-12 z-10" data-testid={`fake-badge-${item.item_id}`}>
              <div className="bg-red-500 text-white rounded-full p-1 shadow-md" title="Segnalato come falso">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Desired trade info */}
          {item.desired_trade_for && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-yellow-400/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-medium text-yellow-900 truncate">
                Cerco: {item.desired_trade_for}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600 transition-colors">
            {item.name}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0 px-2 py-0.5">
              {item.category}
            </Badge>
            {item.subcategory && (
              <span className="text-[10px] text-gray-400">{item.subcategory}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            {item.estimated_value && (
              <span className="text-sm font-semibold text-gray-900">
                {item.estimated_value.toFixed(0)}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <img
                src={item.owner_avatar || "https://via.placeholder.com/24"}
                alt={item.owner_name}
                className="w-5 h-5 rounded-full object-cover border border-gray-200"
              />
              <span className="text-xs text-gray-500">{item.owner_name}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Wishlist Button */}
      {user && (
        <button
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            wishlisted
              ? "bg-red-500 text-white shadow-md"
              : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white shadow-sm"
          }`}
          data-testid={`wishlist-btn-${item.item_id}`}
          title={wishlisted ? "Rimuovi dai desideri" : "Aggiungi ai desideri"}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      )}
    </div>
  );
}
