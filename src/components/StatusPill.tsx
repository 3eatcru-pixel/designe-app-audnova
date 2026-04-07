import * as React from "react";
import { cn } from "../lib/utils";

interface StatusPillProps {
  status: "idle" | "requested" | "ready" | "sending" | "sent" | "error";
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const configs = {
    idle: { label: "Aguardando", color: "bg-white/20 text-white/60" },
    requested: { label: "Solicitado", color: "bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/30" },
    ready: { label: "Pronto", color: "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" },
    sending: { label: "Enviando...", color: "bg-warning/20 text-warning border border-warning/30 animate-pulse" },
    sent: { label: "Enviado", color: "bg-success/20 text-success border border-success/30" },
    error: { label: "Erro", color: "bg-error/20 text-error border border-error/30" },
  };

  const config = configs[status];

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
        config.color,
        className
      )}
    >
      {config.label}
    </div>
  );
};
