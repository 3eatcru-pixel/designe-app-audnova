import * as React from "react";
import { cn } from "../lib/utils";

interface ChipProps {
  variant?: "default" | "active" | "muted";
  label: string;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ variant = "default", label, onClick, className }) => {
  const variants = {
    default: "bg-gray-medium text-white/60 border border-white/10 hover:bg-gray-light",
    active: "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 text-glow-cyan",
    muted: "bg-transparent text-white/30 border border-white/5",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
        variants[variant],
        className
      )}
    >
      {label}
    </button>
  );
};
