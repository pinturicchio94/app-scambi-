import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareBar({ selectedCount, maxItems, onCompare, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t-2 border-yellow-400"
      data-testid="compare-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {selectedCount === 1 ? "1 oggetto selezionato" : `${selectedCount} oggetti selezionati`}
            </p>
            <p className="text-xs text-gray-400">
              {selectedCount < maxItems ? `Puoi selezionarne fino a ${maxItems}` : "Limite massimo raggiunto"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-white hover:bg-gray-800 rounded-full h-9 px-3"
            data-testid="clear-compare"
          >
            <X className="w-4 h-4 mr-1" />
            Pulisci
          </Button>
          <Button
            onClick={onCompare}
            disabled={selectedCount < 2}
            className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold h-9 px-4"
            data-testid="open-compare"
          >
            Confronta
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
