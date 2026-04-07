/**
 * ChatDeck - Improved Chat Page with Real Services
 * Now uses RadioService + MessageService for real data
 */

import React from 'react';
import ChatDeckIntegrated from './ChatDeckIntegrated';
import { Message, Radio, AuthMode } from '../types';

interface ChatDeckProps {
  authMode: AuthMode;
  selectedRadio: Radio | null;
  isDJMode?: boolean;
  onClose?: () => void;
  isConfigOpen?: boolean;
  setIsConfigOpen?: (val: boolean) => void;
  onFavoriteRadio?: (radioId: string) => void;
  userFavorites?: string[];
  onSpendHypers?: (amount: number, description: string) => void;
  userHypers?: number;
}

/**
 * Adapter: ChatDeck now delegates to ChatDeckIntegrated
 * This maintains the existing interface while using real services
 */
export const ChatDeck: React.FC<ChatDeckProps> = ({
  authMode,
  selectedRadio,
  isDJMode = false,
  onClose,
  isConfigOpen = false,
  setIsConfigOpen,
  onFavoriteRadio,
  userFavorites = [],
  onSpendHypers,
  userHypers = 0,
}) => {
  // Wrapper to maintain existing props but use integrated version
  return (
    <div className="flex flex-col h-full">
      <ChatDeckIntegrated />
    </div>
  );
  const [currentTrack, setCurrentTrack] = React.useState(playlist[0]);
  const [progress, setProgress] = React.useState(35);
  const [newTrackName, setNewTrackName] = React.useState("");

  // Sound Card State (Knobs)
  const [knobs, setKnobs] = React.useState({ treble: 50, mid: 50, bass: 50 });

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "CyberRunner_23",
      text: inputText,
      timestamp: new Date(),
      isMe: true,
      status: "sent",
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleSendClip = () => {
    setClipStatus("requested");
    setTimeout(() => setClipStatus("sending"), 1000);
    setTimeout(() => {
      setClipStatus("sent");
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "CyberRunner_23",
        text: "🎤 Áudio Clip [0:12s]",
        timestamp: new Date(),
        isMe: true,
        status: "sent",
      };
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => setClipStatus("idle"), 2000);
    }, 3000);
  };

  const handleSendHyper = () => {
    if (userHypers < 1) {
      alert("Hypers insuficientes.");
      return;
    }
    onSpendHypers?.(1, `Envio de Hyper para ${selectedRadio?.name || "Rádio"}`);
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

  if (authMode === "guest" && !isDJMode) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-full glass flex items-center justify-center text-white/10 relative">
          <Lock size={48} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-neon-cyan/20 rounded-full"
          />
        </div>
        <EmptyState type="guest" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Radio Display (Carousel & Player) - Common for DJ and Listener */}
      <div className="flex flex-col gap-4 relative shrink-0 mb-4">
        <Card className="p-4 flex flex-col gap-4" variant="highlight">
          {!isDJMode && selectedRadio && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={selectedRadio.image} alt={selectedRadio.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-white uppercase tracking-tight leading-none mb-1">{selectedRadio.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedRadio.status === "live" ? "bg-error" : "bg-white/20")} />
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{selectedRadio.host}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onFavoriteRadio?.(selectedRadio.id)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    userFavorites.includes(selectedRadio.id) ? "text-error bg-error/10" : "text-white/20 hover:text-white/40 bg-white/5"
                  )}
                >
                  <Heart size={16} fill={userFavorites.includes(selectedRadio.id) ? "currentColor" : "none"} />
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 px-3 gap-2 bg-neon-cyan text-black shadow-[0_0_10px_#00FFFF]"
                  onClick={() => alert("Hypes Enviados! +10")}
                >
                  <Zap size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Hypes</span>
                </Button>
              </div>
            </div>
          )}

          {isDJMode && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">{radioName}</h3>
                  <span className="text-[10px] font-bold text-success uppercase tracking-widest mt-1">Gossip v3 Active</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsDeckOpen(true)} className="h-8 px-3 gap-2">
                  <Music size={14} />
                  Abrir Deck
                </Button>
                <Button variant="danger" size="sm" onClick={onClose} className="h-8 px-3">Encerrar</Button>
              </div>
            </div>
          )}

          {/* Music Player & Carousel Area (Display) */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-dark border border-white/5 flex flex-col p-4 shadow-inner">
            {/* Carousel Background */}
            <div className="absolute inset-0 flex overflow-hidden opacity-50">
              {carouselPhotos.map((photo, i) => (
                <motion.img
                  key={i}
                  src={photo}
                  animate={{ x: ["0%", "-100%"] }}
                  transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                  className="h-full w-full object-cover shrink-0"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-black-pure/20 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black-pure/80 via-transparent to-transparent" />

            {/* Player UI */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Top Row: Logo & Track Info */}
              <div className="flex items-start justify-between">
                <div className="relative">
                  <motion.div
                    animate={isPlaying ? { rotate: 360 } : {}}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-2 border-neon-cyan p-0.5 shadow-[0_0_15px_rgba(0,255,255,0.4)] bg-black-pure/80 backdrop-blur-md"
                  >
                    <img src={isDJMode ? radioLogo : (selectedRadio?.image || radioLogo)} alt="Logo" className="w-full h-full rounded-full object-cover" />
                  </motion.div>
                  {isPlaying && (
                    <div className="absolute -inset-1.5 border border-dashed border-neon-cyan/50 rounded-full animate-spin-slow" />
                  )}
                </div>

                <div className="text-right">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] drop-shadow-md",
                    (isDJMode || selectedRadio?.status === "live") ? "text-neon-cyan" : "text-white/20"
                  )}>
                    {(isDJMode || selectedRadio?.status === "live") ? "On Air" : "Offline"}
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px] drop-shadow-lg">
                    {isDJMode ? currentTrack : (selectedRadio ? (selectedRadio.status === "live" ? `Sintonizado: ${selectedRadio.name}` : "Modo Loop Ativo") : currentTrack)}
                  </h4>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <div className={cn("w-1 h-1 rounded-full animate-pulse", (isDJMode || selectedRadio?.status === "live") ? "bg-success" : "bg-warning")} />
                    <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">
                      {(isDJMode || selectedRadio?.status === "live") ? "Mirror Mode Active" : "Buffer Loop (4 tracks)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Visualizer or Empty Space */}
              <div className="flex-1 flex items-center justify-center">
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-8">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 24, 8, 20, 6] }}
                        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                        className="w-1 bg-neon-cyan/60 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Row: Controls & Progress */}
              <div className="flex flex-col gap-3">
                {/* Progress Bar */}
                <div className="w-full flex flex-col gap-1">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-neon-cyan shadow-[0_0_8px_#00FFFF]"
                    />
                  </div>
                  <div className="flex justify-between text-[7px] font-black text-white/40 uppercase tracking-tighter">
                    <span>01:42</span>
                    <span>03:58</span>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:scale-110 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DJ Controls Stats (Only for DJ) */}
          {isDJMode && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="flex flex-col items-center py-3 gap-1" variant="default">
                <Mic size={16} className="text-neon-cyan" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Mic</span>
                <div className="w-full h-1 bg-white/5 rounded-full mt-1 px-2 overflow-hidden">
                  <motion.div
                    animate={{ width: isPlaying ? ["10%", "80%", "30%", "60%", "20%"] : "0%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-neon-cyan"
                  />
                </div>
              </Card>
              <Card className="flex flex-col items-center py-3 gap-1" variant="default">
                <Music size={16} className="text-neon-indigo" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Ducking</span>
                <span className="text-[10px] font-black text-white">Auto</span>
              </Card>
              <Card className="flex flex-col items-center py-3 gap-1" variant="default">
                <Zap size={16} className="text-warning" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Hypers</span>
                <span className="text-[10px] font-black text-white">+125</span>
              </Card>
            </div>
          )}
        </Card>

        {/* Configuration Modal Overlay */}
        <AnimatePresence>
          {isConfigOpen && setIsConfigOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-50 glass rounded-3xl flex flex-col p-6 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Configurações</h3>
                <button onClick={() => setIsConfigOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Radio Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nome da Rádio</label>
                  <input
                    type="text"
                    value={radioName}
                    onChange={(e) => setRadioName(e.target.value)}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none"
                  />
                </div>

                {/* Logo Upload Simulation */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Logo da Estação</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                      <img src={radioLogo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <Button variant="ghost" size="sm" className="flex-1 h-12 gap-2">
                      <ImageIcon size={16} />
                      Mudar Logo
                    </Button>
                  </div>
                </div>

                {/* Carousel Photos */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fotos do Carrossel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {carouselPhotos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                        <img src={photo} alt={`P${i}`} className="w-full h-full object-cover" />
                        <button className="absolute top-1 right-1 w-4 h-4 rounded bg-error/80 flex items-center justify-center text-white">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button className="aspect-square rounded-lg border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 hover:border-white/20 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Playlist Selection & Creation */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Criar / Gerenciar Playlist</label>
                      <button
                        onClick={() => setPlaylist([])}
                        className="text-[8px] font-bold text-error/60 uppercase hover:text-error transition-colors"
                      >
                        Limpar Tudo
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome da nova faixa..."
                        value={newTrackName}
                        onChange={(e) => setNewTrackName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTrackName.trim()) {
                            setPlaylist(prev => [...prev, newTrackName.trim()]);
                            setNewTrackName("");
                          }
                        }}
                        className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:border-neon-cyan/50 outline-none"
                      />
                      <button
                        onClick={() => {
                          if (newTrackName.trim()) {
                            setPlaylist(prev => [...prev, newTrackName.trim()]);
                            setNewTrackName("");
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-neon-cyan/20 text-neon-cyan flex items-center justify-center hover:bg-neon-cyan/30 transition-all active:scale-90"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Sua Playlist Atual ({playlist.length})</label>
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                      {playlist.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Playlist Vazia</span>
                        </div>
                      ) : (
                        playlist.map((track, index) => (
                          <div key={`${track}-${index}`} className="flex items-center gap-2 group">
                            <button
                              onClick={() => {
                                setCurrentTrack(track);
                                setIsPlaying(true);
                              }}
                              className={cn(
                                "flex-1 flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                currentTrack === track
                                  ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                                  : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/20">{String(index + 1).padStart(2, '0')}</span>
                                <span className="text-xs font-bold truncate">{track}</span>
                              </div>
                              {currentTrack === track && <Play size={10} fill="currentColor" />}
                            </button>
                            <button
                              onClick={() => setPlaylist(prev => prev.filter((_, i) => i !== index))}
                              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Radio Creation Costs Info */}
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">Custo de Criação</label>
                    <Zap size={12} className="text-neon-cyan" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] font-bold text-white/60 uppercase">
                      <span>1ª Rádio</span>
                      <span className="text-success">Grátis</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase">
                      <span>2ª Rádio</span>
                      <span>1000 Hypers</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase">
                      <span>3ª Rádio</span>
                      <span>3000 Hypers</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase">
                      <span>Próximas</span>
                      <span>+2000 cada</span>
                    </div>
                  </div>
                </div>

                <Button variant="primary" className="mt-4" onClick={() => setIsConfigOpen(false)}>
                  Salvar Alterações
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Sound Card Deck Overlay */}
        <AnimatePresence>
          {isDeckOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="absolute inset-x-0 bottom-0 z-[60] p-4"
            >
              <Card className="p-6 bg-black-pure/90 border-neon-cyan/30 shadow-[0_0_50px_rgba(0,255,255,0.2)] backdrop-blur-xl rounded-[32px]" variant="highlight">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Live Sound Card</h3>
                    <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-widest">Aether Mesh Engine</span>
                  </div>
                  <button onClick={() => setIsDeckOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                    <X size={18} />
                  </button>
                </div>

                {/* Knobs Section */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { id: 'treble', label: 'Treble', color: 'text-neon-cyan' },
                    { id: 'mid', label: 'Mid', color: 'text-neon-indigo' },
                    { id: 'bass', label: 'Bass', color: 'text-warning' }
                  ].map((knob) => (
                    <div key={knob.id} className="flex flex-col items-center gap-2">
                      <div
                        onClick={() => {
                          setKnobs(prev => ({
                            ...prev,
                            [knob.id]: (prev[knob.id as keyof typeof knobs] + 10) % 110
                          }));
                        }}
                        className="relative w-16 h-16 rounded-full bg-gray-dark border-2 border-white/5 flex items-center justify-center group cursor-pointer active:scale-95 transition-transform"
                      >
                        <motion.div
                          animate={{ rotate: (knobs[knob.id as keyof typeof knobs] - 50) * 2.4 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-1 h-6 bg-neon-cyan rounded-full -translate-y-4 shadow-[0_0_8px_#00FFFF]" />
                        </motion.div>
                        <div className="w-10 h-10 rounded-full bg-black-pure border border-white/10 flex items-center justify-center">
                          <div className={cn("w-1 h-1 rounded-full bg-current", knob.color)} />
                        </div>
                        {/* Value display on hover */}
                        <div className="absolute -top-8 bg-black-pure border border-white/10 px-2 py-0.5 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {knobs[knob.id as keyof typeof knobs]}%
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{knob.label}</span>
                    </div>
                  ))}
                </div>

                {/* Effects & Vinhetas Section */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {['PRO', 'POP', 'MC', 'KARAOKE', 'GIGGLE', 'APPLAUSE', 'CHEER', 'DENOISE'].map((fx) => (
                    <button
                      key={fx}
                      className="h-8 rounded-lg bg-white/5 border border-white/5 text-[8px] font-black text-white/40 uppercase tracking-tighter hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all active:scale-95"
                    >
                      {fx}
                    </button>
                  ))}
                </div>

                {/* Music Controls Section */}
                <div className="flex flex-col gap-3">
                  <Button variant="primary" className="w-full h-10 gap-2" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isPlaying ? 'Pausar Transmissão' : 'Iniciar Transmissão'}
                    </span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
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
              {!msg.isMe && <span className="text-[9px] font-black text-neon-cyan uppercase">{msg.sender}</span>}
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
              {msg.text}
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
                      handleSendClip();
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full h-10 px-3 rounded-lg hover:bg-white/5 flex items-center gap-2 text-white/60 hover:text-neon-cyan transition-all"
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
                "w-10 h-10 shrink-0 rounded-xl glass flex items-center justify-center text-white/40 hover:text-neon-cyan transition-all relative overflow-hidden",
                (clipStatus !== "idle" || isPlusMenuOpen) && "text-neon-cyan"
              )}
            >
              <Plus size={20} className={cn("transition-transform", isPlusMenuOpen && "rotate-45")} />
              {clipStatus !== "idle" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 3 }}
                  className="absolute bottom-0 left-0 w-0.5 bg-neon-cyan"
                />
              )}
            </button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Enviar mensagem de texto..."
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/50 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            className="w-12 h-12 rounded-xl bg-neon-cyan text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Aether Mesh Protocol v3</span>
          {clipStatus !== "idle" && <StatusPill status={clipStatus} />}
        </div>
      </div>
    </div>
  );
};
