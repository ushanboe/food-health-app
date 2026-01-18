'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card3D } from './Card3D';
import { staggerItem } from './design-system';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'purple' | 'green' | 'blue' | 'gold' | 'pink' | 'orange';
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const colorStyles = {
  purple: {
    icon: 'from-purple-500 to-pink-500',
    glow: 'rgba(168, 85, 247, 0.4)',
    text: 'text-purple-400',
  },
  green: {
    icon: 'from-emerald-500 to-green-400',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
  },
  blue: {
    icon: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59, 130, 246, 0.4)',
    text: 'text-blue-400',
  },
  gold: {
    icon: 'from-amber-500 to-yellow-400',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-400',
  },
  pink: {
    icon: 'from-pink-500 to-rose-400',
    glow: 'rgba(236, 72, 153, 0.4)',
    text: 'text-pink-400',
  },
  orange: {
    icon: 'from-orange-500 to-amber-400',
    glow: 'rgba(249, 115, 22, 0.4)',
    text: 'text-orange-400',
  },
};

const sizeStyles = {
  sm: { padding: 'p-3', icon: 'text-2xl w-10 h-10', value: 'text-xl', label: 'text-xs' },
  md: { padding: 'p-4', icon: 'text-3xl w-12 h-12', value: 'text-2xl', label: 'text-sm' },
  lg: { padding: 'p-5', icon: 'text-4xl w-14 h-14', value: 'text-3xl', label: 'text-base' },
};

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  color = 'purple',
  onClick,
  size = 'md',
}) => {
  const colorStyle = colorStyles[color];
  const sizeStyle = sizeStyles[size];
  
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <motion.div variants={staggerItem}>
      <Card3D
        variant="glass"
        glowColor={colorStyle.glow}
        onClick={onClick}
        noPadding
      >
        <div className={sizeStyle.padding}>
          <div className="flex items-start justify-between">
            {/* Icon */}
            <div className={`${sizeStyle.icon} rounded-xl bg-gradient-to-br ${colorStyle.icon} flex items-center justify-center shadow-lg`}>
              <span>{icon}</span>
            </div>
            
            {/* Trend indicator */}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 ${trendColor} text-sm font-medium`}>
                <span>{trendIcon}</span>
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          
          {/* Value */}
          <div className="mt-3">
            <motion.div
              className={`${sizeStyle.value} font-bold text-white`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {value}
            </motion.div>
            
            {subValue && (
              <div className={`${colorStyle.text} text-sm mt-0.5`}>
                {subValue}
              </div>
            )}
            
            <div className={`${sizeStyle.label} text-gray-400 mt-1 uppercase tracking-wide`}>
              {label}
            </div>
          </div>
        </div>
      </Card3D>
    </motion.div>
  );
};

export default StatCard;
