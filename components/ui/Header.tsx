'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { hapticLight } from './haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  transparent = true,
}) => {
  const router = useRouter();
  
  const handleBack = () => {
    hapticLight();
    router.back();
  };
  
  return (
    <motion.header
      className={`sticky top-0 z-40 px-4 py-4 ${
        transparent
          ? 'bg-transparent'
          : 'bg-gray-950/80 backdrop-blur-xl border-b border-white/5'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Left side - Back button or spacer */}
        <div className="w-10">
          {showBack && (
            <motion.button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ←
            </motion.button>
          )}
        </div>
        
        {/* Center - Title */}
        <div className="text-center flex-1">
          <motion.h1
            className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              className="text-xs text-gray-400 mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        
        {/* Right side - Action or spacer */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
