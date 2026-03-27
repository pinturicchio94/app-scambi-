import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import {
  Award, Shield, ArrowLeftRight, Star, Trophy, PenLine, Check,
  Eye, EyeOff, Plus, MessageCircle, Clock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BADGE_ICONS = {
  "Prima collezione": <Star className="w-3.5 h-3.5" />,
  "10 scambi": <ArrowLeftRight className="w-3.5 h-3.5" />,
  "5 scambi": <ArrowLeftRight className="w-3.5 h-3.5" />,
  "Super Trader": <Trophy className="w-3.5 h-3.5" />,
};

function CollectionRow({ coll, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [pct, setPct] = useState(String(coll.percentage || 0));
  const [saving, setSaving] = useState(false);
  const savePercentage = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/collections/${coll.collection_id}`, { percentage: parseInt(pct) || 0 }, { withCredentials: true });
      setEditing(false);
    } catch {}
    setSaving(false);
  };
  return (
    <div className="border border-gray-100 rounded-xl p-4" data-testid={`collection-${coll.collection_id}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{coll.name}</h3>
          <p className="text-[10px] text-gray-400">{coll.category}{coll.subcategory ? ` / ${coll.subcategory}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {coll.total > 0 && <span className="text-xs text-gray-500">{coll.owned}/{coll.total}</span>}
          {isOwner && !editing && (
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100" data-testid={`edit-collection-${coll.collection_id}`}>
              <PenLine className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      <Progress value={parseInt(pct) || coll.percentage || 0} className="h-2" />
      {editing ? (
        <div className="flex items-center gap-2 mt-2">
          <Input type="number" min="0" max="100" value={pct} onChange={(e) => setPct(e.target.value)}
            className="w-20 h-7 text-xs" data-testid={`collection-pct-input-${coll.collection_id}`} />
          <span className="text-xs text-gray-500">%</span>
          <Button onClick={savePercentage} disabled={saving} size="sm" className="h-7 px-2 rounded-full bg-gray-900 text-white">
            <Check className="w-3 h-3" />
          </Button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Annulla</button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">{parseInt(pct) || coll.percentage || 0}% completata</p>
      )}
    </div>
  );
}

function RatingStars({ score, size = "sm" }) {
  const s = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${s} ${i <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

function RatingModal({ open, onOpenChange, targetUserId, targetUserName, tradeId }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API}/ratings`, { rated_user_id: targetUserId, score, comment, trade_id: tradeId || "" }, { withCredentials: true });
      setDone(true);
    } catch {}
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setDone(false); setScore(5); setComment(""); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm" data-testid="rating-modal">
        <DialogHeader>
          <DialogTitle className="font-heading">{done ? "Valutazione Inviata!" : `Valuta ${targetUserName}`}</DialogTitle>
          <DialogDescription>{done ? "Grazie per il feedback." : "Come e' stata l'esperienza?"}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="text-center py-4">
            <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <Button onClick={() => onOpenChange(false)} className="rounded-full bg-gray-900 text-white mt-2">Chiudi</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setScore(i)} className="p-1" data-testid={`star-${i}`}>
                  <Star className={`w-8 h-8 transition-colors ${i <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 hover:text-yellow-200"}`} />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500">
              {score === 5 ? "Eccellente!" : score === 4 ? "Molto bene" : score === 3 ? "Nella media" : score === 2 ? "Sotto le aspettative" : "Pessimo"}
            </p>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Commento opzionale..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none h-16 focus:outline-none focus:ring-2 focus:ring-gray-900"
              data-testid="rating-comment" />
            <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full bg-gray-900 text-white" data-testid="rating-submit">
              {submitting ? "Invio..." : "Invia Valutazione"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PendingTradesSection() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/trades/pending`, { withCredentials: true });
        setTrades(res.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const handleTradeAction = async (tradeId, status) => {
    try {
      await axios.put(`${API}/trades/${tradeId}`, { status }, { withCredentials: true });
      setTrades(prev => prev.map(t => t.trade_id === tradeId ? { ...t, status } : t));
      // Open rating for accepted trades
      if (status === "accepted") {
        const trade = trades.find(t => t.trade_id === tradeId);
        if (trade) {
          setRatingTarget({ userId: trade.proposer_id, name: trade.proposer_name, tradeId });
          setRatingOpen(true);
        }
      }
    } catch {}
  };

  if (loading) return <p className="text-xs text-gray-400 text-center py-6">Caricamento...</p>;
  if (trades.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Nessuna proposta in attesa</p>;

  return (
    <div className="space-y-3" data-testid="pending-trades">
      {trades.map(trade => {
        const isReceiver = trade.receiver_id === user?.user_id;
        return (
          <div key={trade.trade_id} className="border border-gray-100 rounded-xl p-4" data-testid={`trade-${trade.trade_id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">
                  {isReceiver ? `${trade.proposer_name} ti propone` : `Proposta a ${trade.receiver_name}`}
                </span>
              </div>
              <Badge className={`text-[10px] ${trade.status === "pending" ? "bg-yellow-100 text-yellow-800" : trade.status === "accepted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {trade.status === "pending" ? "In Attesa" : trade.status === "accepted" ? "Accettata" : "Rifiutata"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 mb-2">
              <img src={trade.target_item?.images?.[0] || "https://via.placeholder.com/32"} alt="" className="w-8 h-8 rounded object-cover" />
              <span className="text-xs text-gray-700 truncate">{trade.target_item?.name}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Offre: {trade.offered_items?.length || 0} oggetti {trade.money_offer ? `+ ${trade.money_offer} EUR` : ""}
            </div>
            {trade.message && <p className="text-xs text-gray-400 italic mb-2">"{trade.message}"</p>}
            {isReceiver && trade.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleTradeAction(trade.trade_id, "accepted")} className="flex-1 rounded-full bg-green-600 text-white h-8 text-xs" data-testid={`accept-trade-${trade.trade_id}`}>
                  Accetta
                </Button>
                <Button onClick={() => handleTradeAction(trade.trade_id, "rejected")} variant="outline" className="flex-1 rounded-full h-8 text-xs" data-testid={`reject-trade-${trade.trade_id}`}>
                  Rifiuta
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {ratingTarget && (
        <RatingModal open={ratingOpen} onOpenChange={setRatingOpen}
          targetUserId={ratingTarget.userId} targetUserName={ratingTarget.name} tradeId={ratingTarget.tradeId} />
      )}
    </div>
  );
}

function CollectionSuggestions({ userId }) {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/collections/${userId}/suggestions`);
        setSuggestions(res.data);
      } catch {}
    };
    fetch();
  }, [userId]);
  if (suggestions.length === 0) return null;
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4" data-testid="collection-suggestions">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-semibold text-yellow-800">Suggerimenti per completare le tue collezioni</span>
      </div>
      <div className="space-y-2">
        {suggestions.slice(0, 5).map((s, i) => (
          <Link key={i} to={`/oggetto/${s.suggested_item.item_id}`}
            className="flex items-center gap-3 bg-white rounded-lg p-2 hover:bg-gray-50 transition-colors">
            <img src={s.suggested_item.images?.[0] || "https://via.placeholder.com/32"} alt="" className="w-8 h-8 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{s.suggested_item.name}</p>
              <p className="text-[10px] text-gray-400">da {s.suggested_item.owner_name} - per "{s.collection_name}"</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[9px]">Ti manca!</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const defaultTab = searchParams.get("tab") || "collezione_privata";
  const isOwner = currentUser && currentUser.user_id === userId;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/users/${userId}`);
      setProfile(res.data);
      if (currentUser && currentUser.user_id === userId) {
        try { const wl = await axios.get(`${API}/wishlist`, { withCredentials: true }); setWishlistItems(wl.data); } catch {}
      }
    } catch {}
    setLoading(false);
  }, [userId, currentUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const toggleVisibility = async (itemId, current) => {
    const next = current === "private" ? "public" : "private";
    try {
      await axios.put(`${API}/items/${itemId}/visibility`, { visibility: next }, { withCredentials: true });
      fetchProfile();
    } catch {}
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4"><div className="w-20 h-20 bg-gray-100 rounded-full" /><div className="space-y-2"><div className="h-6 bg-gray-100 rounded w-40" /></div></div>
      </div>
    </div>
  );
  if (!profile) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="text-gray-500">Profilo non trovato</p></div>;

  const items = profile.items || [];
  const collections = profile.collections || [];
  const privateItems = items.filter(i => i.profile_section === "collezione_privata");
  const swapOnlyItems = items.filter(i => i.profile_section === "scambiabili" || (i.transaction_type === "scambio" && i.profile_section !== "vendita" && i.profile_section !== "scambio_vendita" && i.profile_section !== "collezione_privata"));
  const saleOnlyItems = items.filter(i => i.profile_section === "vendita" || (i.transaction_type === "vendita" && i.profile_section !== "scambiabili" && i.profile_section !== "scambio_vendita" && i.profile_section !== "collezione_privata"));
  const openItems = items.filter(i => i.profile_section === "scambio_vendita" || (!i.profile_section && i.transaction_type !== "vendita"));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="profile-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
        <img src={profile.picture || "https://via.placeholder.com/80"} alt={profile.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" data-testid="profile-avatar" />
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900" data-testid="profile-name">{profile.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{profile.level || "Principiante"}</span>
            </div>
            {profile.avg_rating > 0 && (
              <div className="flex items-center gap-1.5" data-testid="user-rating">
                <RatingStars score={Math.round(profile.avg_rating)} />
                <span className="text-xs text-gray-500">{profile.avg_rating}/5 ({profile.rating_count})</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(profile.badges || []).map((badge) => (
              <Badge key={badge} variant="secondary" className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5">
                {BADGE_ICONS[badge] || <Award className="w-3 h-3" />}
                <span className="ml-1">{badge}</span>
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-5">
          {[{ n: items.length, l: "Oggetti" }, { n: collections.length, l: "Collezioni" }].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-xl font-heading font-bold text-gray-900">{s.n}</p>
              <p className="text-[10px] text-gray-500">{s.l}</p>
            </div>
          ))}
          {!isOwner && currentUser && (
            <Button variant="outline" size="sm" className="rounded-full text-xs self-center"
              onClick={() => setRatingOpen(true)} data-testid="rate-user-btn">
              <Star className="w-3.5 h-3.5 mr-1" /> Valuta
            </Button>
          )}
        </div>
      </div>

      {/* Collection Suggestions */}
      {isOwner && <CollectionSuggestions userId={userId} />}

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full mt-6" data-testid="profile-tabs">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 rounded-none h-auto p-0 gap-0 overflow-x-auto flex-nowrap">
          {[
            { value: "collezione_privata", label: "Collezione Privata" },
            { value: "scambiabili", label: "Scambiabili" },
            { value: "vendita", label: "In Vendita" },
            { value: "desideri", label: "Lista Desideri" },
            { value: "scambio_vendita", label: "Scambio/Vendita" },
            ...(isOwner ? [{ value: "proposte", label: "Proposte" }] : []),
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap"
              data-testid={`tab-${tab.value}`}
            >{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Collezione Privata */}
        <TabsContent value="collezione_privata" className="pt-6" data-testid="tab-content-collezione-privata">
          {collections.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Collezioni</h3>
              {collections.map(coll => <CollectionRow key={coll.collection_id} coll={coll} isOwner={isOwner} />)}
            </div>
          )}
          {privateItems.length > 0 || items.filter(i => !i.profile_section || i.profile_section === "collezione_privata").length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(privateItems.length > 0 ? privateItems : items.slice(0, 6)).map(item => (
                <div key={item.item_id} className="relative">
                  <ItemCard item={item} />
                  {isOwner && (
                    <button onClick={() => toggleVisibility(item.item_id, item.visibility)}
                      className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm"
                      title={item.visibility === "private" ? "Rendi visibile" : "Nascondi"}
                      data-testid={`toggle-visibility-${item.item_id}`}
                    >
                      {item.visibility === "private" ? <EyeOff className="w-3.5 h-3.5 text-gray-500" /> : <Eye className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nessun oggetto nella collezione privata</p>
          )}
        </TabsContent>

        {/* Scambiabili */}
        <TabsContent value="scambiabili" className="pt-6">
          {swapOnlyItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {swapOnlyItems.map(item => <ItemCard key={item.item_id} item={item} />)}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">Nessun oggetto scambiabile</p>}
        </TabsContent>

        {/* In Vendita */}
        <TabsContent value="vendita" className="pt-6">
          {saleOnlyItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {saleOnlyItems.map(item => <ItemCard key={item.item_id} item={item} />)}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">Nessun oggetto in vendita</p>}
        </TabsContent>

        {/* Lista Desideri */}
        <TabsContent value="desideri" className="pt-6">
          {isOwner && wishlistItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlistItems.map(item => <ItemCard key={item.item_id} item={item} />)}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">La lista desideri e' vuota. Aggiungi oggetti cliccando il cuore!</p>}
        </TabsContent>

        {/* Scambio/Vendita */}
        <TabsContent value="scambio_vendita" className="pt-6">
          <p className="text-xs text-gray-400 mb-4">Oggetti aperti a qualsiasi proposta: scambio, denaro o entrambi.</p>
          {openItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {openItems.map(item => <ItemCard key={item.item_id} item={item} />)}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">Nessun oggetto in scambio/vendita</p>}
        </TabsContent>

        {/* Proposte in Attesa */}
        {isOwner && (
          <TabsContent value="proposte" className="pt-6">
            <PendingTradesSection />
          </TabsContent>
        )}
      </Tabs>

      {/* Rating Modal */}
      <RatingModal open={ratingOpen} onOpenChange={setRatingOpen}
        targetUserId={userId} targetUserName={profile.name} />
    </div>
  );
}
