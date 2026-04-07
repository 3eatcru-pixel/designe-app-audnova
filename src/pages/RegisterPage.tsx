import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, User, Lock, Camera, Check } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { cn } from "../lib/utils";

interface RegisterPageProps {
  inviteCode: string;
  onBack: () => void;
  onRegister: (data: { name: string; avatar: string }) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ inviteCode, onBack, onRegister }) => {
  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState(`https://picsum.photos/seed/${Date.now()}/200/200`);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setAvatar(`https://picsum.photos/seed/${Date.now()}/200/200`);
      setIsUploading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRegister({ name, avatar });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 shrink-0 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-10 h-10 p-0 rounded-xl"
          onClick={onBack}
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Criar Identidade</h2>
          <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mt-1">Convite: {inviteCode}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-2 border-neon-cyan p-1 shadow-[0_0_30px_rgba(0,255,255,0.1)] overflow-hidden">
              <img src={avatar} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
            </div>
            <button 
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-neon-cyan text-black flex items-center justify-center border-4 border-black-pure hover:scale-110 transition-all disabled:opacity-50"
            >
              <Camera size={18} />
            </button>
          </div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Toque na câmera para mudar a foto</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome de Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CyberRunner_01"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:border-neon-cyan/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Senha da Malha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:border-neon-cyan/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pb-8">
          <Button 
            type="submit"
            variant="primary" 
            className="w-full h-14 rounded-2xl bg-neon-cyan text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.2)]"
          >
            Ativar Perfil
          </Button>
        </div>
      </form>
    </div>
  );
};
