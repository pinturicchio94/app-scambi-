export const CATEGORIES = [
  { id: "carte", label: "Carte", subcategories: ["Pokemon", "Magic", "Yu-Gi-Oh", "Panini", "Dragon Ball", "One Piece", "Digimon", "Baseball", "Calcio", "Basketball"] },
  { id: "funko", label: "Funko Pop", subcategories: ["Star Wars", "Marvel", "DC Comics", "Anime", "One Piece", "Dragon Ball", "Harry Potter", "Disney", "Game of Thrones", "Naruto", "My Hero Academia"] },
  { id: "lego", label: "LEGO", subcategories: ["Star Wars", "Technic", "Creator Expert", "Harry Potter", "Marvel", "City", "Ninjago", "Architecture", "Ideas", "Speed Champions"] },
  { id: "vintage", label: "Vintage", subcategories: ["Giocattoli", "Poster", "Vinili", "Monete", "Francobolli", "Orologi", "Libri Antichi", "Militaria"] },
  { id: "manga", label: "Manga & Anime", subcategories: ["Figure", "Manga", "Artbook", "Limited", "One Piece", "Naruto", "Dragon Ball", "Attack on Titan", "Demon Slayer", "Jujutsu Kaisen"] },
  { id: "videogiochi", label: "Videogiochi", subcategories: ["Nintendo", "PlayStation", "Xbox", "Retro", "Game Boy", "PC", "Collector Edition"] },
  { id: "modellismo", label: "Modellismo", subcategories: ["Auto", "Aerei", "Treni", "Navi", "Gundam", "Warhammer"] },
];

export const CONDITIONS = ["Nuovo", "Eccellente", "Buono", "Discreto", "Da restaurare"];

export const TRANSACTION_TYPES = [
  { id: "scambio", label: "Scambio" },
  { id: "vendita", label: "Vendita" },
];

export const MOCK_USERS = [
  {
    user_id: "user_mock_001",
    name: "Marco Rossi",
    email: "marco@example.com",
    picture: "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
    level: "Collezionista Esperto",
    badges: ["Prima collezione", "10 scambi", "Super Trader"],
    location: "Milano",
  },
  {
    user_id: "user_mock_002",
    name: "Giulia Bianchi",
    email: "giulia@example.com",
    picture: "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
    level: "Collezionista Intermedio",
    badges: ["Prima collezione", "5 scambi"],
    location: "Roma",
  },
  {
    user_id: "user_mock_003",
    name: "Luca Verdi",
    email: "luca@example.com",
    picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    level: "Principiante",
    badges: ["Prima collezione"],
    location: "Napoli",
  },
];

export const MOCK_COLLECTIONS = [
  { id: "coll_001", name: "Set Base Pokemon 1999", owner_id: "user_mock_001", total: 102, owned: 87, percentage: 85 },
  { id: "coll_002", name: "Funko Pop Star Wars", owner_id: "user_mock_001", total: 50, owned: 23, percentage: 46 },
  { id: "coll_003", name: "LEGO Star Wars UCS", owner_id: "user_mock_002", total: 30, owned: 12, percentage: 40 },
  { id: "coll_004", name: "Magic Alpha Set", owner_id: "user_mock_002", total: 295, owned: 45, percentage: 15 },
];

export const AI_RECOGNITION_MOCK = {
  name: "Charizard Holo - Set Base",
  category: "Carte",
  subcategory: "Pokemon",
  tags: ["holo", "1a edizione", "set base", "raro"],
};
