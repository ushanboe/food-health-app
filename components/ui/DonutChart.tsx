"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 12,
  centerContent,
  showLegend = true,
  animated = true,
  className = "",
}: DonutChartProps) {
  const total = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.value, 0),
    [segments]
  );

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate segment positions
  const segmentData = useMemo(() => {
    let currentOffset = 0;
    return segments.map((segment) => {
      const percentage = total > 0 ? segment.value / total : 0;
      const dashLength = percentage * circumference;
      const dashOffset = circumference - currentOffset;
      currentOffset += dashLength;
      return {
        ...segment,
        percentage,
        dashLength,
        dashOffset,
      };
    });
  }, [segments, total, circumference]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segmentData.map((segment, index) => (
            <motion.circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segment.dashLength} ${circumference}`}
              strokeDashoffset={segment.dashOffset}
              initial={animated ? { strokeDasharray: `0 ${circumference}` } : undefined}
              animate={{ strokeDasharray: `${segment.dashLength} ${circumference}` }}
              transition={{
                duration: 1,
                delay: index * 0.15,
                ease: "easeOut",
              }}
            />
          ))}
        </svg>

        {/* Center content */}
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-1.5">
          {segmentData.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-gray-600">
                {segment.label}
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {Math.round(segment.percentage * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Specialized Macro Donut Chart
interface MacroDonutProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  targetCalories: number;
  size?: number;
  className?: string;
}

export function MacroDonut({
  protein,
  carbs,
  fat,
  calories,
  targetCalories,
  size = 140,
  className = "",
}: MacroDonutProps) {
  const segments: DonutSegment[] = [
    { value: protein * 4, color: "#3B82F6", label: `Pro ${protein}g` },
    { value: carbs * 4, color: "#F59E0B", label: `Carb ${carbs}g` },
    { value: fat * 9, color: "#EF4444", label: `Fat ${fat}g` },
  ];

  const progress = targetCalories > 0 ? Math.min((calories / targetCalories) * 100, 100) : 0;

  return (
    <DonutChart
      segments={segments}
      size={size}
      strokeWidth={14}
      className={className}
      centerContent={
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{calories}</p>
          <p className="text-[10px] text-gray-500">/ {targetCalories} cal</p>
          <p className="text-[10px] font-medium text-emerald-600">{Math.round(progress)}%</p>
        </div>
      }
    />
  );
}

// Fitness Activity Donut Chart
interface FitnessDonutProps {
  activities: Array<{
    name: string;
    calories: number;
    duration: number;
    color?: string;
  }>;
  totalCalories: number;
  totalDuration: number;
  size?: number;
  className?: string;
}

const activityColors = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
];

export function FitnessDonut({
  activities,
  totalCalories,
  totalDuration,
  size = 140,
  className = "",
}: FitnessDonutProps) {
  const segments: DonutSegment[] = activities.map((activity, index) => ({
    value: activity.calories,
    color: activity.color || activityColors[index % activityColors.length],
    label: activity.name,
  }));

  // If no activities, show empty state
  if (activities.length === 0) {
    return (
      <DonutChart
        segments={[{ value: 1, color: "#e5e7eb", label: "No activity" }]}
        size={size}
        strokeWidth={14}
        showLegend={false}
        className={className}
        centerContent={
          <div className="text-center">
            <p className="text-lg font-bold text-gray-400">0</p>
            <p className="text-[10px] text-gray-400">calories</p>
          </div>
        }
      />
    );
  }

  return (
    <DonutChart
      segments={segments}
      size={size}
      strokeWidth={14}
      className={className}
      centerContent={
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{totalCalories}</p>
          <p className="text-[10px] text-gray-500">cal burned</p>
          <p className="text-[10px] font-medium text-emerald-600">{totalDuration} min</p>
        </div>
      }
    />
  );
}
