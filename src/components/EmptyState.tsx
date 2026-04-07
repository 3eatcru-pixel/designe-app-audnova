import * as React from "react";
import { Radio, Signal } from "lucide-react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  type: "radio" | "signal" | "guest";
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, className }) => {
  const configs = {
    radio: {
      icon: <Radio className="w-12 h-12 text-white/20" />,
      title: "Radios nao encontradas = 0",
      description: "Nenhuma frequência ativa detectada no radar no momento.",
    },
    signal: {
      icon: <Signal className="w-12 h-12 text-white/20" />,
      title: "Sinal nao encontrado = 0",
      description: "O sinal da malha mesh está instável ou inexistente nesta zona.",
    },
    guest: {
      icon: <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center text-white/20">🔒</div>,
      title: "Modo Visitante",
      description: "Crie uma conta para interagir com a comunidade e acessar todas as funções.",
    },
  };

  const config = configs[type];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <div className="mb-4 animate-pulse">{config.icon}</div>
      <h3 className="text-lg font-bold text-white/80 mb-2">{config.title}</h3>
      <p className="text-sm text-white/40 max-w-[240px] leading-relaxed">{config.description}</p>
    </div>
  );
};
