import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, CONDITIONS } from "@/data/mockData";
import {
  Upload, Sparkles, Check, ChevronRight, ChevronLeft,
  Image as ImageIcon, X, Plus, Loader2, PenLine, Users, BarChart3,
  AlertTriangle, GripVertical, Eye, EyeOff, Lock, Globe, Package, Box, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CUSTOM_SUB = "__altra__";

export default function UploadModal({ open, onOpenChange, onItemCreated, defaultSection }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiWarning, setAiWarning] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  
  // NEW: Simplified - default to collection only, private
  const [transactionType, setTransactionType] = useState("collezione");
  const [visibility, setVisibility] = useState("private");
  const [desiredTradeFor, setDesiredTradeFor] = useState("");
  const [notes, setNotes] = useState("");
  
  // Collection management
  const [collectionPercentage, setCollectionPercentage] = useState("");
  const [autoCalculatePercentage, setAutoCalculatePercentage] = useState(true);
  
  // NEW: Sealed and Purchase Info
  const [isSealed, setIsSealed] = useState(false);
  const [purchaseStore, setPurchaseStore] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [seekersCount, setSeekersCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false); // NEW: show/hide advanced options

  const resetForm = useCallback(() => {
    setStep(1); setPhotos([]); setUploading(false);
    setAiLoading(false); setAiDone(false); setAiData(null); setAiWarning("");
    setName(""); setCategory(""); setSubcategory(""); setCustomSubcategory("");
    setTags([]); setTagInput(""); setEstimatedValue(""); setCondition("");
    setDescription(""); setTransactionType("collezione"); setDesiredTradeFor("");
    setNotes(""); setCollectionPercentage(""); setAutoCalculatePercentage(true);
    setVisibility("private"); setSubmitting(false); setDone(false); setSeekersCount(0);
    setShowAdvanced(false);
    setIsSealed(false); setPurchaseStore(""); setPurchaseDate(""); setPurchasePrice("");
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
    setPhotos(prev => [...prev, ...newPhotos]);
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
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (photos.length <= 1) { setAiDone(false); setAiData(null); setAiWarning(""); }
  };

  // Reorder: move photo to position 0 (set as main)
  const setAsMain = (index) => {
    if (index === 0) return;
    setPhotos(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.unshift(moved);
      return copy;
    });
  };

  // Swap two photos
  const swapPhotos = (i, j) => {
    setPhotos(prev => {
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const runAiRecognition = async () => {
    if (photos.length === 0) return;
    setAiLoading(true); setAiWarning("");
    try {
      const base64 = await fileToBase64(photos[0].file);
      const res = await axios.post(`${API}/recognize`, { image_base64: base64 }, { withCredentials: true });
      setAiData(res.data);
      const n = res.data.name || "";
      if (n.toLowerCase().includes("non identificato") || n.toLowerCase().includes("unknown")) {
        setAiWarning("L'AI non e' riuscita a identificare l'oggetto con certezza. Verifica i dati manualmente.");
      }
      if (photos.length > 1) {
        setAiWarning(prev => prev ? prev + " Hai caricato piu' foto: assicurati che siano tutte dello stesso oggetto." :
          "Hai caricato piu' foto: l'AI ha analizzato solo la prima. Assicurati che siano tutte dello stesso oggetto.");
      }
      setName(n);
      const matchedCat = CATEGORIES.find(c => c.label.toLowerCase() === (res.data.category || "").toLowerCase());
      if (matchedCat) {
        setCategory(matchedCat.label);
        const aiSub = res.data.subcategory || "";
        if (matchedCat.subcategories.includes(aiSub)) setSubcategory(aiSub);
        else if (aiSub) { setSubcategory(CUSTOM_SUB); setCustomSubcategory(aiSub); }
      } else { setCategory(res.data.category || ""); }
      setTags(res.data.tags || []);
      setEstimatedValue(res.data.estimated_value ? String(res.data.estimated_value) : "");
      setCondition(res.data.condition_hint || "");
      setDescription(res.data.description || "");
      // NOTE: Collection name is now auto-generated from category + subcategory - no manual input needed
      setAiDone(true);
    } catch (err) {
      setAiDone(true); setAiWarning("Errore nel riconoscimento AI. Compila i campi manualmente.");
      setName(""); setAiData(null);
    }
    setAiLoading(false);
  };

  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); } };
  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));
  const selectedCat = CATEGORIES.find(c => c.label === category);
  const effectiveSubcategory = subcategory === CUSTOM_SUB ? customSubcategory : subcategory;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const imageUrls = photos.map(p => p.uploadedUrl).filter(Boolean);
      
      // Auto-generate collection name from category + subcategory
      const collectionName = `${category || ""}${effectiveSubcategory ? " - " + effectiveSubcategory : ""}`.trim();
      
      const payload = {
        name, 
        category, 
        subcategory: effectiveSubcategory, 
        tags,
        condition: condition || "Buono",
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        transaction_type: transactionType, 
        description: `${description}${notes ? `\n\n${notes}` : ""}`,
        images: imageUrls, 
        desired_trade_for: desiredTradeFor,
        collection_name: collectionName,
        collection_percentage: collectionPercentage ? parseInt(collectionPercentage) : null,
        auto_calculate_percentage: autoCalculatePercentage,
        profile_section: "collezione", // Always starts in collection
        visibility: visibility, // Default private
        // NEW: Sealed and Purchase Info
        sealed: isSealed,
        purchase_store: purchaseStore,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      };
      
      const res = await axios.post(`${API}/items`, payload, { withCredentials: true });
      setSeekersCount(res.data.seekers_count || 0);
      setDone(true);
      if (onItemCreated) onItemCreated();
    } catch (err) { 
      console.error(err);
      alert("Errore nel caricamento dell'oggetto. Riprova.");
    }
    setSubmitting(false);
  };

  const handleClose = () => { resetForm(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" data-testid="upload-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{done ? "Oggetto Aggiunto!" : "Aggiungi alla Collezione"}</DialogTitle>
          <DialogDescription>{done ? "Il tuo oggetto è ora nella tua collezione privata." : `Step ${step} di 3: ${step === 1 ? "Foto" : step === 2 ? "Dettagli" : "Opzioni"}`}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6" data-testid="upload-success">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Oggetto aggiunto alla collezione!</p>
            <p className="text-xs text-gray-600 mb-3">"{name}" è ora nella tua collezione {category}{effectiveSubcategory ? " - " + effectiveSubcategory : ""}</p>
            {seekersCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-left" data-testid="seekers-info">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm font-semibold text-yellow-800">{seekersCount} persone cercano questo oggetto!</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">Considera di renderlo pubblico per proposte di scambio</p>
              </div>
            )}
            <Button onClick={handleClose} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white" data-testid="upload-done-btn">
              Vai alla Collezione
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            {/* Photo Grid with reorder */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group">
                  <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`remove-photo-${i}`}
                  ><X className="w-3 h-3 text-white" /></button>
                  {i !== 0 && (
                    <button onClick={() => setAsMain(i)}
                      className="absolute bottom-1 left-1 text-[8px] bg-white/90 text-gray-700 font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`set-main-${i}`}
                    >Principale</button>
                  )}
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded">Principale</span>}
                  {i > 0 && (
                    <button onClick={() => swapPhotos(i, i-1)}
                      className="absolute top-1 left-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`move-photo-${i}`}
                    ><GripVertical className="w-3 h-3 text-gray-500" /></button>
                  )}
                </div>
              ))}
              {photos.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors" data-testid="add-photo-btn">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFilesSelect(e.target.files)} />
                  <Plus className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[9px] text-gray-400">{photos.length === 0 ? "Aggiungi" : "Altre"}</span>
                </label>
              )}
            </div>
            {photos.length === 0 && (
              <label data-testid="upload-dropzone"
                className="block border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
              >
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFilesSelect(e.target.files)} />
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Trascina le foto qui</p>
                <p className="text-xs text-gray-400 mt-1">Max 6 foto. Clicca "Principale" per cambiare la foto copertina.</p>
              </label>
            )}
            {uploading && <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento...</div>}

            {/* AI Warning */}
            {aiWarning && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2" data-testid="ai-warning">
                <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800">{aiWarning}</p>
              </div>
            )}

            {photos.length > 0 && !aiDone && !aiLoading && (
              <Button onClick={runAiRecognition} disabled={uploading}
                className="w-full rounded-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-medium"
                data-testid="ai-recognize-btn"
              ><Sparkles className="w-4 h-4 mr-2" /> Riconosci con AI</Button>
            )}
            {aiLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center" data-testid="ai-loading">
                <Loader2 className="w-5 h-5 animate-spin text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">L'AI sta analizzando...</p>
              </div>
            )}
            {aiDone && !aiWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3" data-testid="ai-recognition">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">L'AI ha riconosciuto l'oggetto!</span>
                </div>
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={photos.length === 0 || uploading}
              className="w-full rounded-full bg-gray-900 text-white disabled:opacity-40" data-testid="upload-next-step-btn"
            >Avanti <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <PenLine className="w-3.5 h-3.5" />
              <span>{aiDone ? "Dati AI - modifica liberamente" : "Compila i dati"}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome oggetto" className="mt-1" data-testid="item-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Categoria</label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(""); setCustomSubcategory(""); }}>
                  <SelectTrigger className="mt-1" data-testid="category-select"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.label}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Serie</label>
                <Select value={subcategory} onValueChange={(v) => { setSubcategory(v); if (v !== CUSTOM_SUB) setCustomSubcategory(""); }}>
                  <SelectTrigger className="mt-1" data-testid="subcategory-select"><SelectValue placeholder="Serie" /></SelectTrigger>
                  <SelectContent>
                    {(selectedCat?.subcategories || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value={CUSTOM_SUB}><Plus className="w-3 h-3 inline mr-1" />Altra serie...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {subcategory === CUSTOM_SUB && (
              <Input value={customSubcategory} onChange={(e) => setCustomSubcategory(e.target.value)} placeholder="Nome serie..." className="mt-1" data-testid="custom-subcategory-input" />
            )}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Tag</label>
              <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0 pr-1 cursor-pointer hover:bg-gray-200" onClick={() => removeTag(tag)}>
                    {tag} <X className="w-2.5 h-2.5 ml-0.5" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Tag..." className="text-sm" data-testid="tag-input" />
                <Button onClick={addTag} variant="outline" size="sm" className="px-2"><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Valore (EUR)</label>
                <Input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="150" className="mt-1" data-testid="estimated-value-input" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Condizione</label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1" data-testid="condition-select"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Descrizione</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrivi..."
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none h-16 focus:outline-none focus:ring-2 focus:ring-gray-900" data-testid="description-input" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-full" data-testid="upload-back-btn"><ChevronLeft className="w-4 h-4 mr-1" /> Indietro</Button>
              <Button onClick={() => setStep(3)} disabled={!name} className="flex-1 rounded-full bg-gray-900 text-white" data-testid="upload-next-step2-btn">Avanti <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Collection Info - Always visible */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-semibold text-purple-900">La Tua Collezione</h3>
              </div>
              <div className="bg-white rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 mb-1">Questo oggetto verrà aggiunto a:</p>
                <p className="text-sm font-bold text-gray-900">{category || "Non specificato"}{effectiveSubcategory ? " - " + effectiveSubcategory : ""}</p>
              </div>
              
              {/* Percentage */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <Checkbox 
                    checked={autoCalculatePercentage}
                    onCheckedChange={setAutoCalculatePercentage}
                    data-testid="auto-percentage-check"
                  />
                  Calcola automaticamente % completamento
                </label>
                {!autoCalculatePercentage && (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={collectionPercentage} 
                      onChange={(e) => setCollectionPercentage(e.target.value)}
                      placeholder="% manuale" 
                      className="bg-white w-20 h-8 text-sm" 
                      data-testid="collection-percentage-input" 
                    />
                    <span className="text-xs text-gray-500">% di completamento collezione</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visibility - Simple */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {visibility === "public" ? <Globe className="w-4 h-4 text-gray-600" /> : <Lock className="w-4 h-4 text-gray-600" />}
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      {visibility === "public" ? "Visibile a tutti" : "Solo per me"}
                    </label>
                    <p className="text-[10px] text-gray-500">
                      {visibility === "public" 
                        ? "Altri collezionisti possono vedere questo oggetto" 
                        : "Solo tu puoi vederlo nella tua collezione"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={visibility === "public"} 
                  onCheckedChange={(checked) => setVisibility(checked ? "public" : "private")}
                  data-testid="visibility-toggle"
                />
              </div>
            </div>

            {/* Sealed Status Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-blue-600" />
                  <div>
                    <label className="text-sm font-medium text-blue-900 cursor-pointer">
                      Oggetto Sigillato (Box Sealed)
                    </label>
                    <p className="text-[10px] text-blue-600">
                      Ancora nella confezione originale sigillata
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isSealed} 
                  onCheckedChange={setIsSealed}
                  data-testid="sealed-toggle"
                />
              </div>
            </div>

            {/* Purchase Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Dettagli Acquisto (Opzionale)</h4>
              </div>
              <Input 
                placeholder="Dove l'hai comprato? (es. Amazon, GameStop, Fiera...)"
                value={purchaseStore}
                onChange={(e) => setPurchaseStore(e.target.value)}
                className="text-sm h-9"
                data-testid="purchase-store-input"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="text-sm h-9"
                  data-testid="purchase-date-input"
                  placeholder="Data acquisto"
                />
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="Prezzo pagato (€)"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="text-sm h-9"
                  data-testid="purchase-price-input"
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="toggle-advanced"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {showAdvanced ? "Nascondi" : "Mostra"} opzioni vendita/scambio
                </span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
              </div>
            </button>

            {/* Advanced Options - Collapsed by default */}
            {showAdvanced && (
              <div className="space-y-3 border-l-2 border-yellow-400 pl-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Disponibile per</label>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className="mt-1" data-testid="transaction-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collezione">Solo Collezione</SelectItem>
                      <SelectItem value="scambio">Scambio</SelectItem>
                      <SelectItem value="vendita">Vendita</SelectItem>
                      <SelectItem value="scambio_vendita">Scambio + Vendita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(transactionType === "scambio" || transactionType === "scambio_vendita") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <label className="text-[10px] uppercase tracking-wider text-yellow-700 font-semibold">Cerco in cambio</label>
                    <Input 
                      value={desiredTradeFor} 
                      onChange={(e) => setDesiredTradeFor(e.target.value)}
                      placeholder="Es. Pikachu VMAX, qualsiasi carta rara..." 
                      className="mt-1 bg-white border-yellow-200 text-sm" 
                      data-testid="desired-trade-input" 
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Note aggiuntive</label>
              <textarea 
                data-testid="upload-notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Aggiungi note o dettagli..."
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none h-14 focus:outline-none focus:ring-2 focus:ring-gray-900" 
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-0.5">
              <p className="font-medium text-gray-900 text-sm">{name}</p>
              <p className="text-gray-500">{category}{effectiveSubcategory ? ` / ${effectiveSubcategory}` : ""} - {condition || "N/D"}</p>
              <p className="text-gray-500">{photos.length} foto - {visibility === "private" ? "Privato" : "Pubblico"}</p>
              <p className="text-gray-500">
                Stato: {transactionType === "collezione" ? "Solo Collezione" : 
                       transactionType === "scambio" ? "Disponibile per scambio" :
                       transactionType === "vendita" ? "In vendita" : "Scambio + Vendita"}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 rounded-full"><ChevronLeft className="w-4 h-4 mr-1" /> Indietro</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !condition || !name}
                className="flex-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold" 
                data-testid="upload-submit-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Package className="w-4 h-4 mr-1.5" /> Aggiungi alla Collezione</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
