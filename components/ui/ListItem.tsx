"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface ListItemProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string | ReactNode;
  showArrow?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({
  icon,
  title,
  subtitle,
  value,
  showArrow = false,
  onClick,
  className = "",
}: ListItemProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`
        w-full flex items-center gap-3 p-4
        bg-white rounded-xl
        ${onClick ? "cursor-pointer active:bg-gray-50" : ""}
        transition-colors duration-150
        ${className}
      `}
      style={{
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
    >
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-base font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {value && (
        <div className="flex-shrink-0 text-right">
          {typeof value === "string" ? (
            <span className="text-sm font-medium text-gray-600">{value}</span>
          ) : (
            value
          )}
        </div>
      )}
      {showArrow && (
        <ChevronRight size={20} className="flex-shrink-0 text-gray-300" />
      )}
    </Component>
  );
}

interface ListGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ title, children, className = "" }: ListGroupProps) {
  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
