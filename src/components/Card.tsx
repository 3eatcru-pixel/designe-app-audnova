import * as React from "react";
import { cn } from "../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "highlight" | "warning";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    const variants = {
      default: "glass",
      highlight: "glass border-neon-cyan/30 neon-glow-cyan",
      warning: "glass border-warning/30 bg-warning/5",
    };

    const paddings = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-2xl overflow-hidden",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
