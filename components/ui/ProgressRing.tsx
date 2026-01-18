"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = "#10B981",
  bgColor = "#F3F4F6",
  children,
  className = "",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

interface NutritionRingProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function NutritionRing({
  current,
  target,
  label,
  unit = "g",
  color = "#10B981",
  size = "md",
}: NutritionRingProps) {
  const progress = target > 0 ? (current / target) * 100 : 0;
  const isOver = current > target;
  
  const sizes = {
    sm: { ring: 60, stroke: 5, text: "text-sm", label: "text-xs" },
    md: { ring: 80, stroke: 6, text: "text-lg", label: "text-xs" },
    lg: { ring: 100, stroke: 8, text: "text-xl", label: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <ProgressRing
        progress={progress}
        size={s.ring}
        strokeWidth={s.stroke}
        color={isOver ? "#EF4444" : color}
      >
        <div className="text-center">
          <span className={`font-semibold text-gray-900 ${s.text}`}>
            {Math.round(current)}
          </span>
        </div>
      </ProgressRing>
      <span className={`mt-2 text-gray-500 font-medium ${s.label}`}>{label}</span>
      <span className="text-xs text-gray-400">
        {Math.round(current)}/{target}{unit}
      </span>
    </div>
  );
}
