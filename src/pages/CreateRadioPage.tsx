import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Radio as RadioIcon, Image as ImageIcon, Music, Plus, Save, Trash2, Folder } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { CATEGORIES } from "../constants";
import { Radio } from "../types";
import { cn } from "../lib/utils";

interface CreateRadioPageProps {
  onBack: () => void;
  onCreate: (radio: Radio) => void;
}

export const CreateRadioPage: React.FC<CreateRadioPageProps> = ({ onBack, onCreate }) => {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [logo, setLogo] = React.useState("");
  const [carouselImage, setCarouselImage] = React.useState("");
  const [selectedFolder, setSelectedFolder] = React.useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Por favor, insira o nome da rádio.");
      return;
    }

    const newRadio: Radio = {
      id: "radio-" + Date.now().toString(),
      name: name,
      host: "CyberRunner_23", // Current user
      listeners: 0,
      status: "live",
      category: category,
      signal: 100,
      image: logo || `https://picsum.photos/seed/${name}/400/400`,
    };

    onCreate(newRadio);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-10 h-10 p-0 rounded-xl"
            onClick={onBack}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Criar Nova Rádio</h2>
            <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mt-1">Inicie sua Transmissão</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar flex flex-col gap-6 pb-32">
        {/* Basic Info */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Informações Básicas</h3>
          <Card className="p-4 flex flex-col gap-4" variant="default">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nome da Rádio</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CyberRunner FM"
                className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-neon-cyan/50 outline-none transition-colors appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-black-pure">{cat}</option>
                ))}
              </select>
            </div>
          </Card>
        </section>

        {/* Visuals */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Visual & Identidade</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 flex flex-col gap-3 items-center justify-center text-center" variant="default">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 border border-dashed border-white/10">
                {logo ? <img src={logo} className="w-full h-full rounded-xl object-cover" /> : <RadioIcon size={24} />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-white uppercase">Logo da Rádio</span>
                <span className="text-[7px] text-white/20 uppercase tracking-widest">400x400px</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[8px] border border-white/5" onClick={() => setLogo(`https://picsum.photos/seed/${Date.now()}/400/400`)}>
                Upload
              </Button>
            </Card>
            <Card className="p-4 flex flex-col gap-3 items-center justify-center text-center" variant="default">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 border border-dashed border-white/10">
                {carouselImage ? <img src={carouselImage} className="w-full h-full rounded-xl object-cover" /> : <ImageIcon size={24} />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-white uppercase">Foto Carrossel</span>
                <span className="text-[7px] text-white/20 uppercase tracking-widest">1920x1080px</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[8px] border border-white/5" onClick={() => setCarouselImage(`https://picsum.photos/seed/carousel-${Date.now()}/1920/1080`)}>
                Upload
              </Button>
            </Card>
          </div>
        </section>

        {/* Music Source */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Fonte de Áudio</h3>
          <Card className="p-4 flex flex-col gap-4" variant="default">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Selecionar Pasta ou Músicas</label>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className={cn(
                    "flex-1 h-12 gap-2 border border-white/5",
                    selectedFolder === "local" && "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                  )}
                  onClick={() => setSelectedFolder("local")}
                >
                  <Folder size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pasta Local</span>
                </Button>
                <Button 
                  variant="secondary" 
                  className={cn(
                    "flex-1 h-12 gap-2 border border-white/5",
                    selectedFolder === "mesh" && "border-neon-indigo/50 bg-neon-indigo/10 text-neon-indigo"
                  )}
                  onClick={() => setSelectedFolder("mesh")}
                >
                  <Music size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Mesh Cloud</span>
                </Button>
              </div>
            </div>
            {selectedFolder && (
              <div className="p-3 rounded-xl bg-success/5 border border-success/20 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-bold text-success uppercase tracking-widest">
                  {selectedFolder === "local" ? "Pasta /Music/Cyberpunk selecionada" : "Playlist 'Night City' vinculada"}
                </span>
              </div>
            )}
          </Card>
        </section>

        {/* Submit */}
        <Button 
          variant="primary" 
          className="w-full h-14 gap-3 bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          onClick={handleCreate}
        >
          <Save size={20} />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Finalizar e Iniciar Rádio</span>
        </Button>
      </div>
    </div>
  );
};
