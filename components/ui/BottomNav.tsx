'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticMedium, hapticLight } from './haptics';

interface NavItem {
  icon: string;
  activeIcon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', activeIcon: '🏠', label: 'Home', path: '/' },
  { icon: '📔', activeIcon: '📔', label: 'Diary', path: '/diary' },
  { icon: '📸', activeIcon: '📸', label: 'Scan', path: '/camera' },
  { icon: '💪', activeIcon: '💪', label: 'Fitness', path: '/fitness' },
  { icon: '👤', activeIcon: '👤', label: 'Profile', path: '/profile' },
];

export const BottomNavV2: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleNavClick = (path: string) => {
    hapticMedium();
    router.push(path);
  };
  
  // Don't show on camera page
  if (pathname === '/camera') return null;
  
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="mx-auto max-w-md">
        <motion.div
          className="relative flex items-center justify-around rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-white/10 px-2 py-2 shadow-2xl shadow-purple-900/20"
          style={{
            boxShadow: '0 -10px 40px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Animated background pill */}
          <AnimatePresence>
            {navItems.map((item, index) => {
              const isActive = pathname === item.path || 
                (item.path !== '/' && pathname.startsWith(item.path));
              
              if (!isActive) return null;
              
              return (
                <motion.div
                  key={item.path}
                  className="absolute h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600"
                  layoutId="navPill"
                  style={{
                    width: `${100 / navItems.length - 4}%`,
                    left: `${(index * 100) / navItems.length + 2}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              );
            })}
          </AnimatePresence>
          
          {/* Nav items */}
          {navItems.map((item) => {
            const isActive = pathname === item.path || 
              (item.path !== '/' && pathname.startsWith(item.path));
            
            return (
              <motion.button
                key={item.path}
                className="relative z-10 flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
                onClick={() => handleNavClick(item.path)}
                onHoverStart={() => hapticLight()}
                whileTap={{ scale: 0.9 }}
              >
                <motion.span
                  className="text-2xl mb-0.5"
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </motion.span>
                <motion.span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </motion.span>
                
                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default BottomNavV2;
