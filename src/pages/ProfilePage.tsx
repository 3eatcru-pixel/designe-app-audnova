import * as React from "react";
import { motion } from "motion/react";
import { User as UserIcon, Users, Radio as RadioIcon, Heart, Award, Zap, ChevronRight, Settings, Plus, MessageCircle, Shield, LogOut } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { MOCK_USER, MOCK_FRIENDS, MOCK_FAVORITES, BADGES } from "../constants";
import { AuthMode, User, Page, Radio } from "../types";
import { cn } from "../lib/utils";

interface ProfilePageProps {
  authMode: AuthMode;
  user: User | null;
  onPageChange?: (page: Page) => void;
  onLogout: () => void;
  userRadios: Radio[];
  onUpdateAvatar?: (avatar: string) => void;
  onDeleteRadio?: (radioId: string) => void;
  onGenerateInvite?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  authMode, 
  user, 
  onPageChange, 
  onLogout, 
  userRadios, 
  onUpdateAvatar, 
  onDeleteRadio,
  onGenerateInvite
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(user?.name || "");
  const [newPassword, setNewPassword] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setNewName(user.name);
    }
  }, [user]);

  if (authMode === "guest") {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState type="guest" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 no-scrollbar pb-32 gap-8">
      {/* User Header */}
      <section className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-neon-cyan p-1 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            <img
              src={user?.avatar || `https://picsum.photos/seed/${user?.id}/200/200`}
              alt={user?.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-success border-4 border-black-pure" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">{user?.name}</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3"
            onClick={() => {
              const newAvatar = `https://picsum.photos/seed/${Date.now()}/200/200`;
              onUpdateAvatar?.(newAvatar);
            }}
          >
            <Settings size={14} className="mr-1" />
            Editar
          </Button>
          <Button variant="primary" size="sm" className="h-8 px-3">
            <Plus size={14} className="mr-1" />
            Convite
          </Button>
        </div>
      </section>

      {/* Hyper Counter & Stats */}
      <section className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center py-4 gap-1" variant="highlight">
          <Zap size={16} className="text-neon-cyan" />
          <span className="text-lg font-black text-white leading-none">{user?.hypers || 0}</span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Hypers</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4 gap-1" variant="default">
          <Award size={16} className="text-neon-indigo" />
          <span className="text-lg font-black text-white leading-none">{user?.badges.length || 0}</span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Badges</span>
        </Card>
      </section>

      {/* Badges Preview */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Minhas Badges</h3>
          <button 
            onClick={() => onPageChange?.("badges-list")}
            className="text-[10px] font-bold text-neon-indigo uppercase tracking-widest hover:underline"
          >
            Ver mais...
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {user?.badges.length === 0 ? (
            <div className="flex-1 py-4 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl">
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Nenhuma badge conquistada</span>
            </div>
          ) : (
            user?.badges.map((badge) => (
              <div 
                key={badge.id} 
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div 
                  className={cn(
                    "w-12 h-12 rounded-xl glass flex items-center justify-center border",
                    badge.rarity === "gold" && "text-warning border-warning/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]",
                    badge.rarity === "silver" && "text-white/60 border-white/10",
                    badge.rarity === "bronze" && "text-[#CD7F32] border-[#CD7F32]/20"
                  )}
                  title={badge.name}
                >
                  <Award size={20} />
                </div>
                <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter text-center max-w-[48px] truncate">
                  {badge.reason}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* P2P Messages & Security Hub */}
      <section className="grid grid-cols-2 gap-3">
        <Card 
          className="flex flex-col items-center justify-center py-4 gap-2 hover:bg-white/5 cursor-pointer transition-all" 
          variant="default"
          onClick={() => onPageChange?.("p2p-list")}
        >
          <MessageCircle size={20} className="text-neon-indigo" />
          <div className="text-center">
            <span className="text-[10px] font-black text-white uppercase tracking-tight block">Mensagens P2P</span>
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Chat Amigos</span>
          </div>
        </Card>
        <Card 
          className="flex flex-col items-center justify-center py-4 gap-2 hover:bg-white/5 cursor-pointer transition-all" 
          variant="default"
          onClick={() => onPageChange?.("security")}
        >
          <Shield size={20} className="text-success" />
          <div className="text-center">
            <span className="text-[10px] font-black text-white uppercase tracking-tight block">Security Hub</span>
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Casa / Proteção</span>
          </div>
        </Card>
      </section>

      {/* Profile Settings Card */}
      <section>
        <Card 
          className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all" 
          variant="default"
          onClick={() => setIsSettingsOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
              <Settings size={20} />
            </div>
            <div className="flex flex-col">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Configurar Perfil</h4>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Nome, Senha, Privacidade</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/20" />
        </Card>
      </section>

      {/* Activation Key Generation */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Acesso à Rede</h3>
          <Zap size={14} className="text-neon-cyan/40" />
        </div>
        <Card className="p-4 flex flex-col gap-4" variant="default">
          <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Gerar Chave de Ativação</h4>
            <p className="text-[8px] text-white/30 uppercase tracking-widest leading-relaxed">
              Custo: 5 Hypers. A chave permite que um novo usuário crie uma identidade na malha AudNova.
            </p>
          </div>
          <Button 
            variant="primary" 
            className="w-full h-10 gap-2"
            onClick={onGenerateInvite}
          >
            <Zap size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Gerar Chave (5 Hypers)</span>
          </Button>
        </Card>
      </section>

      {/* Friends List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Amigos Online</h3>
          <Users size={14} className="text-white/20" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {MOCK_FRIENDS.map((friend) => (
            <div key={friend.id} className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl glass p-0.5">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-xl object-cover" />
                </div>
                {friend.status === "online" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success border-2 border-black-pure" />
                )}
              </div>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter text-center max-w-[64px] truncate">
                {friend.name}
              </span>
            </div>
          ))}
          <button className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 shrink-0">
            <Plus size={20} />
          </button>
        </div>
      </section>

      {/* My Radios */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Minhas Rádios</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onPageChange?.("create-radio")}
              className="text-[10px] font-black text-neon-cyan uppercase tracking-widest hover:underline"
            >
              + Criar
            </button>
            <RadioIcon size={14} className="text-white/20" />
          </div>
        </div>
        {userRadios.length === 0 ? (
          <Card 
            className="p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/5 hover:border-neon-cyan/20 cursor-pointer transition-all" 
            variant="default"
            onClick={() => onPageChange?.("create-radio")}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <Plus size={24} />
            </div>
            <div className="text-center">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Nenhuma Rádio Ativa</h4>
              <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">Clique para criar sua primeira estação</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {userRadios.map((radio) => (
              <Card 
                key={radio.id}
                className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all" 
                variant="highlight"
                onClick={() => onPageChange?.("dj-deck")}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={radio.image} alt={radio.name} className="w-full h-full object-cover" />
                    {radio.status === "live" && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">{radio.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[8px] font-bold uppercase tracking-widest",
                        radio.status === "live" ? "text-success" : "text-white/20"
                      )}>
                        Status: {radio.status}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{radio.category}</span>
                    </div>
                  </div>
                </div>
                <Button variant="primary" className="w-10 h-10 p-0 rounded-xl bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                  <ChevronRight size={18} />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Favorite Radios */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Rádios Favoritas</h3>
          <Heart size={14} className="text-error/40" />
        </div>
        <div className="flex flex-col gap-3">
          {MOCK_FAVORITES.map((radio) => (
            <Card
              key={radio.id}
              className="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer group transition-all"
              variant="default"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img src={radio.image} alt={radio.name} className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error shadow-[0_0_5px_#FF3131]" />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <h4 className="text-xs font-black text-white uppercase tracking-tight leading-none">{radio.name}</h4>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{radio.host}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan">
                  Live
                </span>
                <div className="flex items-center gap-1">
                  <Users size={8} className="text-white/20" />
                  <span className="text-[8px] font-bold text-white/40">{radio.listeners}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black-pure/80 backdrop-blur-md"
            onClick={() => setIsSettingsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm"
          >
            <Card className="p-6 flex flex-col gap-6" variant="highlight">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Configurações</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-white/20 hover:text-white">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nome de Usuário</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Privacidade da Malha</label>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 h-10 text-[10px]">Público</Button>
                    <Button variant="ghost" className="flex-1 h-10 text-[10px] border border-white/5">Privado</Button>
                  </div>
                </div>

                {userRadios.length > 0 && (
                  <div className="flex flex-col gap-3 mt-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Gerenciar Rádios</label>
                    <div className="flex flex-col gap-2">
                      {userRadios.map((radio) => (
                        <div key={radio.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <img src={radio.image} alt={radio.name} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-xs font-bold text-white/80">{radio.name}</span>
                          </div>
                          <button 
                            onClick={() => {
                              onDeleteRadio?.(radio.id);
                            }}
                            className="text-[10px] font-black text-error uppercase tracking-widest hover:text-error/60 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                variant="primary" 
                className="w-full h-12 mt-2"
                onClick={() => {
                  alert("Perfil Atualizado!");
                  setIsSettingsOpen(false);
                }}
              >
                Salvar Alterações
              </Button>

              <div className="h-px bg-white/5 my-2" />

              <Button 
                variant="danger" 
                className="w-full h-12 gap-2"
                onClick={onLogout}
              >
                <LogOut size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão (Logout)</span>
              </Button>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
