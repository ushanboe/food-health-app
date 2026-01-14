"use client";

import { motion } from "framer-motion";
import { cn, getHealthScoreColor, getHealthScoreLabel } from "@/lib/utils";
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function HealthScore({ score, size = "md", showLabel = true, className }: HealthScoreProps) {
  const colorClass = getHealthScoreColor(score);
  const label = getHealthScoreLabel(score);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = size === "sm" ? 28 : size === "md" ? 42 : 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTrendIcon = () => {
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    if (score >= 40) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke={`var(--health-${colorClass})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              "--health-excellent": "#22c55e",
              "--health-good": "#84cc16",
              "--health-moderate": "#eab308",
              "--health-poor": "#f97316",
              "--health-bad": "#ef4444",
            } as React.CSSProperties}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className={cn("font-bold", textSizes[size], `health-${colorClass}`)}
          >
            {score}
          </motion.span>
          {size !== "sm" && (
            <span className="text-xs text-gray-500">/ 100</span>
          )}
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn(
            "mt-3 px-4 py-1.5 rounded-full flex items-center gap-1.5 text-white font-medium text-sm",
            `health-bg-${colorClass}`
          )}
        >
          {getTrendIcon()}
          {label}
        </motion.div>
      )}
    </div>
  );
}

// Compact inline health score
export function HealthScoreBadge({ score, className }: { score: number; className?: string }) {
  const colorClass = getHealthScoreColor(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-sm font-medium",
        `health-bg-${colorClass}`,
        className
      )}
    >
      <Heart className="w-3.5 h-3.5" />
      <span>{score}</span>
    </div>
  );
}
