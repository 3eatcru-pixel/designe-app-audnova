import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Award, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { BADGES } from "../constants";
import { cn } from "../lib/utils";
import { User } from "../types";

interface BadgesListPageProps {
  onBack: () => void;
  user: User | null;
}

export const BadgesListPage: React.FC<BadgesListPageProps> = ({ onBack, user }) => {
  const userBadgeIds = React.useMemo(() => new Set(user?.badges.map(b => b.id) || []), [user]);

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
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Galeria de Badges</h2>
          <span className="text-[10px] font-bold text-neon-indigo uppercase tracking-widest mt-1">Suas Conquistas na Malha</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-32 flex flex-col gap-4">
        {BADGES.map((badge) => {
          const isLocked = !userBadgeIds.has(badge.id);
          return (
            <Card 
              key={badge.id} 
              className={cn(
                "p-4 flex items-center gap-4 relative overflow-hidden transition-all",
                isLocked && "opacity-40 grayscale"
              )} 
              variant="default"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl glass flex items-center justify-center shrink-0 shadow-lg border",
                badge.rarity === "gold" && "text-warning border-warning/30 shadow-warning/10",
                badge.rarity === "silver" && "text-white/60 border-white/20 shadow-white/5",
                badge.rarity === "bronze" && "text-[#CD7F32] border-[#CD7F32]/30 shadow-[#CD7F32]/10"
              )}>
                <Award size={32} />
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    {badge.name} {isLocked && "🔒"}
                  </h4>
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                    badge.rarity === "gold" && "bg-warning/20 text-warning",
                    badge.rarity === "silver" && "bg-white/10 text-white/60",
                    badge.rarity === "bronze" && "bg-[#CD7F32]/20 text-[#CD7F32]"
                  )}>
                    {badge.rarity}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                  {isLocked ? "Conquista bloqueada" : badge.reason}
                </p>
              </div>

              {badge.rarity === "gold" && !isLocked && (
                <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                  <ShieldCheck size={64} className="text-warning" />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
