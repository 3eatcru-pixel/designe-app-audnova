import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Shield, MessageSquare, LogOut, PlusCircle, User, Zap, XCircle, Play, Pause } from "lucide-react";
import { Page, AuthMode, User as UserType, Radio } from "../types";
import { cn } from "../lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  authMode: AuthMode;
  user: UserType | null;
  onLogout: () => void;
  onNewRadio?: () => void;
  headerActions?: React.ReactNode;
  selectedRadio: Radio | null;
  onLeaveRadio: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  authMode,
  user,
  onLogout,
  onNewRadio,
  headerActions,
  selectedRadio,
  onLeaveRadio,
}) => {
  const navItems = [
    { id: "world", icon: Home, label: "Radar" },
    { id: "chat", icon: MessageSquare, label: "Radiochat" },
    { id: "profile", icon: User, label: "Perfil" },
  ];

  const [isPlusMenuOpen, setIsPlusMenuOpen] = React.useState(false);
  const [isMiniPlayerPlaying, setIsMiniPlayerPlaying] = React.useState(true);

  const showMiniPlayer = selectedRadio && currentPage !== "chat" && currentPage !== "dj-deck";

  return (
    <div className="min-h-screen bg-black-pure flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-neon-cyan/5 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-neon-indigo/5 rounded-full blur-[120px]"
        />
      </div>

      {/* Main Mobile Container */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[840px] bg-black-pure sm:rounded-[40px] sm:border-[8px] border-gray-medium shadow-2xl overflow-hidden flex flex-col">
        {/* Status Bar Area */}
        <div className="h-10 flex items-center justify-between px-6 pt-2">
          <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">AudNova Mesh</span>
          <div className="flex items-center gap-4">
            {authMode === "user" && user && (
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-neon-cyan" />
                <span className="text-[10px] font-black text-white tracking-tighter">{user.hypers}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-success/60 uppercase tracking-tighter">Gossip v3</span>
            </div>
          </div>
        </div>

        {/* Header Area */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
              {currentPage === "world" && "Radar Mundial"}
              {currentPage === "security" && "Security Hub"}
              {currentPage === "chat" && "Radiochat"}
              {currentPage === "dj-deck" && "Sua Rádio"}
              {currentPage === "profile" && "Meu Perfil"}
              {currentPage === "create-radio" && "Criar Rádio"}
              {currentPage === "badges-list" && "Badges"}
              {currentPage === "featured-radios" && "Top 100"}
            </h1>
            {authMode === "guest" && (
              <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest animate-pulse">
                Modo Visitante
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {selectedRadio && (
              <button
                onClick={onLeaveRadio}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/40 hover:text-error transition-colors"
                title="Deixar Rádio"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 px-6 relative min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mini Player */}
        <AnimatePresence>
          {showMiniPlayer && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-24 left-6 right-6 h-14 glass rounded-2xl flex items-center justify-between px-4 z-40 border border-neon-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => onPageChange("chat")}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={selectedRadio.image} alt={selectedRadio.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-white uppercase truncate">{selectedRadio.name}</span>
                  <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-widest">Sintonizado</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMiniPlayerPlaying(!isMiniPlayerPlaying)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-neon-cyan transition-colors"
                >
                  {isMiniPlayerPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
                <button 
                  onClick={onLeaveRadio}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-error transition-colors"
                >
                  <XCircle size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Bar */}
        <nav className="absolute bottom-6 left-6 right-6 h-16 glass rounded-2xl flex items-center justify-around px-2 z-50">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const isBlocked = authMode === "guest" && (item.id === "security" || item.id === "chat" || item.id === "profile");
            
            return (
              <button
                key={item.id}
                onClick={() => !isBlocked && onPageChange(item.id as Page)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
                  isActive ? "text-neon-cyan" : "text-white/30",
                  isBlocked && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <item.icon size={isActive ? 24 : 20} className={cn(isActive && "text-glow-cyan")} />
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-neon-cyan shadow-[0_0_8px_#00FFFF]"
                  />
                )}
                {isBlocked && (
                  <div className="absolute -top-1 -right-1 text-[8px]">🔒</div>
                )}
              </button>
            );
          })}

          {/* Floating Action Button for DJ Deck */}
          {authMode === "user" && (
            <div className="relative">
              <AnimatePresence>
                {isPlusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-16 right-0 w-48 glass rounded-2xl p-2 flex flex-col gap-1 shadow-2xl border border-white/10"
                  >
                    <button
                      onClick={() => {
                        onNewRadio?.();
                        setIsPlusMenuOpen(false);
                      }}
                      className="w-full h-10 px-4 rounded-xl hover:bg-white/5 flex items-center gap-3 text-white/60 hover:text-neon-cyan transition-all"
                    >
                      <PlusCircle size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Criar Nova Rádio</span>
                    </button>
                    <button
                      onClick={() => setIsPlusMenuOpen(false)}
                      className="w-full h-10 px-4 rounded-xl hover:bg-white/5 flex items-center gap-3 text-white/60 hover:text-neon-indigo transition-all"
                    >
                      <MessageSquare size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Chat com Amigo</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={cn(
                  "w-12 h-12 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-110 active:scale-95 transition-all",
                  isPlusMenuOpen && "rotate-45 bg-neon-indigo shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                )}
              >
                <PlusCircle size={24} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};
