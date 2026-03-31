import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowLeftRight, ShoppingCart, Repeat, TrendingUp, User, Package, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

export default function CompareDrawer({ open, onOpenChange, items, onRemoveItem }) {
  const [hoveredColumn, setHoveredColumn] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]" data-testid="compare-drawer">
        <DrawerHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="font-heading text-xl">Confronta Annunci</DrawerTitle>
              <DrawerDescription>Confronta fino a {items.length} oggetti affiancati</DrawerDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} data-testid="close-compare">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-x-auto p-4 sm:p-6">
          <div className="min-w-max">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(280px, 1fr))` }}>
              {items.map((item, idx) => (
                <div 
                  key={item.item_id} 
                  className={`relative border-2 rounded-2xl p-3 transition-all ${
                    hoveredColumn === idx ? 'border-yellow-400 shadow-lg' : 'border-gray-200'
                  }`}
                  onMouseEnter={() => setHoveredColumn(idx)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  data-testid={`compare-item-${idx}`}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveItem(item.item_id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 z-10 shadow-lg"
                    data-testid={`remove-compare-${idx}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Photo */}
                  <Link to={`/oggetto/${item.item_id}`} target="_blank" className="block mb-3">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative group">
                      <img 
                        src={item.images?.[0] || "https://via.placeholder.com/300"} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>

                  {/* Item Name */}
                  <h3 className="font-heading font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {item.name}
                  </h3>

                  {/* Comparison Table */}
                  <div className="space-y-2 text-xs">
                    {/* Transaction Type */}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1">
                        <ArrowLeftRight className="w-3 h-3" />
                        Tipo
                      </span>
                      <Badge className={`text-[10px] ${
                        item.transaction_type === "scambio" ? "bg-yellow-100 text-yellow-800" :
                        item.transaction_type === "vendita" ? "bg-green-100 text-green-800" :
                        item.transaction_type === "collezione" ? "bg-purple-100 text-purple-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {item.transaction_type === "scambio" ? "Scambio" :
                         item.transaction_type === "vendita" ? "Vendita" :
                         item.transaction_type === "collezione" ? "Collezione" :
                         "Scambio/Vendita"}
                      </Badge>
                    </div>

                    {/* Price / Value */}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Valore
                      </span>
                      <span className="font-semibold text-gray-900">
                        {item.estimated_value ? `€${item.estimated_value}` : "N/D"}
                      </span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Condizioni
                      </span>
                      <span className="font-medium text-gray-700">{item.condition || "N/D"}</span>
                    </div>

                    {/* Category */}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Categoria</span>
                      <span className="font-medium text-gray-700 text-right text-[10px]">
                        {item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}
                      </span>
                    </div>

                    {/* Owner Rating */}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Proprietario
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 text-[10px]">{item.owner_name || "N/D"}</span>
                        {item.community_verified && (
                          <Shield className="w-3 h-3 text-blue-500" title="Verificato" />
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="pt-2">
                        <span className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold block mb-1">Tag</span>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} className="text-[9px] bg-gray-100 text-gray-600 border-0">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge className="text-[9px] bg-gray-100 text-gray-500 border-0">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    {item.transaction_type !== "collezione" && (
                      <>
                        {(item.transaction_type === "vendita" || item.transaction_type === "scambio_vendita") && (
                          <Link to={`/oggetto/${item.item_id}`} className="block">
                            <Button className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white text-xs h-9" data-testid={`buy-item-${idx}`}>
                              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                              Acquista
                            </Button>
                          </Link>
                        )}
                        {(item.transaction_type === "scambio" || item.transaction_type === "scambio_vendita") && (
                          <Link to={`/oggetto/${item.item_id}`} className="block">
                            <Button variant="outline" className="w-full rounded-full text-xs h-9 border-gray-300" data-testid={`trade-item-${idx}`}>
                              <Repeat className="w-3.5 h-3.5 mr-1.5" />
                              Proponi Scambio
                            </Button>
                          </Link>
                        )}
                      </>
                    )}
                    {item.transaction_type === "collezione" && (
                      <Badge className="w-full text-center justify-center py-2 bg-purple-50 text-purple-700 border-purple-200">
                        Solo Collezione
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              💡 Passa il mouse su una colonna per evidenziarla. Clicca sulla foto per aprire l'annuncio in una nuova scheda.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
