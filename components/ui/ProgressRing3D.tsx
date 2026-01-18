'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRing3DProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'purple' | 'green' | 'blue' | 'gold' | 'pink' | 'orange';
  showPercentage?: boolean;
  icon?: string;
  label?: string;
  value?: string;
  animate?: boolean;
}

const colorStyles = {
  purple: { stroke: 'url(#purpleGradient)', glow: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' },
  green: { stroke: 'url(#greenGradient)', glow: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' },
  blue: { stroke: 'url(#blueGradient)', glow: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' },
  gold: { stroke: 'url(#goldGradient)', glow: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))' },
  pink: { stroke: 'url(#pinkGradient)', glow: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))' },
  orange: { stroke: 'url(#orangeGradient)', glow: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.5))' },
};

export const ProgressRing3D: React.FC<ProgressRing3DProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'purple',
  showPercentage = true,
  icon,
  label,
  value,
  animate = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const colorStyle = colorStyles[color];
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: colorStyle.glow }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorStyle.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && (
          <motion.span
            className="text-2xl mb-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            {icon}
          </motion.span>
        )}
        {value ? (
          <motion.span
            className="text-xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {value}
          </motion.span>
        ) : showPercentage ? (
          <motion.span
            className="text-xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(progress)}%
          </motion.span>
        ) : null}
        {label && (
          <span className="text-xs text-gray-400 mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing3D;
