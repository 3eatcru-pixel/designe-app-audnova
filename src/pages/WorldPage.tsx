import * as React from "react";
import { motion } from "motion/react";
import { Search, Radio as RadioIcon, Users, Signal, Zap, ChevronRight, Heart } from "lucide-react";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { MOCK_RADIOS, CATEGORIES } from "../constants";
import { Radio, AuthMode, Page } from "../types";
import { cn } from "../lib/utils";

interface WorldPageProps {
  authMode: AuthMode;
  onSelectRadio: (radio: Radio) => void;
  showEmpty: boolean;
  showEmptySignal: boolean;
  onToggleEmpty?: () => void;
  radios: Radio[];
  onSeeAll?: () => void;
  onFavoriteRadio?: (radioId: string) => void;
  userFavorites?: string[];
}

export const WorldPage: React.FC<WorldPageProps> = ({
  authMode,
  onSelectRadio,
  showEmpty,
  showEmptySignal,
  onToggleEmpty,
  radios,
  onSeeAll,
  onFavoriteRadio,
  userFavorites = [],
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState("Tudo");
  const [showRechargeMsg, setShowRechargeMsg] = React.useState(false);

  React.useEffect(() => {
    // Check if we came from Security Hub with a recharge request
    // For now we'll just check a simple flag or just simulate it
    // In a real app we might use a URL param or state
  }, []);

  const filteredRadios = React.useMemo(() => {
    if (showEmpty) return [];
    
    let result = [...radios];
    
    // Category Filter
    if (selectedCategory !== "Tudo") {
      result = result.filter(r => r.category === selectedCategory);
    }

    // Ranking Sort
    return result.sort((a, b) => {
      // Live status first
      if (a.status === "live" && b.status !== "live") return -1;
      if (a.status !== "live" && b.status === "live") return 1;
      
      // Then by listeners (Views)
      if (b.listeners !== a.listeners) return b.listeners - a.listeners;
      
      // Then by signal (Hypers)
      return b.signal - a.signal;
    });
  }, [radios, showEmpty, selectedCategory]);

  const liveRadios = radios.filter(r => r.status === "live");
  const topRadio = liveRadios.length > 0 ? liveRadios[0] : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 no-scrollbar pb-32 gap-8">
      {/* Hero "Agora no Ar" */}
      <section className="relative h-48 rounded-3xl overflow-hidden group">
        <img
          src={topRadio ? topRadio.image : "https://picsum.photos/seed/audnova/800/400"}
          alt="Hero"
          className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black-pure via-black-pure/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", topRadio ? "bg-error" : "bg-neon-cyan")} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest", topRadio ? "text-error" : "text-neon-cyan")}>
              {topRadio ? "Agora no Ar" : "AudNova Mesh"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
            {topRadio ? topRadio.name : "Bem-vindo à Malha"}
          </h2>
          <p className="text-xs text-white/60 font-medium">
            {topRadio ? `${topRadio.host} transmitindo ao vivo` : "Conecte-se à nova era da rádio P2P"}
          </p>
        </div>
        {topRadio && (
          <button 
            onClick={() => onSelectRadio(topRadio)}
            className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </section>

      {/* Metrics Cards */}
      <section className="grid grid-cols-3 gap-3">
        <Card 
          className="flex flex-col items-center justify-center py-4 gap-1 cursor-pointer hover:bg-white/5 transition-all" 
          variant="default"
          onClick={() => {
            if (authMode === "user") {
              alert("Dica: Favorite rádios para ganhar Hypers extras!");
            }
          }}
        >
          <RadioIcon size={16} className="text-neon-cyan" />
          <span className="text-lg font-black text-white leading-none">
            {authMode === "guest" ? "---" : radios.filter(r => r.status === "live").length}
          </span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Salas Ativas</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4 gap-1" variant="default">
          <Users size={16} className="text-neon-indigo" />
          <span className="text-lg font-black text-white leading-none">
            {authMode === "guest" ? "---" : radios.reduce((acc, r) => acc + r.listeners, 0)}
          </span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Online</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4 gap-1" variant="default">
          <Zap size={16} className="text-warning" />
          <span className="text-lg font-black text-white leading-none">
            {authMode === "guest" ? "---" : "0"}
          </span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Convites</span>
        </Card>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Categorias</h3>
          <button 
            onClick={onSeeAll}
            className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest hover:underline"
          >
            Ver Tudo
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["Tudo", ...CATEGORIES].map((cat) => (
            <Chip
              key={cat}
              label={cat}
              variant={selectedCategory === cat ? "active" : "default"}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      </section>

      {/* Radio List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Rádios em Destaque</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleEmpty}
              className={cn(
                "text-[8px] font-bold uppercase transition-colors",
                showEmpty ? "text-neon-cyan" : "text-white/10 hover:text-white/40"
              )}
            >
              Radar Ativo
            </button>
            <div className="flex items-center gap-2">
              <Search size={14} className="text-white/20" />
            </div>
          </div>
        </div>

        {showEmptySignal ? (
          <EmptyState type="signal" />
        ) : filteredRadios.length === 0 ? (
          <EmptyState type="radio" />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRadios.map((radio, index) => (
              <Card
                key={radio.id}
                onClick={() => onSelectRadio(radio)}
                className="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer group transition-all relative overflow-hidden"
                variant={radio.status === "live" ? "highlight" : "default"}
              >
                {/* Ranking Badge */}
                <div className={cn(
                  "absolute -left-1 top-0 w-6 h-full flex items-center justify-center",
                  index === 0 && "bg-warning/20",
                  index === 1 && "bg-white/10",
                  index === 2 && "bg-[#CD7F32]/20"
                )}>
                  <span className={cn(
                    "text-[8px] font-black rotate-[-90deg] uppercase tracking-tighter",
                    index === 0 && "text-warning",
                    index === 1 && "text-white/40",
                    index === 2 && "text-[#CD7F32]"
                  )}>
                    {index + 1}º
                  </span>
                </div>

                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 ml-4">
                  <img
                    src={radio.image}
                    alt={radio.name}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                      radio.status === "offline" && "grayscale opacity-50"
                    )}
                  />
                  {radio.status === "live" && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error shadow-[0_0_5px_#FF3131]" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                    {radio.name}
                  </h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {radio.host}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Users size={10} className="text-white/20" />
                      <span className="text-[9px] font-bold text-white/40">
                        {authMode === "guest" ? "---" : radio.listeners}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal size={10} className="text-white/20" />
                      <span className="text-[9px] font-bold text-white/40">
                        {authMode === "guest" ? "---" : `${radio.signal}%`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteRadio?.(radio.id);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        userFavorites.includes(radio.id) ? "text-error bg-error/10" : "text-white/20 hover:text-white/40 bg-white/5"
                      )}
                    >
                      <Heart size={14} fill={userFavorites.includes(radio.id) ? "currentColor" : "none"} />
                    </button>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                      radio.status === "live" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/20"
                    )}>
                      {radio.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase">{radio.category}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
