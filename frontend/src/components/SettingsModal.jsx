import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, User, MapPin, Calendar, Instagram, MessageSquare, Youtube } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsModal({ open, onOpenChange, onProfileUpdate }) {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    bio: user?.bio || "",
    age: user?.age || "",
    city: user?.city || "",
    instagram: user?.instagram || "",
    discord: user?.discord || "",
    youtube: user?.youtube || "",
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Per favore carica un'immagine (PNG o JPG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'immagine deve essere inferiore a 5MB");
      return;
    }

    try {
      setAvatarLoading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API}/users/me/avatar`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh auth to get new avatar
      await checkAuth();
      onProfileUpdate?.();
      
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Errore nel caricamento dell'immagine");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await axios.put(`${API}/users/me`, formData, {
        withCredentials: true,
      });

      // Refresh auth to get updated data
      await checkAuth();
      onProfileUpdate?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Errore nel salvataggio del profilo");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">
            Impostazioni Profilo
          </DialogTitle>
          <DialogDescription>
            Modifica la tua foto profilo e le informazioni personali
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-yellow-400 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback className="text-2xl bg-yellow-100 text-yellow-700">
                  {user.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload Overlay */}
              <div 
                onClick={handleAvatarClick}
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
              >
                <Upload className="w-6 h-6 text-white" />
              </div>

              {avatarLoading && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <p className="text-xs text-gray-500 text-center">
              Clicca sull'immagine per caricare una nuova foto
            </p>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span>Bio</span>
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Es: Collezionista di carte Pokémon dal '98"
              className="resize-none h-20"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.bio.length}/200 caratteri
            </p>
          </div>

          {/* Age */}
          <div>
            <Label htmlFor="age" className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Età</span>
            </Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
              placeholder="Es: 25"
              min="13"
              max="120"
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span>Città</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Es: Milano, Roma, Napoli..."
            />
          </div>

          {/* Social Links */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-700">Social Media (opzionale)</h3>
            
            {/* Instagram */}
            <div className="mb-3">
              <Label htmlFor="instagram" className="flex items-center gap-2 mb-2">
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="username"
              />
            </div>

            {/* Discord */}
            <div className="mb-3">
              <Label htmlFor="discord" className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span>Discord</span>
              </Label>
              <Input
                id="discord"
                value={formData.discord}
                onChange={(e) => handleChange("discord", e.target.value)}
                placeholder="username#1234"
              />
            </div>

            {/* YouTube */}
            <div>
              <Label htmlFor="youtube" className="flex items-center gap-2 mb-2">
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
              </Label>
              <Input
                id="youtube"
                value={formData.youtube}
                onChange={(e) => handleChange("youtube", e.target.value)}
                placeholder="Link al canale"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
              disabled={loading}
            >
              {loading ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
