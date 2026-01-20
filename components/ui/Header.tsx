"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import Image from "next/image";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
  variant?: "default" | "green";
  showGreeting?: boolean;
  showLogo?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Header({
  title,
  subtitle,
  showBack = false,
  rightAction,
  transparent = false,
  variant = "green",
  showGreeting = false,
  showLogo = true,
}: HeaderProps) {
  const router = useRouter();
  const greeting = getGreeting();

  // Green variant - new unified design
  if (variant === "green") {
    return (
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-gradient-to-br from-emerald-500 to-emerald-600"
      >
        <div className="max-w-lg mx-auto px-5 pt-8 pb-5">
          <div className="flex flex-col items-center text-center">
            {/* Logo - now above greeting */}
            {showLogo && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-3"
              >
                <Image
                  src="/logo-icon.png"
                  alt="FitFork"
                  width={120}
                  height={120}
                  className="rounded-3xl shadow-xl"
                />
              </motion.div>
            )}
            
            {/* Greeting - only on home page, now below logo */}
            {showGreeting && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white text-lg font-medium"
              >
                {greeting} 👋
              </motion.p>
            )}
            
            {/* Page Title - shown on non-home pages */}
            {title && (
              <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white"
              >
                {title}
              </motion.h1>
            )}
            
            {subtitle && (
              <p className="text-sm text-emerald-100 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Right action if provided */}
          {rightAction && (
            <div className="absolute right-5 top-8">
              {rightAction}
            </div>
          )}
        </div>
      </motion.header>
    );
  }

  // Default variant - original white design (for Profile page)
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
    <div className="flex flex-col h-screen h-[100dvh]">
      <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 pb-24 ${className}`}
            style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageContent({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}
