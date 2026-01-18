"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  rightAction,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-40 ${
        transparent
          ? "bg-transparent"
          : "bg-white/90 backdrop-blur-lg border-b border-gray-100"
      }`}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </motion.button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          {rightAction && <div>{rightAction}</div>}
        </div>
      </div>
    </motion.header>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-gray-50 pb-24 ${className}`}>
      <div className="max-w-lg mx-auto">
        {children}
      </div>
    </main>
  );
}

export function PageContent({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}
