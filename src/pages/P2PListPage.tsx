import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, MessageCircle, Search, MoreVertical, User as UserIcon, Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { MOCK_FRIENDS } from "../constants";
import { Page } from "../types";
import { cn } from "../lib/utils";

interface P2PListPageProps {
  onPageChange: (page: Page) => void;
  onSelectChat: (friendId: string) => void;
}

export const P2PListPage: React.FC<P2PListPageProps> = ({ onPageChange, onSelectChat }) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredFriends = MOCK_FRIENDS.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-10 h-10 p-0 rounded-xl"
            onClick={() => onPageChange("profile")}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Mensagens P2P</h2>
            <span className="text-[10px] font-bold text-neon-indigo uppercase tracking-widest mt-1">Malha Segura Ativa</span>
          </div>
        </div>
        <Button variant="primary" size="sm" className="w-10 h-10 p-0 rounded-xl">
          <Plus size={20} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
        <input
          type="text"
          placeholder="PROCURAR NA MALHA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-xs text-white uppercase tracking-widest placeholder:text-white/10 focus:outline-none focus:border-neon-indigo/50 transition-colors"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar flex flex-col gap-3 pb-32">
        {filteredFriends.map((friend) => (
          <Card
            key={friend.id}
            className="p-4 flex items-center gap-4 hover:bg-white/10 cursor-pointer group transition-all"
            variant="default"
            onClick={() => onSelectChat(friend.id)}
          >
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl glass p-0.5">
                <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-xl object-cover" />
              </div>
              {friend.status === "online" && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success border-2 border-black-pure shadow-[0_0_5px_#39FF14]" />
              )}
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-tight">{friend.name}</h4>
                <span className="text-[8px] font-bold text-white/20 uppercase">14:22</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest truncate max-w-[180px]">
                O sinal está estável no setor 7...
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-indigo shadow-[0_0_8px_#6366f1]" />
              <MoreVertical size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
          </Card>
        ))}

        {filteredFriends.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-20">
            <MessageCircle size={48} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum Contato Encontrado</span>
          </div>
        )}
      </div>
    </div>
  );
};
