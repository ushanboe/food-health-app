"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
  color?: string;
}

export function ProgressRing({
  current,
  goal,
  size = 160,
  strokeWidth = 12,
  label = "Calories",
  unit = "kcal",
  color,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((current / goal) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const remaining = Math.max(goal - current, 0);
  const isOver = current > goal;

  // Dynamic color based on percentage
  const getColor = () => {
    if (color) return color;
    if (isOver) return "#ef4444"; // red
    if (percentage >= 90) return "#f59e0b"; // amber
    if (percentage >= 70) return "#22c55e"; // green
    return "#3b82f6"; // blue
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: getColor() }}>
          {isOver ? "+" : ""}{Math.abs(remaining).toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">
          {isOver ? "over" : "remaining"}
        </span>
        <span className="text-xs text-gray-400 mt-1">
          {current.toLocaleString()} / {goal.toLocaleString()} {unit}
        </span>
      </div>
    </div>
  );
}

// Mini version for macros
export function MiniProgressRing({
  current,
  goal,
  label,
  unit = "g",
  color = "#3b82f6",
}: {
  current: number;
  goal: number;
  label: string;
  unit?: string;
  color?: string;
}) {
  const percentage = Math.min((current / goal) * 100, 100);
  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold">{Math.round(current)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
      <span className="text-xs text-gray-400">{goal}{unit}</span>
    </div>
  );
}
