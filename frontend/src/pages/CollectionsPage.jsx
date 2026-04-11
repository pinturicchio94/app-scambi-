import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CollectionsPage() {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAllUserItems();
    }
  }, [user]);

  // STEP 2: Query PULITA - Fetch TUTTI gli items dell'utente
  const fetchAllUserItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Fetching collections for user:", user.user_id);
      
      const res = await axios.get(`${API}/collections/grouped`, { 
        withCredentials: true 
      });
      
      console.log("📦 API Response:", res.data);
      
      // Flatten all items from all collections
      const items = [];
      res.data.forEach(collection => {
        if (collection.items && Array.isArray(collection.items)) {
          items.push(...collection.items);
        }
      });
      
      console.log(`✅ Total items fetched: ${items.length}`);
      setAllItems(items);
      
    } catch (err) {
      console.error("❌ Error fetching collections:", err);
      setError(err.response?.data?.detail || "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Raggruppamento per tipo transazione
  const groupByTransactionType = () => {
    const groups = {
      collezione: [],
      scambio: [],
      vendita: [],
      scambio_vendita: [],
      other: []
    };

    allItems.forEach(item => {
      const type = item.transaction_type || 'other';
      if (groups[type]) {
        groups[type].push(item);
      } else {
        groups.other.push(item);
      }
    });

    return groups;
  };

  const groups = groupByTransactionType();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Devi effettuare il login per vedere le tue collezioni</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">❌ {error}</p>
          <button 
            onClick={fetchAllUserItems}
            className="text-purple-600 hover:underline"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Le Mie Collezioni
          </h1>
          <p className="text-gray-600">
            {allItems.length} oggetti totali
          </p>
        </div>

        {/* Debug Info (rimuovere dopo verifica) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-semibold mb-2">🔍 Debug Info:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>User ID: {user.user_id}</li>
            <li>Total Items: {allItems.length}</li>
            <li>Collezione Privata: {groups.collezione.length}</li>
            <li>Scambio: {groups.scambio.length}</li>
            <li>Vendita: {groups.vendita.length}</li>
            <li>Scambio/Vendita: {groups.scambio_vendita.length}</li>
          </ul>
        </div>

        {/* STEP 3: Tabs per Raggruppamento */}
        {allItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Nessun oggetto nella collezione</p>
            <p className="text-gray-400 text-sm">Carica il tuo primo oggetto per iniziare!</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Tutti ({allItems.length})
              </TabsTrigger>
              <TabsTrigger value="collezione">
                Collezione Privata ({groups.collezione.length})
              </TabsTrigger>
              <TabsTrigger value="scambio">
                Scambio ({groups.scambio.length})
              </TabsTrigger>
              <TabsTrigger value="vendita">
                Vendita ({groups.vendita.length})
              </TabsTrigger>
              <TabsTrigger value="scambio_vendita">
                Scambio/Vendita ({groups.scambio_vendita.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab: TUTTI */}
            <TabsContent value="all">
              <ItemGrid items={allItems} />
            </TabsContent>

            {/* Tab: COLLEZIONE PRIVATA */}
            <TabsContent value="collezione">
              <ItemGrid items={groups.collezione} emptyMessage="Nessun oggetto in collezione privata" />
            </TabsContent>

            {/* Tab: SCAMBIO */}
            <TabsContent value="scambio">
              <ItemGrid items={groups.scambio} emptyMessage="Nessun oggetto per scambio" />
            </TabsContent>

            {/* Tab: VENDITA */}
            <TabsContent value="vendita">
              <ItemGrid items={groups.vendita} emptyMessage="Nessun oggetto in vendita" />
            </TabsContent>

            {/* Tab: SCAMBIO/VENDITA */}
            <TabsContent value="scambio_vendita">
              <ItemGrid items={groups.scambio_vendita} emptyMessage="Nessun oggetto scambio/vendita" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Simple Item Grid Component
function ItemGrid({ items, emptyMessage }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{emptyMessage || "Nessun oggetto"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.item_id} item={item} />
      ))}
    </div>
  );
}

// Simple Item Card
function ItemCard({ item }) {
  const getBadgeColor = (type) => {
    switch (type) {
      case 'collezione':
        return 'bg-gray-100 text-gray-700';
      case 'scambio':
        return 'bg-blue-100 text-blue-700';
      case 'vendita':
        return 'bg-green-100 text-green-700';
      case 'scambio_vendita':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'collezione':
        return 'Solo Collezione';
      case 'scambio':
        return 'Scambio';
      case 'vendita':
        return 'Vendita';
      case 'scambio_vendita':
        return 'Scambio/Vendita';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {item.images && item.images[0] ? (
          <img 
            src={item.images[0]} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={`${getBadgeColor(item.transaction_type)} text-xs`}>
            {getTransactionLabel(item.transaction_type)}
          </Badge>
        </div>

        {/* Visibility Badge */}
        {item.visibility === 'private' && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              🔒 Privato
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          {item.category} {item.subcategory ? `• ${item.subcategory}` : ''}
        </p>
        
        {item.estimated_value && (
          <p className="text-sm font-semibold text-purple-600">
            €{item.estimated_value.toFixed(2)}
          </p>
        )}

        {/* Debug: Show collection_name */}
        <p className="text-xs text-gray-400 mt-2 truncate">
          📁 {item.collection_name || 'Nessuna collezione'}
        </p>
      </div>
    </div>
  );
}
