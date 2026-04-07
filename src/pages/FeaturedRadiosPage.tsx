import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Search, Users, Signal, Zap, Award, Heart } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Radio } from "../types";
import { cn } from "../lib/utils";

interface FeaturedRadiosPageProps {
  onBack: () => void;
  onSelectRadio: (radio: Radio) => void;
  radios: Radio[];
  onFavoriteRadio?: (radioId: string) => void;
  userFavorites?: string[];
}

export const FeaturedRadiosPage: React.FC<FeaturedRadiosPageProps> = ({ 
  onBack, 
  onSelectRadio, 
  radios, 
  onFavoriteRadio, 
  userFavorites = [] 
}) => {
  const [search, setSearch] = React.useState("");

  const featuredRadios = React.useMemo(() => {
    // Sort by listeners and signal to get "top 100" (simulated)
    return [...radios]
      .sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (a.status !== "live" && b.status === "live") return 1;
        if (b.listeners !== a.listeners) return b.listeners - a.listeners;
        return b.signal - a.signal;
      })
      .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 100);
  }, [radios, search]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-10 h-10 p-0 rounded-xl"
          onClick={onBack}
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Top 100 Destaques</h2>
          <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mt-1">As Melhores da Malha</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white focus:border-neon-cyan/50 outline-none transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-32 flex flex-col gap-3">
        {featuredRadios.map((radio, index) => (
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
                    {radio.listeners}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Signal size={10} className="text-white/20" />
                  <span className="text-[9px] font-bold text-white/40">
                    {radio.signal}%
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
    </div>
  );
};
