import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, CONDITIONS, AI_RECOGNITION_MOCK } from "@/data/mockData";
import { Upload, Sparkles, Check, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UploadModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [aiDetected, setAiDetected] = useState(false);
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [transactionType, setTransactionType] = useState("scambio");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const resetForm = useCallback(() => {
    setStep(1);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setAiDetected(false);
    setCondition("");
    setNotes("");
    setTransactionType("scambio");
    setSubmitting(false);
    setDone(false);
    setUploading(false);
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedImageUrl(`${process.env.REACT_APP_BACKEND_URL}${res.data.url}`);
    } catch (err) {
      console.error("Upload error:", err);
      // Use preview URL as fallback
      setUploadedImageUrl(previewUrl);
    }

    setUploading(false);
    // Simulate AI detection after short delay
    setTimeout(() => {
      setAiDetected(true);
    }, 1500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = { target: { files: [file] } };
      handleFileSelect(input);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: AI_RECOGNITION_MOCK.name,
        category: AI_RECOGNITION_MOCK.category,
        subcategory: AI_RECOGNITION_MOCK.subcategory,
        tags: AI_RECOGNITION_MOCK.tags,
        condition: condition || "Buono",
        transaction_type: transactionType,
        description: notes,
        images: uploadedImageUrl ? [uploadedImageUrl] : [],
      };
      await axios.post(`${API}/items`, payload, { withCredentials: true });
      setDone(true);
    } catch (err) {
      console.error("Create item error:", err);
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="upload-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {done ? "Oggetto Caricato!" : "Carica Oggetto"}
          </DialogTitle>
          <DialogDescription>
            {done ? "Il tuo oggetto e' ora visibile nella community." : `Step ${step} di 2`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8" data-testid="upload-success">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-6">
              L'oggetto "{AI_RECOGNITION_MOCK.name}" e' stato aggiunto con successo.
            </p>
            <Button onClick={handleClose} className="rounded-full bg-gray-900 text-white" data-testid="upload-done-btn">
              Chiudi
            </Button>
          </div>
        ) : step === 1 ? (
          /* STEP 1: Photo Upload */
          <div className="space-y-6">
            {!previewUrl ? (
              <label
                data-testid="upload-dropzone"
                className="block border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Trascina una foto qui</p>
                    <p className="text-xs text-gray-400 mt-1">oppure clicca per selezionare</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative max-w-[280px] mx-auto">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* AI Detection */}
                {aiDetected ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4" data-testid="ai-recognition">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">
                        L'AI ha riconosciuto l'oggetto!
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">Nome</label>
                        <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{AI_RECOGNITION_MOCK.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">Categoria</label>
                        <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{AI_RECOGNITION_MOCK.category} / {AI_RECOGNITION_MOCK.subcategory}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">Tag</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {AI_RECOGNITION_MOCK.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !uploading ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Analisi AI in corso...
                  </div>
                ) : null}
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!aiDetected}
              className="w-full rounded-full bg-gray-900 text-white disabled:opacity-40"
              data-testid="upload-next-step-btn"
            >
              Avanti <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          /* STEP 2: Condition & Notes */
          <div className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Condizione</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="mt-1.5" data-testid="condition-select">
                  <SelectValue placeholder="Seleziona condizione" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Tipo di transazione</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="mt-1.5" data-testid="transaction-type-select">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scambio">Scambio</SelectItem>
                  <SelectItem value="vendita">Vendita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Note (opzionale)</label>
              <textarea
                data-testid="upload-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi dettagli sul tuo oggetto..."
                className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none h-24"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 rounded-full"
                data-testid="upload-back-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !condition}
                className="flex-1 rounded-full bg-gray-900 text-white"
                data-testid="upload-submit-btn"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" /> Pubblica
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
