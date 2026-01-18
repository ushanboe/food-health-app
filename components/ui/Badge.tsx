"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away";
  size?: "sm" | "md";
}

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
  };

  return (
    <span
      className={`
        inline-block rounded-full
        ${statusColors[status]}
        ${dotSizes[size]}
      `}
    />
  );
}
