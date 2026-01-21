"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { CyclePhase } from "@/lib/cycle-store";

interface CycleRingData {
  enabled: boolean;
  phase: CyclePhase | null;
  cycleDay: number | null;
  phaseColor: string;
  phaseLabel: string;
}

interface UnifiedProgressRingProps {
  // Nutrition data
  calories: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  
  // Fitness data
  exerciseCalories: number;
  exerciseGoal?: number;
  exerciseMinutes: number;
  
  // Water data
  waterMl: number;
  waterGoal: number;
  
  // Cycle data (optional)
  cycleData?: CycleRingData;
  
  size?: number;
  className?: string;
}

export function UnifiedProgressRing({
  calories,
  targetCalories,
  protein,
  carbs,
  fat,
  exerciseCalories,
  exerciseGoal = 300,
  exerciseMinutes,
  waterMl,
  waterGoal,
  cycleData,
  size = 280,
  className = "",
}: UnifiedProgressRingProps) {
  const fishControls = useAnimation();
  
  // Calculate percentages
  const nutritionPercent = Math.min((calories / targetCalories) * 100, 100);
  const fitnessPercent = Math.min((exerciseCalories / exerciseGoal) * 100, 100);
  const waterPercent = Math.min((waterMl / waterGoal) * 100, 100);
  
  // Adjust size if cycle ring is shown
  const showCycleRing = cycleData?.enabled && cycleData?.phase;
  const effectiveSize = showCycleRing ? size + 24 : size;
  
  // Ring dimensions - adjusted for cycle ring
  const center = effectiveSize / 2;
  const cycleRadius = showCycleRing ? (effectiveSize - 8) / 2 : 0; // Outermost cycle ring
  const outerRadius = showCycleRing ? cycleRadius - 14 : (effectiveSize - 20) / 2; // Nutrition ring
  const middleRadius = outerRadius - 18; // Fitness ring
  const innerRadius = middleRadius - 18; // Water container
  const waterRadius = innerRadius - 4; // Actual water area
  
  const cycleCircumference = 2 * Math.PI * cycleRadius;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  
  // Fish mood based on water level
  const fishMood = waterPercent < 30 ? 'struggling' : waterPercent < 70 ? 'swimming' : 'happy';
  
  // Animate fish based on water level
  useEffect(() => {
    if (fishMood === 'struggling') {
      // Flopping animation - fish out of water
      fishControls.start({
        rotate: [0, -30, 30, -20, 20, 0],
        y: [0, -5, 5, -3, 3, 0],
        scaleY: [1, 0.8, 1, 0.9, 1],
        transition: {
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 0.3,
        },
      });
    } else if (fishMood === 'swimming') {
      // Gentle swimming
      fishControls.start({
        x: [-10, 10, -10],
        y: [0, -3, 0],
        rotate: [0, 5, 0, -5, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    } else {
      // Happy swimming with more movement
      fishControls.start({
        x: [-15, 15, -15],
        y: [-5, 5, -5],
        rotate: [0, 10, 0, -10, 0],
        scale: [1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    }
  }, [fishMood, fishControls]);
  
  // Water wave path
  const waterLevel = waterRadius * 2 * (1 - waterPercent / 100);
  
  return (
    <div className={`relative ${className}`} style={{ width: effectiveSize, height: effectiveSize }}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        viewBox={`0 0 ${effectiveSize} ${effectiveSize}`}
        className="transform -rotate-90"
      >
        {/* Definitions for gradients and clips */}
        <defs>
          {/* Water gradient */}
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
          </linearGradient>
          
          {/* Clip path for water */}
          <clipPath id="waterClip">
            <circle cx={center} cy={center} r={waterRadius} />
          </clipPath>
          
          {/* Nutrition gradient */}
          <linearGradient id="nutritionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          
          {/* Fitness gradient */}
          <linearGradient id="fitnessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
          
          {/* Cycle phase gradient - dynamic based on phase */}
          {showCycleRing && (
            <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={cycleData.phaseColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={cycleData.phaseColor} stopOpacity="0.6" />
            </linearGradient>
          )}
        </defs>
        
        {/* OUTERMOST RING - Cycle Tracking (only if enabled) */}
        {showCycleRing && (
          <>
            {/* Background */}
            <circle
              cx={center}
              cy={center}
              r={cycleRadius}
              fill="none"
              stroke="#f3e8ff"
              strokeWidth="8"
              opacity="0.5"
            />
            {/* Full colored ring showing current phase */}
            <motion.circle
              cx={center}
              cy={center}
              r={cycleRadius}
              fill="none"
              stroke="url(#cycleGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          </>
        )}
        
        {/* OUTER RING - Nutrition */}
        {/* Background */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="url(#nutritionGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          initial={{ strokeDashoffset: outerCircumference }}
          animate={{ strokeDashoffset: outerCircumference - (nutritionPercent / 100) * outerCircumference }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* MIDDLE RING - Fitness */}
        {/* Background */}
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="url(#fitnessGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={middleCircumference}
          initial={{ strokeDashoffset: middleCircumference }}
          animate={{ strokeDashoffset: middleCircumference - (fitnessPercent / 100) * middleCircumference }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
        
        {/* INNER CIRCLE - Water Container */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#f0f9ff"
          stroke="#bae6fd"
          strokeWidth="2"
        />
        
        {/* Water Fill */}
        <g clipPath="url(#waterClip)" transform={`rotate(90 ${center} ${center})`}>
          {/* Water body */}
          <motion.rect
            x={center - waterRadius}
            y={center - waterRadius + waterLevel}
            width={waterRadius * 2}
            height={waterRadius * 2}
            fill="url(#waterGradient)"
            initial={{ y: center + waterRadius }}
            animate={{ y: center - waterRadius + waterLevel }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          />
          
          {/* Wave effect */}
          <motion.path
            d={`M ${center - waterRadius} ${center - waterRadius + waterLevel}
                Q ${center - waterRadius/2} ${center - waterRadius + waterLevel - 8},
                  ${center} ${center - waterRadius + waterLevel}
                Q ${center + waterRadius/2} ${center - waterRadius + waterLevel + 8},
                  ${center + waterRadius} ${center - waterRadius + waterLevel}
                L ${center + waterRadius} ${center + waterRadius}
                L ${center - waterRadius} ${center + waterRadius} Z`}
            fill="url(#waterGradient)"
            initial={{ y: waterRadius * 2 }}
            animate={{
              y: 0,
              d: [
                `M ${center - waterRadius} ${center - waterRadius + waterLevel}
                  Q ${center - waterRadius/2} ${center - waterRadius + waterLevel - 6},
                    ${center} ${center - waterRadius + waterLevel}
                  Q ${center + waterRadius/2} ${center - waterRadius + waterLevel + 6},
                    ${center + waterRadius} ${center - waterRadius + waterLevel}
                  L ${center + waterRadius} ${center + waterRadius}
                  L ${center - waterRadius} ${center + waterRadius} Z`,
                `M ${center - waterRadius} ${center - waterRadius + waterLevel}
                  Q ${center - waterRadius/2} ${center - waterRadius + waterLevel + 6},
                    ${center} ${center - waterRadius + waterLevel}
                  Q ${center + waterRadius/2} ${center - waterRadius + waterLevel - 6},
                    ${center + waterRadius} ${center - waterRadius + waterLevel}
                  L ${center + waterRadius} ${center + waterRadius}
                  L ${center - waterRadius} ${center + waterRadius} Z`,
              ]
            }}
            transition={{
              y: { duration: 1, ease: "easeOut", delay: 0.4 },
              d: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Bubbles when water is high */}
          {waterPercent > 50 && (
            <>
              <motion.circle
                cx={center - 15}
                cy={center + 20}
                r="3"
                fill="rgba(255,255,255,0.6)"
                animate={{
                  cy: [center + 20, center - waterRadius + waterLevel + 10],
                  opacity: [0.6, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              />
              <motion.circle
                cx={center + 10}
                cy={center + 30}
                r="2"
                fill="rgba(255,255,255,0.5)"
                animate={{
                  cy: [center + 30, center - waterRadius + waterLevel + 10],
                  opacity: [0.5, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.circle
                cx={center + 20}
                cy={center + 15}
                r="2.5"
                fill="rgba(255,255,255,0.5)"
                animate={{
                  cy: [center + 15, center - waterRadius + waterLevel + 10],
                  opacity: [0.5, 0],
                }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
              />
            </>
          )}
        </g>
      </svg>
      
      {/* Goldfish - positioned in center, rotated back to normal */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          animate={fishControls}
          className="relative"
          style={{
            marginTop: waterPercent < 30 ? '20px' : '10px',
          }}
        >
          {/* Fish SVG */}
          <svg
            width="50"
            height="35"
            viewBox="0 0 50 35"
            className={fishMood === 'struggling' ? 'opacity-90' : 'opacity-100'}
          >
            {/* Fish body */}
            <ellipse
              cx="22"
              cy="17"
              rx="16"
              ry="12"
              fill={fishMood === 'struggling' ? '#fca5a5' : '#fb923c'}
            />
            {/* Fish tail */}
            <path
              d="M 38 17 L 48 8 L 48 26 Z"
              fill={fishMood === 'struggling' ? '#f87171' : '#f97316'}
            />
            {/* Dorsal fin */}
            <path
              d="M 18 5 Q 22 8, 26 5 L 22 12 Z"
              fill={fishMood === 'struggling' ? '#f87171' : '#f97316'}
            />
            {/* Eye */}
            <circle cx="12" cy="14" r="4" fill="white" />
            <circle cx="11" cy="14" r="2" fill="#1f2937" />
            {/* Mouth */}
            {fishMood === 'struggling' ? (
              // Gasping mouth
              <motion.ellipse
                cx="5"
                cy="18"
                rx="3"
                ry="4"
                fill="#7f1d1d"
                animate={{ ry: [4, 2, 4] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            ) : (
              // Happy/normal mouth
              <path
                d="M 4 17 Q 6 20, 8 17"
                stroke="#7c2d12"
                strokeWidth="1.5"
                fill="none"
              />
            )}
            {/* Gill */}
            <path
              d="M 16 13 Q 14 17, 16 21"
              stroke={fishMood === 'struggling' ? '#dc2626' : '#ea580c'}
              strokeWidth="1"
              fill="none"
            />
            {/* Scales pattern */}
            <path
              d="M 20 12 Q 22 14, 20 16 M 26 10 Q 28 14, 26 18 M 32 12 Q 34 15, 32 18"
              stroke={fishMood === 'struggling' ? '#fecaca' : '#fed7aa'}
              strokeWidth="0.5"
              fill="none"
              opacity="0.6"
            />
          </svg>
          
          {/* Distress indicators when struggling */}
          {fishMood === 'struggling' && (
            <>
              <motion.span
                className="absolute -top-2 -right-1 text-xs"
                animate={{ opacity: [1, 0, 1], y: [-2, -5, -2] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                💦
              </motion.span>
              <motion.span
                className="absolute -top-1 left-0 text-xs"
                animate={{ opacity: [0, 1, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
              >
                😵
              </motion.span>
            </>
          )}
          
          {/* Happy indicators */}
          {fishMood === 'happy' && (
            <motion.span
              className="absolute -top-3 right-0 text-sm"
              animate={{
                opacity: [0, 1, 0],
                y: [0, -8, -16],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.span>
          )}
        </motion.div>
      </div>
      
      {/* Stats overlay - positioned around the ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center" style={{ marginTop: `${effectiveSize * 0.35}px` }}>
          <p className="text-[10px] text-cyan-600 font-medium">
            {waterMl} / {waterGoal} ml
          </p>
        </div>
      </div>
    </div>
  );
}

// Legend component to show what each ring means
export function UnifiedProgressLegend({
  calories,
  targetCalories,
  exerciseCalories,
  exerciseGoal = 300,
  exerciseMinutes,
  waterMl,
  waterGoal,
  protein,
  carbs,
  fat,
  cycleData,
}: {
  calories: number;
  targetCalories: number;
  exerciseCalories: number;
  exerciseGoal?: number;
  exerciseMinutes: number;
  waterMl: number;
  waterGoal: number;
  protein: number;
  carbs: number;
  fat: number;
  cycleData?: CycleRingData;
}) {
  const showCycle = cycleData?.enabled && cycleData?.phase;
  
  return (
    <div className={`grid gap-2 mt-4 ${showCycle ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {/* Cycle (if enabled) */}
      {showCycle && (
        <div className="text-center p-2 rounded-xl" style={{ backgroundColor: `${cycleData.phaseColor}15` }}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: cycleData.phaseColor }}
            />
            <span className="text-[10px] font-medium" style={{ color: cycleData.phaseColor }}>Cycle</span>
          </div>
          <p className="text-sm font-bold" style={{ color: cycleData.phaseColor }}>
            Day {cycleData.cycleDay}
          </p>
          <p className="text-[9px]" style={{ color: cycleData.phaseColor }}>
            {cycleData.phaseLabel}
          </p>
        </div>
      )}
      
      {/* Nutrition */}
      <div className="text-center p-2 rounded-xl bg-emerald-50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
          <span className="text-[10px] text-emerald-700 font-medium">Nutrition</span>
        </div>
        <p className="text-sm font-bold text-emerald-700">{calories}</p>
        <p className="text-[9px] text-emerald-600">/ {targetCalories} cal</p>
        <div className="flex justify-center gap-1 mt-1">
          <span className="text-[8px] text-blue-600">P:{protein}g</span>
          <span className="text-[8px] text-amber-600">C:{carbs}g</span>
          <span className="text-[8px] text-red-500">F:{fat}g</span>
        </div>
      </div>
      
      {/* Fitness */}
      <div className="text-center p-2 rounded-xl bg-orange-50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-300" />
          <span className="text-[10px] text-orange-700 font-medium">Fitness</span>
        </div>
        <p className="text-sm font-bold text-orange-700">{exerciseCalories}</p>
        <p className="text-[9px] text-orange-600">/ {exerciseGoal} cal</p>
        <p className="text-[9px] text-orange-500 mt-1">{exerciseMinutes} min</p>
      </div>
      
      {/* Hydration */}
      <div className="text-center p-2 rounded-xl bg-cyan-50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" />
          <span className="text-[10px] text-cyan-700 font-medium">Hydration</span>
        </div>
        <p className="text-sm font-bold text-cyan-700">{waterMl}</p>
        <p className="text-[9px] text-cyan-600">/ {waterGoal} ml</p>
        <p className="text-[9px] text-cyan-500 mt-1">
          {Math.round((waterMl / waterGoal) * 100)}%
        </p>
      </div>
    </div>
  );
}
