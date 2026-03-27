import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TradeProposalModal from "@/components/TradeProposalModal";
import ChatDrawer from "@/components/ChatDrawer";
import { ArrowLeftRight, ShoppingCart, Heart, ChevronLeft, Sparkles, Tag, Shield, Star, Target, MessageCircle, ShieldCheck, ShieldAlert, AlertTriangle, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ItemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tribunal, setTribunal] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`${API}/items/${id}`);
        setItem(res.data);
      } catch (err) {
        console.error("Fetch item error:", err);
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchTribunal = async () => {
      try {
        const res = await axios.get(`${API}/tribunal/item/${id}`);
        setTribunal(res.data);
      } catch {}
    };
    if (id) fetchTribunal();
  }, [id]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      const res = await axios.post(`${API}/tribunal/report`, { item_id: id, reason: reportReason }, { withCredentials: true });
      setTribunal(res.data);
      setShowReportForm(false);
      setReportReason("");
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.message || "Errore nella segnalazione");
    }
    setReporting(false);
  };

  const toggleWishlist = async () => {
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
    } catch {}
    setWishlistLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-50 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-gray-500">Oggetto non trovato</p>
        <Link to="/esplora" className="text-sm text-gray-900 underline mt-2 inline-block">Torna a Esplora</Link>
      </div>
    );
  }

  const isSwap = item.transaction_type === "scambio";
  const isOwnItem = user && user.user_id === item.owner_id;
  const showMatch = user && isSwap && !isOwnItem;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="item-detail-page">
      <Link to="/esplora" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6" data-testid="back-to-explore">
        <ChevronLeft className="w-4 h-4" /> Torna a Esplora
      </Link>

      {showMatch && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3" data-testid="perfect-match-banner">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-yellow-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-900">Match Perfetto!</p>
            <p className="text-xs text-yellow-800/70">Tu e {item.owner_name} avete oggetti compatibili per uno scambio.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: Gallery */}
        <div data-testid="item-gallery">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <img src={item.images?.[0] || "https://via.placeholder.com/600"} alt={item.name} className="w-full h-full object-cover" />
          </div>
          {(item.images || []).length > 1 && (
            <div className="flex gap-2 mt-3">
              {item.images.map((img, i) => (
                <div key={i} className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${i === 0 ? "border-gray-900" : "border-gray-200"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-5" data-testid="item-info">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0">{item.category}</Badge>
            {item.subcategory && <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0">{item.subcategory}</Badge>}
            <Badge className={`text-[10px] ${isSwap ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {isSwap ? "Scambio" : "Vendita"}
            </Badge>
            {item.community_verified && (
              <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-200" data-testid="verified-badge">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verificato dalla Community
              </Badge>
            )}
            {item.flagged_fake && (
              <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200" data-testid="fake-badge">
                <ShieldAlert className="w-3 h-3 mr-1" /> Segnalato Falso
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900" data-testid="item-name">{item.name}</h1>

          <div className="flex flex-wrap gap-1.5" data-testid="item-tags">
            {item.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Condizione</p>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{item.condition}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Valore Medio</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {item.estimated_value ? `${item.estimated_value.toFixed(0)} EUR` : "N/D"}
                </span>
              </div>
            </div>
          </div>

          {item.description && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Descrizione</p>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          {item.desired_trade_for && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4" data-testid="desired-trade-info">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Scambio desiderato</span>
              </div>
              <p className="text-sm text-yellow-900">{item.desired_trade_for}</p>
            </div>
          )}

          {/* Owner + Chat */}
          <div className="flex items-center gap-3">
            <Link to={`/profilo/${item.owner_id}`}
              className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors"
              data-testid="item-owner-link"
            >
              <img src={item.owner_avatar || "https://via.placeholder.com/40"} alt={item.owner_name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.owner_name}</p>
                <p className="text-xs text-gray-500">Proprietario</p>
              </div>
            </Link>
            {user && !isOwnItem && (
              <Button variant="outline" className="rounded-full h-10 px-3" onClick={() => setChatOpen(true)} data-testid="chat-owner-btn">
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base font-medium"
              data-testid="propose-trade-btn"
              disabled={isOwnItem || !user}
              onClick={() => setTradeOpen(true)}
            >
              <ArrowLeftRight className="w-5 h-5 mr-2" /> Proponi Scambio
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full h-10" data-testid="buy-btn" disabled={isOwnItem || !user}>
                <ShoppingCart className="w-4 h-4 mr-1.5" /> {item.estimated_value ? `${item.estimated_value.toFixed(0)} EUR` : "Compra"}
              </Button>
              <Button variant="outline"
                className={`flex-1 rounded-full h-10 ${wishlisted ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : ""}`}
                data-testid="wishlist-btn"
                onClick={toggleWishlist}
                disabled={!user}
              >
                <Heart className={`w-4 h-4 mr-1.5 ${wishlisted ? "fill-current" : ""}`} />
                {wishlisted ? "Aggiunto" : "Desideri"}
              </Button>
            </div>
          </div>

          {/* Tribunale Anti-Fake Section */}
          <div className="border border-gray-100 rounded-xl p-4 mt-2" data-testid="tribunal-section">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Verifica Community</span>
            </div>
            {tribunal?.status === "verified" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Verificato dalla Community</p>
                  <p className="text-[10px] text-blue-700">{tribunal.votes_authentic} Saggi confermano l'autenticita</p>
                </div>
              </div>
            ) : tribunal?.status === "fake" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Non ha superato la verifica</p>
                  <p className="text-[10px] text-red-700">{tribunal.votes_fake} Saggi ritengono l'oggetto sospetto</p>
                </div>
              </div>
            ) : tribunal?.status === "voting" ? (
              <div className="space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">In esame dal Tribunale</p>
                  <div className="flex items-center gap-3 text-xs text-yellow-800">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-600" /> {tribunal.votes_authentic || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500" /> {tribunal.votes_fake || 0}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(tribunal.votes?.length || 0)}/3 voti</span>
                  </div>
                </div>
                <Link to="/tribunale" className="text-xs text-gray-500 hover:text-gray-900 underline">Vai al Tribunale per votare</Link>
              </div>
            ) : (
              <>
                {!item.community_verified && user && !isOwnItem && !showReportForm && (
                  <button onClick={() => setShowReportForm(true)}
                    className="text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                    data-testid="report-fake-btn"
                  >
                    <AlertTriangle className="w-3 h-3" /> Segnala come sospetto
                  </button>
                )}
                {showReportForm && (
                  <div className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-orange-800">Perche' ritieni questo oggetto sospetto?</p>
                    <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Es. Le foto sembrano prese da internet, i colori non corrispondono al modello originale..."
                      className="w-full px-3 py-2 text-xs border border-orange-200 rounded-lg resize-none h-14 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      data-testid="report-reason-input"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleReport} disabled={reporting || !reportReason.trim()} size="sm"
                        className="rounded-full bg-orange-600 text-white text-xs h-7 px-3" data-testid="report-submit-btn"
                      >{reporting ? "Invio..." : "Invia Segnalazione"}</Button>
                      <button onClick={() => { setShowReportForm(false); setReportReason(""); }} className="text-xs text-gray-400 hover:text-gray-600">Annulla</button>
                    </div>
                  </div>
                )}
                {!user && <p className="text-xs text-gray-400">Accedi per segnalare oggetti sospetti</p>}
                {isOwnItem && !item.community_verified && (
                  <p className="text-xs text-gray-400">I tuoi oggetti possono essere segnalati da altri utenti per la verifica.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      <TradeProposalModal open={tradeOpen} onOpenChange={setTradeOpen} targetItem={item} />

      {/* Chat Drawer */}
      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialUser={item ? { user_id: item.owner_id, name: item.owner_name, picture: item.owner_avatar } : null}
        initialItem={item}
      />
    </div>
  );
}
