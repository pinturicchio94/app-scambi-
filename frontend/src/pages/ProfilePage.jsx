import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Star, Shield, MessageCircle, ArrowLeftRight, 
  Package, ShoppingBag, CheckCircle, MapPin, Calendar,
  Mail, ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import TradeProposalModal from "@/components/TradeProposalModal";
import ChatDrawer from "@/components/ChatDrawer";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Rating Stars Component
function RatingStars({ score, size = "sm" }) {
  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i <= score
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// Item Card Component
function ItemCard({ item, onClick }) {
  const getBadgeColor = (type) => {
    if (type === "vendita" || type === "scambio_vendita") return "bg-green-500";
    if (type === "scambio") return "bg-blue-500";
    return "bg-gray-400";
  };

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      data-testid={`item-${item.item_id}`}
    >
      {/* Image */}
      {item.images && item.images[0] ? (
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Package className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Info on Hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
        <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
          {item.name}
        </h4>
        {item.estimated_value && (
          <p className="text-white/90 text-xs">€{item.estimated_value}</p>
        )}
      </div>

      {/* Badge */}
      {item.transaction_type && (
        <div
          className={`absolute top-2 right-2 ${getBadgeColor(
            item.transaction_type
          )} text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}
        >
          {item.transaction_type === "vendita"
            ? "In vendita"
            : item.transaction_type === "scambio"
            ? "Scambio"
            : "Vend/Scamb"}
        </div>
      )}
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid={`review-${review.rating_id}`}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.rater_avatar} alt={review.rater_name} />
          <AvatarFallback>{review.rater_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{review.rater_name}</p>
          <RatingStars score={review.score} size="sm" />
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.created_at).toLocaleDateString("it-IT")}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collezioni");
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isOwnProfile = currentUser && currentUser.user_id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users/${userId}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Profilo non trovato</p>
          <Link to="/esplora">
            <Button variant="outline">Torna all'esplora</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = profile.items || [];
  const reviews = profile.ratings || [];
  
  // Filter items by type
  const collectionItems = items.filter(
    (i) => i.transaction_type === "collezione" || i.visibility === "private"
  );
  const saleItems = items.filter(
    (i) => i.transaction_type === "vendita" || i.transaction_type === "scambio_vendita"
  );

  // Stats
  const totalItems = items.length;
  const completedTrades = profile.completed_trades || 0;
  const avgRating = profile.avg_rating || 0;
  const reviewCount = profile.rating_count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-yellow-400">
              <AvatarImage src={profile.picture} alt={profile.name} />
              <AvatarFallback className="text-2xl font-bold bg-yellow-100 text-yellow-700">
                {profile.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-1">
                    {profile.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Shield className="w-4 h-4" />
                    <span>{profile.level || "Collezionista"}</span>
                  </div>
                  
                  {/* Badges */}
                  {profile.badges && profile.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.badges.map((badge, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setChatOpen(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      data-testid="contact-user-btn"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Contatta
                    </Button>
                    <Button
                      onClick={() => setTradeModalOpen(true)}
                      size="sm"
                      className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      data-testid="propose-trade-btn"
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-1" />
                      Proponi scambio
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  <p className="text-xs text-gray-500 mt-1">Oggetti</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{completedTrades}</p>
                  <p className="text-xs text-gray-500 mt-1">Scambi completati</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {avgRating > 0 ? avgRating.toFixed(1) : "-"}
                    </p>
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <p className="text-xs text-gray-500">{reviewCount} recensioni</p>
                </div>
              </div>

              {/* Description */}
              {profile.bio && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white border border-gray-200 p-1 rounded-lg mb-6">
            <TabsTrigger
              value="collezioni"
              className="flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900 rounded-md"
              data-testid="tab-collections"
            >
              <Package className="w-4 h-4 mr-2" />
              Collezioni ({collectionItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="vendita"
              className="flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900 rounded-md"
              data-testid="tab-sale"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              In Vendita ({saleItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="recensioni"
              className="flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900 rounded-md"
              data-testid="tab-reviews"
            >
              <Star className="w-4 h-4 mr-2" />
              Recensioni ({reviewCount})
            </TabsTrigger>
          </TabsList>

          {/* Collezioni Tab */}
          <TabsContent value="collezioni">
            {collectionItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isOwnProfile
                    ? "Non hai ancora oggetti nella collezione"
                    : "Nessun oggetto in collezione"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collectionItems.map((item) => (
                  <Link key={item.item_id} to={`/oggetto/${item.item_id}`}>
                    <ItemCard item={item} />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* In Vendita Tab */}
          <TabsContent value="vendita">
            {saleItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isOwnProfile
                    ? "Non hai oggetti in vendita"
                    : "Nessun oggetto in vendita"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {saleItems.map((item) => (
                  <Link key={item.item_id} to={`/oggetto/${item.item_id}`}>
                    <ItemCard item={item} />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recensioni Tab */}
          <TabsContent value="recensioni">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nessuna recensione ancora</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.rating_id} review={review} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {!isOwnProfile && currentUser && (
        <>
          <TradeProposalModal
            open={tradeModalOpen}
            onOpenChange={setTradeModalOpen}
            targetUserId={userId}
          />
          <ChatDrawer
            open={chatOpen}
            onOpenChange={setChatOpen}
            initialUser={{
              user_id: userId,
              name: profile.name,
              picture: profile.picture,
            }}
          />
        </>
      )}
    </div>
  );
}
