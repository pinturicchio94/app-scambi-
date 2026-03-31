import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield, ShieldCheck, ShieldAlert, ThumbsUp, ThumbsDown,
  Eye, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function VoteModal({ open, onOpenChange, tribunalCase, onVoted }) {
  const [vote, setVote] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  const handleVote = async () => {
    if (!vote) {
      alert("Seleziona prima se l'oggetto è autentico o falso");
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/tribunal/vote/${tribunalCase.item_id}`, 
        { vote, comment }, 
        { withCredentials: true }
      );
      console.log("Voto inviato con successo:", response.data);
      alert("Voto inviato con successo! Grazie per il tuo contributo.");
      onVoted();
      onOpenChange(false);
      setVote(null);
      setComment("");
    } catch (err) {
      console.error("Errore nel voto:", err);
      const errorMsg = err.response?.data?.detail || "Errore nell'invio del voto. Riprova.";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!tribunalCase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="vote-modal">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            Esamina Oggetto
          </DialogTitle>
          <DialogDescription>Analizza le foto e vota se l'oggetto ti sembra autentico o una replica.</DialogDescription>
        </DialogHeader>

        {/* Item photos */}
        <div className="space-y-3">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
            <img
              src={tribunalCase.item_images?.[selectedImg] || "https://via.placeholder.com/400"}
              alt={tribunalCase.item_name}
              className="w-full h-full object-contain"
            />
          </div>
          {tribunalCase.item_images?.length > 1 && (
            <div className="flex gap-2">
              {tribunalCase.item_images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i === selectedImg ? "border-gray-900" : "border-gray-200"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Item info */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-sm font-medium text-gray-900">{tribunalCase.item_name}</p>
            <p className="text-xs text-gray-500">{tribunalCase.item_category}{tribunalCase.item_subcategory ? ` / ${tribunalCase.item_subcategory}` : ""}</p>
            <p className="text-xs text-gray-500">Valore dichiarato: {tribunalCase.item_value ? `${tribunalCase.item_value} EUR` : "N/D"}</p>
            <p className="text-xs text-gray-500">Proprietario: {tribunalCase.item_owner_name}</p>
          </div>

          {/* Reason */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-orange-800 mb-1">Motivo segnalazione:</p>
            <p className="text-xs text-orange-700">{tribunalCase.reason}</p>
            <p className="text-[10px] text-orange-500 mt-1">Segnalato da: {tribunalCase.reporter_name}</p>
          </div>

          {/* Previous votes summary */}
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-600" /> {tribunalCase.votes_authentic || 0} Autentico</span>
            <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500" /> {tribunalCase.votes_fake || 0} Falso</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {tribunalCase.votes?.length || 0} voti totali</span>
          </div>

          {/* Vote buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setVote("authentic")}
              className={`p-4 rounded-xl border-2 transition-all text-center ${vote === "authentic" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
              data-testid="vote-authentic-btn"
            >
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Autentico</p>
              <p className="text-[10px] text-green-600 mt-1">Sembra originale</p>
            </button>
            <button onClick={() => setVote("fake")}
              className={`p-4 rounded-xl border-2 transition-all text-center ${vote === "fake" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
              data-testid="vote-fake-btn"
            >
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-semibold text-red-800">Sospetto Falso</p>
              <p className="text-[10px] text-red-600 mt-1">Potrebbe essere una replica</p>
            </button>
          </div>

          {/* Comment */}
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Motivazione del voto (opzionale ma consigliata)..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none h-16 focus:outline-none focus:ring-2 focus:ring-gray-900"
            data-testid="vote-comment"
          />

          <Button 
            onClick={handleVote} 
            disabled={!vote || submitting}
            className="w-full rounded-full bg-gray-900 text-white h-11 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
            data-testid="submit-vote-btn"
            type="button"
          >
            {submitting ? "Invio in corso..." : vote ? "Invia Voto" : "Seleziona un voto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TribunalePage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, fake: 0, voting: 0 });
  const [loading, setLoading] = useState(true);
  const [voteModal, setVoteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchData = async () => {
    try {
      const [casesRes, statsRes] = await Promise.all([
        user ? axios.get(`${API}/tribunal/pending`, { withCredentials: true }) : Promise.resolve({ data: [] }),
        axios.get(`${API}/tribunal/stats`)
      ]);
      setCases(casesRes.data);
      setStats(statsRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openVote = (c) => {
    setSelectedCase(c);
    setVoteModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="tribunale-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">L'Oracolo</h1>
            <p className="text-sm text-gray-500">Tribunale Anti-Fake della Community</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 max-w-2xl">
          I collezionisti esperti ("Saggi") esaminano gli oggetti segnalati e votano sulla loro autenticita.
          Quando un oggetto raggiunge il quorum di voti positivi, riceve il bollino blu di "Verificato dalla Community".
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "In Esame", value: stats.voting, icon: <Clock className="w-4 h-4 text-yellow-600" />, color: "bg-yellow-50 border-yellow-200" },
          { label: "Verificati", value: stats.verified, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: "bg-green-50 border-green-200" },
          { label: "Segnalati Falsi", value: stats.fake, icon: <XCircle className="w-4 h-4 text-red-500" />, color: "bg-red-50 border-red-200" },
          { label: "Totale Casi", value: stats.total, icon: <Shield className="w-4 h-4 text-gray-500" />, color: "bg-gray-50 border-gray-200" },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{s.label}</span></div>
            <p className="text-2xl font-heading font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Eligibility Notice */}
      {user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-yellow-700" />
            <span className="text-sm font-semibold text-yellow-900">Il tuo ruolo</span>
          </div>
          <p className="text-xs text-yellow-800">
            {user.level === "Collezionista Esperto" || user.level === "Collezionista Intermedio"
              ? "Sei un Saggio! Puoi votare sugli oggetti segnalati."
              : "Diventa Collezionista Intermedio o Esperto per votare nel Tribunale. Continua a scambiare e ricevere valutazioni!"}
          </p>
        </div>
      )}

      {!user && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center mb-6">
          <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Accedi per partecipare al Tribunale</p>
        </div>
      )}

      {/* Pending Cases */}
      <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">Casi in Esame</h2>
      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nessun caso aperto. La community e' al sicuro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(c => (
            <div key={c.tribunal_id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors" data-testid={`tribunal-case-${c.tribunal_id}`}>
              <div className="flex items-start gap-4">
                <Link to={`/oggetto/${c.item_id}`} className="flex-shrink-0">
                  <img src={c.item_images?.[0] || "https://via.placeholder.com/80"} alt={c.item_name}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link to={`/oggetto/${c.item_id}`} className="text-sm font-medium text-gray-900 hover:underline truncate">{c.item_name}</Link>
                    <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-200">In Esame</Badge>
                    {c.item_value >= 200 && <Badge className="text-[10px] bg-purple-100 text-purple-800 border-purple-200">Alto Valore</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{c.item_category}{c.item_subcategory ? ` / ${c.item_subcategory}` : ""} - {c.item_owner_name}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1 text-orange-500" />{c.reason}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-600" /> {c.votes_authentic || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500" /> {c.votes_fake || 0}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.votes?.length || 0}/{3} voti</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {c.user_has_voted ? (
                    <Badge className="text-[10px] bg-gray-100 text-gray-500">Votato</Badge>
                  ) : c.is_own_item ? (
                    <Badge className="text-[10px] bg-gray-100 text-gray-500">Tuo oggetto</Badge>
                  ) : (
                    <Button onClick={() => openVote(c)} size="sm" className="rounded-full bg-gray-900 text-white text-xs h-8 px-3" data-testid={`vote-case-${c.tribunal_id}`}>
                      Esamina <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vote Modal */}
      <VoteModal open={voteModal} onOpenChange={setVoteModal} tribunalCase={selectedCase} onVoted={fetchData} />
    </div>
  );
}
