import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeftRight, Check, AlertTriangle, Plus, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TradeProposalModal({ open, onOpenChange, targetItem }) {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [moneyOffer, setMoneyOffer] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const fetchMyItems = async () => {
      try {
        const res = await axios.get(`${API}/users/${user.user_id}`);
        setMyItems((res.data.items || []).filter(i => i.transaction_type === "scambio"));
      } catch {}
      setLoading(false);
    };
    fetchMyItems();
  }, [open, user]);

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API}/trades`, {
        target_item_id: targetItem.item_id,
        offered_item_ids: selectedItems,
        money_offer: moneyOffer ? parseFloat(moneyOffer) : 0,
        message,
      }, { withCredentials: true });
      setDone(true);
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedItems([]); setMoneyOffer(""); setMessage(""); setDone(false);
    onOpenChange(false);
  };

  if (!targetItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="trade-proposal-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {done ? "Proposta Inviata!" : "Proponi Scambio"}
          </DialogTitle>
          <DialogDescription>
            {done ? "Il proprietario ricevera una notifica." : `Per "${targetItem.name}"`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6" data-testid="trade-success">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">La proposta e' stata inviata a {targetItem.owner_name}.</p>
            <Button onClick={handleClose} className="rounded-full bg-gray-900 text-white" data-testid="trade-done-btn">Chiudi</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Target item */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <img src={targetItem.images?.[0] || "https://via.placeholder.com/48"} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Vuoi: {targetItem.name}</p>
                <p className="text-xs text-gray-500">di {targetItem.owner_name}</p>
              </div>
            </div>

            {/* Select items to offer */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 block">Seleziona i tuoi oggetti da offrire</label>
              {selectedItems.length > 1 && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-3" data-testid="multi-item-warning">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">Stai offrendo {selectedItems.length} oggetti per questo scambio.</p>
                </div>
              )}
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-400">Caricamento...</div>
              ) : myItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Nessun oggetto scambiabile. Carica prima un oggetto!</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {myItems.map(item => {
                    const isSelected = selectedItems.includes(item.item_id);
                    return (
                      <button key={item.item_id} onClick={() => toggleItem(item.item_id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${isSelected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                        data-testid={`trade-select-${item.item_id}`}
                      >
                        <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                          <img src={item.images?.[0] || "https://via.placeholder.com/40"} alt="" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Money offer */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" /> Aggiungi differenza in denaro (opzionale)
              </label>
              <Input type="number" min="0" value={moneyOffer} onChange={(e) => setMoneyOffer(e.target.value)}
                placeholder="0" className="bg-white" data-testid="money-offer-input" />
              {moneyOffer && parseFloat(moneyOffer) > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">{selectedItems.length > 0 ? "Oggetti selezionati" : "Solo denaro"} + {moneyOffer} EUR</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Messaggio (opzionale)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi al proprietario..."
                className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none h-16"
                data-testid="trade-message-input" />
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-xl p-3">
              <span className="text-gray-500">La tua offerta:</span>
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && <Badge className="bg-gray-900 text-white text-[10px]">{selectedItems.length} oggetti</Badge>}
                {moneyOffer && parseFloat(moneyOffer) > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]">+ {moneyOffer} EUR</Badge>
                )}
                {selectedItems.length === 0 && (!moneyOffer || parseFloat(moneyOffer) <= 0) && (
                  <span className="text-xs text-gray-400">Niente selezionato</span>
                )}
              </div>
            </div>

            <Button onClick={handleSubmit}
              disabled={submitting || (selectedItems.length === 0 && (!moneyOffer || parseFloat(moneyOffer) <= 0))}
              className="w-full rounded-full bg-gray-900 text-white h-11"
              data-testid="trade-submit-btn"
            >
              {submitting ? "Invio..." : <><ArrowLeftRight className="w-4 h-4 mr-2" /> Invia Proposta</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
