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
  hypers: 1250,
  isVerified: true,
};

export const MOCK_RADIOS: Radio[] = [
  {
    id: "radio-1",
    name: "Aether Mesh 01",
    host: "GossipEngine_Admin",
    listeners: 124,
    status: "live",
    category: "Techno",
    signal: 98,
    image: "https://picsum.photos/seed/radio1/400/400",
  },
  {
    id: "radio-2",
    name: "Neon Pulse",
    host: "DJ_Void",
    listeners: 89,
    status: "live",
    category: "Synthwave",
    signal: 85,
    image: "https://picsum.photos/seed/radio2/400/400",
  },
  {
    id: "radio-3",
    name: "Deep Space FM",
    host: "Orion_9",
    listeners: 0,
    status: "offline",
    category: "Ambient",
    signal: 0,
    image: "https://picsum.photos/seed/radio3/400/400",
  },
  {
    id: "radio-4",
    name: "Cyber Punk Radio",
    host: "V_Runner",
    listeners: 45,
    status: "live",
    category: "Industrial",
    signal: 92,
    image: "https://picsum.photos/seed/radio4/400/400",
  },
];

export const CATEGORIES = ["Techno", "Synthwave", "Ambient", "Industrial", "Glitch", "Lo-Fi"];

export const BADGES: Badge[] = [
  { id: "1", name: "Early Adopter", icon: "Zap", rarity: "gold", reason: "Pioneiro da rede mesh v1" },
  { id: "2", name: "Mesh Pioneer", icon: "Globe", rarity: "silver", reason: "Primeiro a conectar 10 nós" },
  { id: "3", name: "High Roller", icon: "Diamond", rarity: "bronze", reason: "Doador de 100+ Hypers" },
  { id: "4", name: "Signal Master", icon: "Radio", rarity: "gold", reason: "Transmissão ininterrupta 24h" },
  { id: "5", name: "Cyber Citizen", icon: "User", rarity: "silver", reason: "Perfil verificado na malha" },
];

export const DONORS = [
  { id: "1", name: "X_Matrix", amount: 500 },
  { id: "2", name: "Zero_Cool", amount: 250 },
  { id: "3", name: "Acid_Burn", amount: 100 },
];

export const MOCK_FRIENDS = [
  { id: "f1", name: "Cyber_Ghost", status: "online", avatar: "https://picsum.photos/seed/f1/100/100" },
  { id: "f2", name: "Neon_Samurai", status: "offline", avatar: "https://picsum.photos/seed/f2/100/100" },
  { id: "f3", name: "Glitch_Queen", status: "online", avatar: "https://picsum.photos/seed/f3/100/100" },
  { id: "f4", name: "Bit_Crusher", status: "online", avatar: "https://picsum.photos/seed/f4/100/100" },
];

export const MOCK_FAVORITES = [
  { id: "fav1", name: "Techno Bunker", host: "Bunker_Master", listeners: 450, status: "live", category: "Techno", signal: 99, image: "https://picsum.photos/seed/fav1/400/400" },
  { id: "fav2", name: "Lo-Fi Chill", host: "Chill_Bot", listeners: 1200, status: "live", category: "Lo-Fi", signal: 95, image: "https://picsum.photos/seed/fav2/400/400" },
];
