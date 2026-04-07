export type AuthMode = "guest" | "user" | "none";

export type Page = "world" | "security" | "chat" | "auth" | "dj-deck" | "profile" | "p2p-list" | "p2p-chat" | "create-radio" | "badges-list" | "featured-radios" | "register";

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
  hypers: number;
  isVerified: boolean;
  avatar?: string;
  badges: Badge[];
  favorites: string[]; // Radio IDs
  transactions: Transaction[];
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
