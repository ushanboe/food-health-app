'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { staggerItem } from './design-system';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const sizeStyles = {
  sm: { title: 'text-lg', subtitle: 'text-xs', icon: 'text-xl' },
  md: { title: 'text-xl', subtitle: 'text-sm', icon: 'text-2xl' },
  lg: { title: 'text-2xl', subtitle: 'text-base', icon: 'text-3xl' },
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  size = 'md',
  gradient = false,
}) => {
  const sizeStyle = sizeStyles[size];
  
  return (
    <motion.div
      className="flex items-center justify-between mb-4"
      variants={staggerItem}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <motion.span
            className={sizeStyle.icon}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            {icon}
          </motion.span>
        )}
        <div>
          <h2
            className={`${sizeStyle.title} font-bold ${
              gradient
                ? 'bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent'
                : 'text-white'
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`${sizeStyle.subtitle} text-gray-400 mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
};

export default SectionHeader;
