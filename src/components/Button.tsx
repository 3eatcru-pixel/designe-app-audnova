import * as React from "react";
import { cn } from "../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-neon-cyan text-black font-bold neon-glow-cyan hover:bg-cyan-300 active:scale-95",
      secondary: "bg-neon-indigo text-white font-bold neon-glow-indigo hover:bg-indigo-700 active:scale-95",
      ghost: "bg-transparent text-white border border-white/20 hover:bg-white/10 active:scale-95",
      danger: "bg-error text-white font-bold hover:bg-red-700 active:scale-95",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-lg",
      md: "px-6 py-3 text-sm rounded-xl",
      lg: "px-8 py-4 text-base rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 outline-none focus:ring-2 focus:ring-neon-cyan/50 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
