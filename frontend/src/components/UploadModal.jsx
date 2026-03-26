import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, CONDITIONS } from "@/data/mockData";
import {
  Upload, Sparkles, Check, ChevronRight, ChevronLeft,
  Image as ImageIcon, X, Plus, Loader2, PenLine, Users, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CUSTOM_SUB = "__altra__";

export default function UploadModal({ open, onOpenChange, onItemCreated }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState("scambio");
  const [desiredTradeFor, setDesiredTradeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [collectionPercentage, setCollectionPercentage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [seekersCount, setSeekersCount] = useState(0);

  const resetForm = useCallback(() => {
    setStep(1); setPhotos([]); setUploading(false);
    setAiLoading(false); setAiDone(false); setAiData(null);
    setName(""); setCategory(""); setSubcategory(""); setCustomSubcategory("");
    setTags([]); setTagInput(""); setEstimatedValue(""); setCondition("");
    setDescription(""); setTransactionType("scambio"); setDesiredTradeFor("");
    setNotes(""); setCollectionName(""); setCollectionPercentage("");
    setSubmitting(false); setDone(false); setSeekersCount(0);
  }, []);

  const uploadSingleFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData, {
        withCredentials: true, headers: { "Content-Type": "multipart/form-data" },
      });
      return `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
    } catch { return null; }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });

  const handleFilesSelect = async (files) => {
    if (!files || files.length === 0) return;
    const newPhotos = [];
    for (const file of Array.from(files)) {
      if (photos.length + newPhotos.length >= 6) break;
      newPhotos.push({ file, previewUrl: URL.createObjectURL(file), uploadedUrl: null });
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(true);
    const updated = [...photos, ...newPhotos];
    for (let i = photos.length; i < updated.length; i++) {
      const url = await uploadSingleFile(updated[i].file);
      updated[i] = { ...updated[i], uploadedUrl: url };
    }
    setPhotos([...updated]);
    setUploading(false);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (photos.length <= 1) { setAiDone(false); setAiData(null); }
  };

  const runAiRecognition = async () => {
    if (photos.length === 0) return;
    setAiLoading(true);
    try {
      const base64 = await fileToBase64(photos[0].file);
      const res = await axios.post(`${API}/recognize`, { image_base64: base64 }, { withCredentials: true });
      setAiData(res.data);
      setName(res.data.name || "");
      // Map AI category to our list, or keep raw
      const matchedCat = CATEGORIES.find(c => c.label.toLowerCase() === (res.data.category || "").toLowerCase());
      if (matchedCat) {
        setCategory(matchedCat.label);
        // Check if AI subcategory is in the list
        const aiSub = res.data.subcategory || "";
        if (matchedCat.subcategories.includes(aiSub)) {
          setSubcategory(aiSub);
        } else if (aiSub) {
          setSubcategory(CUSTOM_SUB);
          setCustomSubcategory(aiSub);
        }
      } else {
        setCategory(res.data.category || "");
      }
      setTags(res.data.tags || []);
      setEstimatedValue(res.data.estimated_value ? String(res.data.estimated_value) : "");
      setCondition(res.data.condition_hint || "");
      setDescription(res.data.description || "");
      // Auto-suggest collection name from subcategory
      if (res.data.subcategory) {
        setCollectionName(`${res.data.category || ""} ${res.data.subcategory || ""}`.trim());
      }
      setAiDone(true);
    } catch (err) {
      console.error("AI recognition error:", err);
      setAiDone(true);
      setAiData({ name: "Oggetto non identificato", category: "Carte", tags: ["da verificare"] });
      setName("Oggetto non identificato");
    }
    setAiLoading(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  };
  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const selectedCat = CATEGORIES.find((c) => c.label === category);
  const effectiveSubcategory = subcategory === CUSTOM_SUB ? customSubcategory : subcategory;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const imageUrls = photos.map((p) => p.uploadedUrl).filter(Boolean);
      const payload = {
        name, category, subcategory: effectiveSubcategory, tags,
        condition: condition || "Buono",
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        transaction_type: transactionType,
        description: `${description}${notes ? `\n\n${notes}` : ""}`,
        images: imageUrls, desired_trade_for: desiredTradeFor,
        collection_name: collectionName,
        collection_percentage: collectionPercentage ? parseInt(collectionPercentage) : null,
      };
      const res = await axios.post(`${API}/items`, payload, { withCredentials: true });
      setSeekersCount(res.data.seekers_count || 0);
      setDone(true);
      if (onItemCreated) onItemCreated();
    } catch (err) { console.error("Create item error:", err); }
    setSubmitting(false);
  };

  const handleClose = () => { resetForm(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" data-testid="upload-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {done ? "Oggetto Caricato!" : "Carica Oggetto"}
          </DialogTitle>
          <DialogDescription>
            {done ? "Il tuo oggetto e' ora visibile nella community." : `Step ${step} di 3`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6" data-testid="upload-success">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              L'oggetto "{name}" e' stato aggiunto con successo.
            </p>
            {seekersCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-left" data-testid="seekers-info">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm font-semibold text-yellow-800">
                    {seekersCount} {seekersCount === 1 ? "persona sta cercando" : "persone stanno cercando"} questo oggetto!
                  </span>
                </div>
                <p className="text-xs text-yellow-700/70">
                  Abbiamo inviato una notifica Match Perfetto agli utenti interessati.
                </p>
              </div>
            )}
            <Button onClick={handleClose} className="rounded-full bg-gray-900 text-white" data-testid="upload-done-btn">
              Chiudi
            </Button>
          </div>
        ) : step === 1 ? (
          /* STEP 1: Photos + AI */
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                  <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
                    data-testid={`remove-photo-${i}`}
                  ><X className="w-3.5 h-3.5 text-white" /></button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded">Principale</span>
                  )}
                </div>
              ))}
              {photos.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors" data-testid="add-photo-btn">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFilesSelect(e.target.files)} />
                  <Plus className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-400">{photos.length === 0 ? "Aggiungi foto" : "Altre foto"}</span>
                </label>
              )}
            </div>

            {photos.length === 0 && (
              <label data-testid="upload-dropzone"
                className="block border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
              >
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFilesSelect(e.target.files)} />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Trascina le foto qui</p>
                    <p className="text-xs text-gray-400 mt-1">oppure clicca per selezionare (max 6 foto)</p>
                  </div>
                </div>
              </label>
            )}

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Caricamento foto...
              </div>
            )}

            {photos.length > 0 && !aiDone && !aiLoading && (
              <Button onClick={runAiRecognition} disabled={uploading}
                className="w-full rounded-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-medium"
                data-testid="ai-recognize-btn"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Riconosci con AI
              </Button>
            )}

            {aiLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center" data-testid="ai-loading">
                <Loader2 className="w-5 h-5 animate-spin text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">L'AI sta analizzando l'immagine...</p>
              </div>
            )}

            {aiDone && aiData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4" data-testid="ai-recognition">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">L'AI ha riconosciuto l'oggetto!</span>
                </div>
                <p className="text-xs text-yellow-700/70">Tutti i campi sono editabili. Verifica e correggi se necessario.</p>
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={photos.length === 0 || uploading}
              className="w-full rounded-full bg-gray-900 text-white disabled:opacity-40"
              data-testid="upload-next-step-btn"
            >
              Avanti <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : step === 2 ? (
          /* STEP 2: Item Details */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <PenLine className="w-3.5 h-3.5" />
              <span>{aiDone ? "Dati suggeriti dall'AI - modifica liberamente" : "Compila i dati dell'oggetto"}</span>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Nome oggetto</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Charizard Holo 1a Edizione" className="mt-1" data-testid="item-name-input" />
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Categoria</label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(""); setCustomSubcategory(""); }}>
                  <SelectTrigger className="mt-1" data-testid="category-select"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.label}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Sottocategoria / Serie</label>
                <Select value={subcategory} onValueChange={(v) => { setSubcategory(v); if (v !== CUSTOM_SUB) setCustomSubcategory(""); }}>
                  <SelectTrigger className="mt-1" data-testid="subcategory-select"><SelectValue placeholder="Serie" /></SelectTrigger>
                  <SelectContent>
                    {(selectedCat?.subcategories || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_SUB} data-testid="subcategory-other">
                      <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Altra serie...</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom subcategory input */}
            {subcategory === CUSTOM_SUB && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Nome serie personalizzata</label>
                <Input value={customSubcategory} onChange={(e) => setCustomSubcategory(e.target.value)}
                  placeholder="Es. One Piece, Naruto Shippuden..." className="mt-1" data-testid="custom-subcategory-input" />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Tag</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0 pr-1 cursor-pointer hover:bg-gray-200" onClick={() => removeTag(tag)}>
                    {tag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Aggiungi tag..." className="text-sm" data-testid="tag-input" />
                <Button onClick={addTag} variant="outline" size="sm" className="px-3" data-testid="add-tag-btn"><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Valore stimato (EUR)</label>
              <Input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="Es. 150" className="mt-1" data-testid="estimated-value-input" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Descrizione</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrivi il tuo oggetto..."
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none h-20"
                data-testid="description-input" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-full" data-testid="upload-back-btn">
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={() => setStep(3)} disabled={!name} className="flex-1 rounded-full bg-gray-900 text-white" data-testid="upload-next-step2-btn">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          /* STEP 3: Condition, Collection, Trade, Submit */
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Condizione</label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1" data-testid="condition-select"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Tipo transazione</label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="mt-1" data-testid="transaction-type-select"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scambio">Scambio</SelectItem>
                    <SelectItem value="vendita">Vendita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Collection */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <label className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Collezione (opzionale)</label>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                Cataloga l'oggetto in una collezione per tracciare il completamento
              </p>
              <Input value={collectionName} onChange={(e) => setCollectionName(e.target.value)}
                placeholder={`Es. ${category || "Funko Pop"} ${effectiveSubcategory || "One Piece"}`}
                className="mb-2 bg-white" data-testid="collection-name-input" />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500">% completamento (manuale)</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" min="0" max="100" value={collectionPercentage}
                    onChange={(e) => setCollectionPercentage(e.target.value)}
                    placeholder="Es. 45" className="bg-white w-24" data-testid="collection-percentage-input" />
                  <span className="text-sm text-gray-500">%</span>
                  <p className="text-[10px] text-gray-400 ml-1">Lascia vuoto per calcolo automatico</p>
                </div>
              </div>
            </div>

            {/* Desired Trade */}
            {transactionType === "scambio" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <label className="text-[10px] uppercase tracking-wider text-yellow-700 font-semibold block mb-1.5">Scambio desiderato (opzionale)</label>
                <p className="text-[11px] text-yellow-700/70 mb-2">Specifica con cosa vorresti scambiare questo oggetto</p>
                <Input value={desiredTradeFor} onChange={(e) => setDesiredTradeFor(e.target.value)}
                  placeholder="Es. Pikachu VMAX, qualsiasi carta rara Pokemon..."
                  className="bg-white border-yellow-200 focus:ring-yellow-400" data-testid="desired-trade-input" />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Note aggiuntive (opzionale)</label>
              <textarea data-testid="upload-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Altre informazioni utili..."
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none h-16" />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium text-gray-900">{name}</p>
              <p className="text-gray-500 text-xs">{category}{effectiveSubcategory ? ` / ${effectiveSubcategory}` : ""} - {condition || "N/D"}</p>
              <p className="text-gray-500 text-xs">{photos.length} foto - {transactionType}</p>
              {collectionName && <p className="text-gray-500 text-xs">Collezione: {collectionName} {collectionPercentage ? `(${collectionPercentage}%)` : ""}</p>}
              {desiredTradeFor && <p className="text-yellow-700 text-xs">Cerco: {desiredTradeFor}</p>}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 rounded-full" data-testid="upload-back-step3-btn">
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !condition || !name}
                className="flex-1 rounded-full bg-gray-900 text-white" data-testid="upload-submit-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1.5" /> Pubblica</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
