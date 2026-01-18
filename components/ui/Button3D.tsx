'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { hapticMedium, hapticLight } from './haptics';

interface Button3DProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30',
  secondary: 'bg-white/10 backdrop-blur-lg border border-white/20 text-white',
  success: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/30',
  danger: 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/30',
  gold: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 shadow-lg shadow-amber-500/30',
  ghost: 'bg-transparent border border-white/30 text-white hover:bg-white/10',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export const Button3D: React.FC<Button3DProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      hapticMedium();
      onClick();
    }
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : undefined}
      onHoverStart={() => !disabled && !loading && hapticLight()}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <motion.span
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : icon ? (
          <span className="text-xl">{icon}</span>
        ) : null}
        {children}
      </span>
    </motion.button>
  );
};

export default Button3D;
