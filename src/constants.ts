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
  hypers: 0,
  isVerified: true,
  badges: [],
  favorites: [],
  transactions: [],
};

export const MOCK_RADIOS: Radio[] = [];

export const CATEGORIES = ["Techno", "Synthwave", "Ambient", "Industrial", "Glitch", "Lo-Fi"];

export const BADGES: Badge[] = [
  { id: "1", name: "Early Adopter", icon: "Zap", rarity: "gold", reason: "Pioneiro da rede mesh v1" },
  { id: "2", name: "Mesh Pioneer", icon: "Globe", rarity: "silver", reason: "Primeiro a conectar 10 nós" },
  { id: "3", name: "High Roller", icon: "Diamond", rarity: "bronze", reason: "Doador de 100+ Hypers" },
  { id: "4", name: "Signal Master", icon: "Radio", rarity: "gold", reason: "Transmissão ininterrupta 24h" },
  { id: "5", name: "Cyber Citizen", icon: "User", rarity: "silver", reason: "Perfil verificado na malha" },
];

export const DONORS = [];

export const MOCK_FRIENDS = [];

export const MOCK_FAVORITES = [];
