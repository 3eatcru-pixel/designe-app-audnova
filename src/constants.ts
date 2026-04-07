import { Radio, User, Badge } from "./types";

export const COLORS = {
  black: "#000000",
  cyan: "#00FFFF",
  indigo: "#4B0082",
  gray: "#1A1A1A",
  white: "#FFFFFF",
  error: "#FF3131",
  success: "#39FF14",
  warning: "#FFD700",
};

export const MOCK_USER: User = {
  id: "user-1",
  name: "CyberRunner_23",
  email: "beatcru.official@gmail.com",
  hypers: 3, // Current daily balance
  hyperLevel: 1, // 0-10 Hypers = Level 1
  hyperHistoryLifetime: 15, // Ever earned
  isVerified: true,
  badges: [],
  favorites: [],
  transactions: [],
  hyperTransactions: [
    {
      id: "tx-1",
      type: "earn",
      amount: 3,
      action: "daily_grant",
      description: "Bônus de Login Diário",
      timestamp: new Date().toISOString(),
    },
  ],
  generosity: {
    totalDonated: 0,
    donationCount: 0,
    lastDonationAt: "",
  },
  maxActiveRadios: 1, // Level 1 = 1 radio
  lastDailyResetAt: new Date().toISOString(),
};

// Categories with metadata for display and filtering
export interface CategoryMetadata {
  id: string;
  name: string;
  icon: string;
  color: string;
  isBrowsable: boolean; // false = "outros" (create only, not in browse list)
}

export const CATEGORIES_LIST: CategoryMetadata[] = [
  // Music genres
  { id: "techno", name: "Techno", icon: "⚡", color: "from-cyan-500 to-blue-600", isBrowsable: true },
  { id: "synthwave", name: "Synthwave", icon: "🌌", color: "from-pink-500 to-purple-600", isBrowsable: true },
  { id: "ambient", name: "Ambient", icon: "🌊", color: "from-green-500 to-emerald-600", isBrowsable: true },
  { id: "industrial", name: "Industrial", icon: "⚙️", color: "from-gray-600 to-black", isBrowsable: true },
  { id: "glitch", name: "Glitch", icon: "💿", color: "from-orange-500 to-red-600", isBrowsable: true },
  { id: "lofi", name: "Lo-Fi", icon: "🎧", color: "from-yellow-500 to-orange-600", isBrowsable: true },
  // New categories
  { id: "esporte", name: "Esporte", icon: "⚽", color: "from-green-600 to-emerald-700", isBrowsable: true },
  { id: "jogos", name: "Jogos", icon: "🎮", color: "from-purple-600 to-indigo-700", isBrowsable: true },
  { id: "noticias", name: "Notícias", icon: "📰", color: "from-blue-600 to-cyan-700", isBrowsable: true },
  { id: "comunidades", name: "Comunidades", icon: "👥", color: "from-rose-500 to-pink-600", isBrowsable: true },
  // Special category: "outros" (others/create) - not browsable
  { id: "outros", name: "Outros", icon: "📌", color: "from-slate-600 to-gray-700", isBrowsable: false },
];

// Simple string array for backwards compatibility (sorted by browsable first)
export const CATEGORIES = CATEGORIES_LIST.filter(c => c.isBrowsable).map(c => c.name).concat("Outros");

// Generate mock radios for testing 100+ threshold logic
const generateMockRadios = (): Radio[] => {
  const radios: Radio[] = [];
  const categoryIds = ["techno", "synthwave", "esporte", "jogos", "noticias", "comunidades"];
  const hosts = ["Radio Host #", "DJ ", "Streamer "];

  // Create 100+ radios per featured category to test threshold
  categoryIds.forEach((catId, idx) => {
    const count = idx < 2 ? 120 : 45; // Techno and Synthwave have 120+, others have 45
    for (let i = 0; i < count; i++) {
      radios.push({
        id: `radio-${catId}-${i}`,
        name: `${catId} Station ${i + 1}`,
        host: `${hosts[i % hosts.length]}${i + 1}`,
        listeners: Math.floor(Math.random() * 5000) + 100,
        status: Math.random() > 0.3 ? "live" : "offline",
        category: CATEGORIES_LIST.find(c => c.id === catId)?.name || "Outros",
        signal: Math.floor(Math.random() * 100),
        image: `https://images.unsplash.com/photo-${1470225620541 + i}?w=200&h=200&fit=crop`,
      });
    }
  });
  return radios;
};

export const MOCK_RADIOS: Radio[] = generateMockRadios();

export const BADGES: Badge[] = [
  { id: "1", name: "Early Adopter", icon: "Zap", rarity: "gold", reason: "Pioneiro da rede mesh v1" },
  { id: "2", name: "Mesh Pioneer", icon: "Globe", rarity: "silver", reason: "Primeiro a conectar 10 nós" },
  { id: "3", name: "High Roller", icon: "Diamond", rarity: "bronze", reason: "Doador de 100+ Hypers" },
  { id: "4", name: "Signal Master", icon: "Radio", rarity: "gold", reason: "Transmissão ininterrupta 24h" },
  { id: "5", name: "Cyber Citizen", icon: "User", rarity: "silver", reason: "Perfil verificado na malha" },
];

// ============================================================================
// HYPER ECONOMY CONFIG
// ============================================================================

export const HYPER_CONFIG = {
  // Daily Distribution
  DAILY_GRANT: 3, // Hypers per day for Elite members (resets at midnight UTC)
  DAILY_GRANT_UTC_HOUR: 0, // Midnight UTC
  GUEST_DAILY_GRANT: 0, // Guests get nothing (must verify to earn)

  // Action Costs
  INVITE_CREATE_COST: 1, // Cost to generate invite code
  RADIO_DONATE_COST: 1, // Cost to donate 1 Hyper to a radio
  RADIO_CREATE_COST: 0, // Free to create, but limited by level

  // Level Progression (based on lifetime Hypers earned)
  LEVEL_THRESHOLDS: {
    1: { min: 0, max: 10, maxRadios: 1 }, // Level 1: 0-10 Hypers = 1 radio
    2: { min: 11, max: 49, maxRadios: 2 }, // Level 2: 11-50 Hypers = 2 radios
    3: { min: 50, max: Infinity, maxRadios: 3 }, // Level 3 (Archon): 50+ Hypers = 3+ radios
  },

  // Generosity Badges (based on total donated)
  GENEROSITY_BADGES: [
    { minDonations: 1, badge: "Supporter", icon: "Heart", rarity: "bronze" },
    { minDonations: 10, badge: "Patrono", icon: "Crown", rarity: "silver" },
    { minDonations: 50, badge: "Archon Benefactor", icon: "Sparkles", rarity: "gold" },
  ],

  // Featured Radios (top 24h by donations)
  FEATURED_THRESHOLD_HYPERS: 100, // If 100+ Hypers donated in 24h, auto-featured
  FEATURED_VISIBILITY_BOOST: 3, // Appear 3x higher in ranking

  // Invite System
  INVITES_PER_ELITE: 10, // Max active invites per Elite member
  MAX_DAILY_INVITES: 3, // Max invites creatable per day
};

// Generosity Badge Definitions
export const GENEROSITY_BADGES: Badge[] = [
  {
    id: "supporter",
    name: "Supporter",
    icon: "❤️",
    rarity: "bronze",
    reason: "Doou 1+ Hypers para DJs",
  },
  {
    id: "patrono",
    name: "Patrono",
    icon: "👑",
    rarity: "silver",
    reason: "Patrono: Doou 10+ Hypers para comunidade",
  },
  {
    id: "archon_benefactor",
    name: "Archon Benefactor",
    icon: "✨",
    rarity: "gold",
    reason: "Lenda: Doou 50+ Hypers - Sustentou ecossistema",
  },
];

export const DONORS = [];

export const MOCK_FRIENDS = [];

export const MOCK_FAVORITES = [];
