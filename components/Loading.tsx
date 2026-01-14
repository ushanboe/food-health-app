"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Scan, Sparkles, Database, CheckCircle } from "lucide-react";

interface LoadingAnalysisProps {
  stage?: "scanning" | "identifying" | "fetching" | "complete";
  className?: string;
}

const stages = [
  { key: "scanning", label: "Scanning image...", icon: Scan },
  { key: "identifying", label: "Identifying food...", icon: Sparkles },
  { key: "fetching", label: "Fetching nutrition data...", icon: Database },
  { key: "complete", label: "Analysis complete!", icon: CheckCircle },
];

export function LoadingAnalysis({ stage = "scanning", className }: LoadingAnalysisProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      {/* Animated scanner */}
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
        >
          {stage === "complete" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
          ) : (
            <Scan className="w-12 h-12 text-white" />
          )}
        </motion.div>

        {/* Pulse rings */}
        {stage !== "complete" && (
          <>
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-green-400"
            />
            <motion.div
              animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full border-2 border-green-400"
            />
          </>
        )}
      </div>

      {/* Progress steps */}
      <div className="w-full max-w-xs space-y-3">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                isActive && "bg-green-50 border border-green-200",
                isComplete && "bg-gray-50",
                isPending && "opacity-40"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isActive && "bg-green-500 text-white",
                  isComplete && "bg-green-100 text-green-600",
                  isPending && "bg-gray-100 text-gray-400"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-green-700",
                  isComplete && "text-gray-500",
                  isPending && "text-gray-400"
                )}
              >
                {s.label}
              </span>
              {isActive && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="ml-auto w-2 h-2 rounded-full bg-green-500"
                />
              )}
            </motion.div>
          );
        })};
      </div>
    </div>
  );
}

// Simple spinner
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-8 h-8 border-3 border-green-200 border-t-green-500 rounded-full animate-spin",
        className
      )}
    />
  );
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

// Simple loading screen with message
export function Loading({ message = "Analyzing..." }: { message?: string }) {
  return (
    <div className="app-container">
      <div className="main-content flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full mb-6"
        />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
