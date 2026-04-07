import * as React from "react";
import { motion } from "motion/react";
import { Wallet, Award, Radio as RadioIcon, Heart, Settings, ChevronRight, Lock, Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { BADGES, DONORS, MOCK_USER } from "../constants";
import { Radio, AuthMode, Page } from "../types";
import { cn } from "../lib/utils";

interface SecurityHubProps {
  authMode: AuthMode;
  showEmpty: boolean;
  userRadio: Radio | null;
  onPageChange?: (page: Page) => void;
}

export const SecurityHub: React.FC<SecurityHubProps> = ({ authMode, showEmpty, userRadio, onPageChange }) => {
  if (authMode === "guest") {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState type="guest" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 no-scrollbar pb-32 gap-8">
      {/* Hypers Wallet */}
      <section>
        <Card className="relative overflow-hidden p-6" variant="highlight">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                <Wallet size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Saldo Atual</span>
                <span className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {MOCK_USER.hypers} <span className="text-neon-cyan">Hypers</span>
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Plus size={14} className="mr-1" />
              Recarregar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Ganhos (24h)</span>
              <span className="text-sm font-black text-success">+12.4 H</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Gastos (24h)</span>
              <span className="text-sm font-black text-error">-2.1 H</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Conquistas & Badges</h3>
          <Award size={14} className="text-white/20" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {BADGES.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-2 shrink-0">
              <div className={cn(
                "w-16 h-16 rounded-2xl glass flex items-center justify-center transition-all shadow-lg",
                badge.rarity === "gold" && "text-warning border border-warning/30 shadow-warning/10",
                badge.rarity === "silver" && "text-white/60 border border-white/20 shadow-white/5",
                badge.rarity === "bronze" && "text-[#CD7F32] border border-[#CD7F32]/30 shadow-[#CD7F32]/10"
              )}>
                <Award size={24} />
              </div>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter text-center max-w-[64px]">
                {badge.name}
              </span>
            </div>
          ))}
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 shrink-0">
            <Plus size={20} />
          </div>
        </div>
      </section>

      {/* My Station */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Minha Estação</h3>
          <Settings size={14} className="text-white/20" />
        </div>
        {(!userRadio || showEmpty) ? (
          <Card 
            className="p-8 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-white/5 hover:border-neon-cyan/20 cursor-pointer transition-all" 
            variant="default"
            onClick={() => onPageChange?.("create-radio")}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <RadioIcon size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-white/60">Nenhuma rádio criada</h4>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Inicie sua própria frequência na malha</p>
            </div>
            <Button variant="primary" size="sm">Criar Agora</Button>
          </Card>
        ) : (
          <Card 
            className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all" 
            variant="highlight"
            onClick={() => onPageChange?.("dj-deck")}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <img src={userRadio.image} alt={userRadio.name} className="w-full h-full object-cover" />
                {userRadio.status === "live" && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error animate-pulse" />
                )}
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-black text-white uppercase tracking-tight">{userRadio.name}</h4>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    userRadio.status === "live" ? "text-success" : "text-white/20"
                  )}>
                    Status: {userRadio.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="w-10 h-10 p-0 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageChange?.("dj-deck");
                }}
              >
                <Settings size={18} />
              </Button>
              <Button variant="primary" className="w-10 h-10 p-0 rounded-xl bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Recent Donors */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Doadores Recentes</h3>
          <Heart size={14} className="text-error/40" />
        </div>
        <div className="flex flex-col gap-2">
          {DONORS.map((donor) => (
            <div key={donor.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-medium flex items-center justify-center text-[10px] font-bold text-white/40">
                  {donor.name[0]}
                </div>
                <span className="text-xs font-bold text-white/80">{donor.name}</span>
              </div>
              <span className="text-xs font-black text-neon-cyan">+{donor.amount} H</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
