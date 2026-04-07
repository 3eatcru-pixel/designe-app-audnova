import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Mic, ChevronLeft, MoreVertical, Zap, User as UserIcon, Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import { Message, User, Page } from "../types";
import { cn } from "../lib/utils";
import { MOCK_FRIENDS } from "../constants";

interface P2PChatPageProps {
  friendId: string | null;
  onPageChange: (page: Page) => void;
}

export const P2PChatPage: React.FC<P2PChatPageProps> = ({ friendId, onPageChange }) => {
  const friend = MOCK_FRIENDS.find(f => f.id === friendId) || MOCK_FRIENDS[0];
  
  const [messages, setMessages] = React.useState<Message[]>([
    { id: "p1", sender: friend.name, text: "O sinal está forte hoje.", timestamp: new Date(), isMe: false },
    { id: "p2", sender: "CyberRunner_23", text: "Confirmado. Recebendo pacotes.", timestamp: new Date(), isMe: true, status: "sent" },
  ]);
  const [inputText, setInputText] = React.useState("");
  const [isPlusMenuOpen, setIsPlusMenuOpen] = React.useState(false);
  const [clipStatus, setClipStatus] = React.useState<"idle" | "requested" | "ready" | "sending" | "sent" | "error">("idle");

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: "msg-" + Date.now().toString(),
      sender: "CyberRunner_23",
      text: inputText,
      timestamp: new Date(),
      isMe: true,
      status: "sent",
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleSendVoice = () => {
    setClipStatus("requested");
    setTimeout(() => setClipStatus("sending"), 1000);
    setTimeout(() => {
      setClipStatus("sent");
      const newMessage: Message = {
        id: "voice-" + Date.now().toString(),
        sender: "CyberRunner_23",
        text: "🎤 Mensagem de Voz [0:15s]",
        timestamp: new Date(),
        isMe: true,
        status: "sent",
      };
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => setClipStatus("idle"), 2000);
    }, 3000);
  };

  const handleSendHyper = () => {
    alert("Hyper Enviado! -1 da sua carteira.");
    const newMessage: Message = {
      id: "hyper-" + Date.now().toString(),
      sender: "CyberRunner_23",
      text: "⚡ ENVIOU 1 HYPER!",
      timestamp: new Date(),
      isMe: true,
      status: "sent",
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsPlusMenuOpen(false);
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-10 h-10 p-0 rounded-xl"
            onClick={() => onPageChange("p2p-list")}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl glass p-0.5">
                <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-lg object-cover" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-success border-2 border-black-pure" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{friend.name}</h3>
              <span className="text-[8px] font-bold text-success uppercase tracking-widest mt-1">Conexão P2P Segura</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-xl">
          <MoreVertical size={18} />
        </Button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.isMe ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {!msg.isMe && <span className="text-[9px] font-black text-neon-indigo uppercase">{msg.sender}</span>}
              <span className="text-[8px] font-bold text-white/20 uppercase">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div
              className={cn(
                "px-4 py-2 rounded-2xl text-sm leading-relaxed",
                msg.isMe
                  ? "bg-neon-indigo/20 text-white border border-neon-indigo/30 rounded-tr-none"
                  : "bg-white/5 text-white/80 border border-white/10 rounded-tl-none"
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-bold text-white/10 uppercase tracking-tighter">ID: {msg.id}</span>
                {msg.text}
              </div>
            </div>
            {msg.isMe && msg.status && (
              <div className="mt-1">
                <span className="text-[8px] font-bold text-white/20 uppercase">{msg.status}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 shrink-0 pt-4 pb-32">
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <AnimatePresence>
              {isPlusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-14 left-0 w-32 glass rounded-xl p-1 flex flex-col gap-1 shadow-2xl border border-white/10 z-[100]"
                >
                  <button
                    onClick={() => {
                      handleSendVoice();
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full h-10 px-3 rounded-lg hover:bg-white/5 flex items-center gap-2 text-white/60 hover:text-neon-indigo transition-all"
                  >
                    <Mic size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voz</span>
                  </button>
                  <button
                    onClick={handleSendHyper}
                    className="w-full h-10 px-3 rounded-lg hover:bg-white/5 flex items-center gap-2 text-white/60 hover:text-warning transition-all"
                  >
                    <Zap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hyper</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              disabled={clipStatus !== "idle"}
              className={cn(
                "w-10 h-10 shrink-0 rounded-xl glass flex items-center justify-center text-white/40 hover:text-neon-indigo transition-all relative overflow-hidden",
                (clipStatus !== "idle" || isPlusMenuOpen) && "text-neon-indigo"
              )}
            >
              <Plus size={20} className={cn("transition-transform", isPlusMenuOpen && "rotate-45")} />
              {clipStatus !== "idle" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 3 }}
                  className="absolute bottom-0 left-0 w-0.5 bg-neon-indigo"
                />
              )}
            </button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem P2P..."
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-indigo/50 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            className="w-12 h-12 rounded-xl bg-neon-indigo text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <Send size={18} />
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">P2P Secure Channel v3</span>
          {clipStatus !== "idle" && <StatusPill status={clipStatus} />}
        </div>
      </div>
    </div>
  );
};
