import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Zap, Globe, UserPlus, LogIn, User } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { AuthMode } from "../types";

interface AuthPageProps {
  onLogin: (mode: AuthMode) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isCreatingAccount, setIsCreatingAccount] = React.useState(false);
  const [activationKey, setActivationKey] = React.useState("");

  const handleCreateAccount = () => {
    if (activationKey.trim()) {
      onLogin("user");
    } else {
      alert("Por favor, insira uma chave de ativação válida.");
    }
  };

  return (
    <div className="min-h-screen bg-black-pure flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-neon-cyan/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-neon-indigo/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="w-full max-w-[420px] flex flex-col items-center z-10">
        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-neon-cyan to-neon-indigo p-0.5 mb-6 mx-auto shadow-[0_0_40px_rgba(0,255,255,0.2)]">
            <div className="w-full h-full bg-black-pure rounded-[30px] flex items-center justify-center">
              <Shield className="w-12 h-12 text-neon-cyan drop-shadow-[0_0_10px_#00FFFF]" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
            AntiGravity <span className="text-neon-cyan">V23</span>
          </h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">
            P2P Mesh Radio & Live Chat
          </p>
        </motion.div>

        {/* Auth Options */}
        <Card className="w-full p-8 flex flex-col gap-6" variant="highlight">
          <AnimatePresence mode="wait">
            {!isCreatingAccount ? (
              <motion.div
                key="login-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <Button
                  onClick={() => onLogin("user")}
                  className="w-full justify-start gap-4 h-16"
                  variant="primary"
                >
                  <LogIn size={20} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-black uppercase">Conectar</span>
                    <span className="text-[10px] font-normal opacity-60 lowercase">Acessar sua identidade</span>
                  </div>
                </Button>

                <Button
                  onClick={() => setIsCreatingAccount(true)}
                  className="w-full justify-start gap-4 h-16"
                  variant="secondary"
                >
                  <UserPlus size={20} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-black uppercase">Criar Identidade</span>
                    <span className="text-[10px] font-normal opacity-60 lowercase">Novo registro na malha</span>
                  </div>
                </Button>

                <div className="relative py-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-4 bg-black-pure text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    Ou
                  </span>
                </div>

                <Button
                  onClick={() => onLogin("guest")}
                  className="w-full h-14"
                  variant="ghost"
                >
                  <User size={18} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Entrar como Visitante</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="activation-key"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Chave de Ativação</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                    Para criar uma nova identidade, você precisa de uma chave gerada por um usuário ativo.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[8px] font-bold text-neon-cyan uppercase tracking-widest">Inserir Chave</label>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none font-mono tracking-widest"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleCreateAccount}
                    className="w-full h-12"
                    variant="primary"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Validar e Criar</span>
                  </Button>
                  <Button
                    onClick={() => setIsCreatingAccount(false)}
                    className="w-full h-12"
                    variant="ghost"
                  >
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Voltar</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex flex-col items-center gap-1">
              <Zap size={14} className="text-neon-cyan" />
              <span className="text-[8px] font-bold text-white/40 uppercase">Zero Delay</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Globe size={14} className="text-neon-indigo" />
              <span className="text-[8px] font-bold text-white/40 uppercase">P2P Mesh</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield size={14} className="text-success" />
              <span className="text-[8px] font-bold text-white/40 uppercase">Encrypted</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-12 text-[10px] font-bold text-white/20 uppercase tracking-widest text-center">
          GossipEngine v3.1.4 <br />
          <span className="opacity-50">© 2026 Aether Mesh Network</span>
        </p>
      </div>
    </div>
  );
};
