'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from './design-system';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  showFloatingOrbs?: boolean;
  variant?: 'default' | 'purple' | 'dark' | 'sunset';
}

const backgroundVariants = {
  default: 'from-gray-950 via-purple-950/50 to-gray-950',
  purple: 'from-purple-950 via-indigo-950 to-gray-950',
  dark: 'from-gray-950 via-gray-900 to-gray-950',
  sunset: 'from-purple-950 via-rose-950/50 to-gray-950',
};

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = '',
  showFloatingOrbs = true,
  variant = 'default',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundVariants[variant]} relative overflow-hidden`}>
      {/* Animated floating orbs */}
      {showFloatingOrbs && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Large purple orb */}
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
            animate={{
              x: [0, 100, 50, 0],
              y: [0, 50, 100, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ top: '-10%', left: '-10%' }}
          />
          
          {/* Pink orb */}
          <motion.div
            className="absolute w-80 h-80 rounded-full bg-pink-600/15 blur-3xl"
            animate={{
              x: [0, -80, -40, 0],
              y: [0, 80, 40, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ top: '30%', right: '-5%' }}
          />
          
          {/* Blue orb */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-blue-600/10 blur-3xl"
            animate={{
              x: [0, 60, 30, 0],
              y: [0, -60, -30, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ bottom: '10%', left: '20%' }}
          />
          
          {/* Gold accent orb */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-amber-500/10 blur-3xl"
            animate={{
              x: [0, -40, 20, 0],
              y: [0, 40, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ top: '50%', right: '30%' }}
          />
        </div>
      )}
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Content */}
      <motion.div
        className={`relative z-10 ${className}`}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageWrapper;
