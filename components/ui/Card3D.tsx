'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { hapticLight } from './haptics';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'glass' | 'solid' | 'gradient' | 'luxury';
  noPadding?: boolean;
}

const intensityConfig = {
  subtle: { rotate: 5, scale: 1.02, shadow: 20 },
  medium: { rotate: 10, scale: 1.03, shadow: 30 },
  strong: { rotate: 15, scale: 1.05, shadow: 40 },
};

const variantStyles = {
  glass: 'bg-white/10 backdrop-blur-xl border border-white/20',
  solid: 'bg-gray-900/90 border border-gray-700/50',
  gradient: 'bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/40 backdrop-blur-xl border border-purple-500/20',
  luxury: 'bg-gradient-to-br from-gray-900/95 via-purple-950/50 to-gray-900/95 backdrop-blur-xl border border-amber-500/20',
};

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glowColor = 'rgba(168, 85, 247, 0.4)',
  intensity = 'medium',
  onClick,
  disabled = false,
  variant = 'glass',
  noPadding = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const config = intensityConfig[intensity];
  
  // Motion values for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring animation
  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [config.rotate, -config.rotate]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-config.rotate, config.rotate]), springConfig);
  const scale = useSpring(isHovered ? config.scale : 1, springConfig);
  
  // Glow position
  const glowX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), springConfig);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    
    x.set(normalizedX * 0.5);
    y.set(normalizedY * 0.5);
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current || !e.touches[0]) return;
    
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const normalizedX = (touch.clientX - centerX) / (rect.width / 2);
    const normalizedY = (touch.clientY - centerY) / (rect.height / 2);
    
    x.set(normalizedX * 0.5);
    y.set(normalizedY * 0.5);
  };
  
  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
      hapticLight();
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };
  
  const handleClick = () => {
    if (!disabled && onClick) {
      hapticLight();
      onClick();
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl ${variantStyles[variant]} ${noPadding ? '' : 'p-5'} ${onClick && !disabled ? 'cursor-pointer' : ''} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      onClick={handleClick}
      whileTap={onClick && !disabled ? { scale: 0.98 } : undefined}
    >
      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}, transparent 60%)`,
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
          opacity: isHovered ? 1 : 0,
        }}
        animate={isHovered ? { backgroundPosition: ['200% 0', '-200% 0'] } : {}}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      
      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card3D;
