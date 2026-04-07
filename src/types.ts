export type AuthMode = "guest" | "user" | "none";

export type Page = "world" | "security" | "chat" | "auth" | "dj-deck" | "profile" | "p2p-list" | "p2p-chat" | "create-radio" | "badges-list" | "featured-radios" | "register" | "music-categories";

// Hyper Economy System
export type HyperLevel = 1 | 2 | 3; // Level progression

export interface HyperTransaction {
  id: string;
  type: "earn" | "spend" | "donate" | "daily_reset";
  amount: number;
  action: "login_bonus" | "invite_create" | "radio_donate" | "daily_grant" | "other";
  description: string;
  timestamp: string;
  targetRadioId?: string; // For donations
  targetUserId?: string; // For invites/donations
}

export interface GenerosityRecord {
  totalDonated: number; // Lifetime Hypers donated
  donationCount: number;
  lastDonationAt: string;
  badge?: Badge; // "Patrono" at 50+ donations
}

export interface Transaction {
  id: string;
  type: "earn" | "spend";
  amount: number;
  description: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: "gold" | "silver" | "bronze";
  reason: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  hypers: number; // Current balance (resets daily)
  hyperLevel: HyperLevel; // 1, 2, or 3 based on lifetime history
  hyperHistoryLifetime: number; // Cumulative Hypers earned (never resets)
  isVerified: boolean;
  avatar?: string;
  badges: Badge[];
  favorites: string[]; // Radio IDs
  transactions: Transaction[];
  hyperTransactions: HyperTransaction[]; // Detailed Hyper log
  generosity: GenerosityRecord; // Donation tracking
  maxActiveRadios: number; // Determined by hyperLevel
  lastDailyResetAt: string; // When 3 Hypers were last granted
}

export interface Radio {
  id: string;
  name: string;
  host: string;
  listeners: number;
  status: "live" | "offline";
  category: string;
  signal: number;
  image: string;
  hypersDonatedLast24h?: number; // For ranking
  isFeatured?: boolean; // Auto-featured if 100+ Hypers in 24h
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
  status?: "idle" | "requested" | "ready" | "sending" | "sent" | "error";
}

export interface AppState {
  authMode: AuthMode;
  user: User | null;
  currentPage: Page;
  selectedRadio: Radio | null;
  isSearching: boolean;
  showEmptyRadios: boolean;
  showEmptySignal: boolean;
  isConfigOpen: boolean;
  selectedFriendId: string | null;
  lastRadio: Radio | null;
  userRadios: Radio[];
  allRadios: Radio[];
}
