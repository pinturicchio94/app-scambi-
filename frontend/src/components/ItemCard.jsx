import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, ShoppingCart } from "lucide-react";

export default function ItemCard({ item }) {
  const isSwap = item.transaction_type === "scambio";

  return (
    <Link
      to={`/oggetto/${item.item_id}`}
      className="group flex flex-col gap-3 cursor-pointer"
      data-testid={`item-card-${item.item_id}`}
    >
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
  );
}
