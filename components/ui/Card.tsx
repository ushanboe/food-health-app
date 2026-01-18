"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const variants = {
  default: "bg-white",
  elevated: "bg-white shadow-lg",
  outlined: "bg-white border border-gray-100",
  glass: "bg-white/80 backdrop-blur-lg",
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        rounded-2xl
        ${variants[variant]}
        ${paddings[padding]}
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        transition-all duration-200
        ${className}
      `}
      style={{
        boxShadow: variant === "default" ? "0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)" : undefined,
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-gray-500 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-3 border-t border-gray-50 ${className}`}>
      {children}
    </div>
  );
}
