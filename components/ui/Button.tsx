"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
}

const variants = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  outline: "bg-transparent text-emerald-600 border-2 border-emerald-500 hover:bg-emerald-50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className = "",
  ...props
}: ButtonProps & { className?: string }) {
  return (
    <motion.button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </motion.button>
  );
}

export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  ...props
}: Omit<ButtonProps, "icon" | "iconPosition" | "fullWidth">) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center
        rounded-xl
        transition-colors duration-200
        ${variants[variant]}
        ${iconSizes[size]}
      `}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
