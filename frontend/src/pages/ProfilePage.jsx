import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ItemCard from "@/components/ItemCard";
import { MOCK_COLLECTIONS } from "@/data/mockData";
import { Award, Shield, ArrowLeftRight, Star, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BADGE_ICONS = {
  "Prima collezione": <Star className="w-3.5 h-3.5" />,
  "10 scambi": <ArrowLeftRight className="w-3.5 h-3.5" />,
  "5 scambi": <ArrowLeftRight className="w-3.5 h-3.5" />,
  "Super Trader": <Trophy className="w-3.5 h-3.5" />,
};

export default function ProfilePage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const defaultTab = searchParams.get("tab") || "collezioni";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-100 rounded w-40" />
              <div className="h-4 bg-gray-50 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-gray-500">Profilo non trovato</p>
      </div>
    );
  }

  const items = profile.items || [];
  const swappableItems = items.filter((i) => i.transaction_type === "scambio");
  const sellableItems = items.filter((i) => i.transaction_type === "vendita");
  const userCollections = MOCK_COLLECTIONS.filter((c) => c.owner_id === userId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" data-testid="profile-page">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        <img
          src={profile.picture || "https://via.placeholder.com/80"}
          alt={profile.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          data-testid="profile-avatar"
        />
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900" data-testid="profile-name">
            {profile.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500" data-testid="profile-level">{profile.level || "Principiante"}</span>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3" data-testid="profile-badges">
            {(profile.badges || []).map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1"
              >
                {BADGE_ICONS[badge] || <Award className="w-3.5 h-3.5" />}
                <span className="ml-1">{badge}</span>
              </Badge>
            ))}
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-6 sm:gap-8">
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500">Oggetti</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-gray-900">{userCollections.length}</p>
            <p className="text-xs text-gray-500">Collezioni</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-gray-900">{swappableItems.length}</p>
            <p className="text-xs text-gray-500">Scambi</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full" data-testid="profile-tabs">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 rounded-none h-auto p-0 gap-0 overflow-x-auto">
          {[
            { value: "collezioni", label: "Collezioni Ufficiali" },
            { value: "doppioni", label: "Doppioni" },
            { value: "scambiabili", label: "Scambiabili" },
            { value: "vendita", label: "In Vendita" },
            { value: "desideri", label: "Lista Desideri" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium"
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Collections */}
        <TabsContent value="collezioni" className="pt-6" data-testid="tab-content-collezioni">
          {userCollections.length > 0 ? (
            <div className="space-y-4">
              {userCollections.map((coll) => (
                <div key={coll.id} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">{coll.name}</h3>
                    <span className="text-xs text-gray-500">{coll.owned}/{coll.total}</span>
                  </div>
                  <Progress value={coll.percentage} className="h-2" />
                  <p className="text-xs text-gray-400 mt-2">{coll.percentage}% completata</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">Nessuna collezione ufficiale</p>
          )}
        </TabsContent>

        {/* Doppioni */}
        <TabsContent value="doppioni" className="pt-6" data-testid="tab-content-doppioni">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {items.slice(0, 4).map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">Nessun doppione</p>
          )}
        </TabsContent>

        {/* Scambiabili */}
        <TabsContent value="scambiabili" className="pt-6" data-testid="tab-content-scambiabili">
          {swappableItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {swappableItems.map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">Nessun oggetto scambiabile</p>
          )}
        </TabsContent>

        {/* In Vendita */}
        <TabsContent value="vendita" className="pt-6" data-testid="tab-content-vendita">
          {sellableItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sellableItems.map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">Nessun oggetto in vendita</p>
          )}
        </TabsContent>

        {/* Lista Desideri */}
        <TabsContent value="desideri" className="pt-6" data-testid="tab-content-desideri">
          <p className="text-sm text-gray-400 text-center py-10">La lista desideri e' vuota</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
