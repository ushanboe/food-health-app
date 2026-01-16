"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type NutriState = "happy" | "excited" | "waving" | "thinking" | "celebrating" | "running" | "walking" | "dancing";

interface NutriProps {
  state?: NutriState;
  size?: number;
  showSparkles?: boolean;
}

export function Nutri({ state = "happy", size = 120, showSparkles = false }: NutriProps) {
  // Animation variants for different states
  const animations = {
    happy: {
      y: [0, -8, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 3,  // Increased from 2
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    excited: {
      y: [0, -15, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,  // Increased from 0.6
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    waving: {
      rotate: [0, 10, -10, 10, 0],
      transition: {
        duration: 2.5,  // Increased from 1.5
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    thinking: {
      rotate: [0, -5, 5, -5, 0],
      y: [0, -5, 0],
      transition: {
        duration: 4,  // Increased from 3
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    celebrating: {
      rotate: [0, -15, 15, -15, 15, 0],
      y: [0, -20, 0, -10, 0],
      scale: [1, 1.15, 1, 1.1, 1],
      transition: {
        duration: 1.5,  // Increased from 1
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    running: {
      x: [0, 3, -3, 0],
      y: [0, -6, 0],
      rotate: [0, -3, 3, 0],
      transition: {
        duration: 1.2,  // Increased from 0.8
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    walking: {
      x: [0, 2, -2, 0],
      y: [0, -3, 0],
      rotate: [0, -2, 2, 0],
      transition: {
        duration: 2.5,  // Increased from 1.5
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    dancing: {
      rotate: [0, -10, 10, -10, 10, 0],
      y: [0, -8, 0, -8, 0],
      scale: [1, 1.08, 1, 1.08, 1],
      transition: {
        duration: 2,  // Increased from 1.2
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Arm animations for different states
  const armAnimations = {
    running: {
      rotate: [0, -25, 25, 0],
      transition: {
        duration: 1.2,  // Increased from 0.8
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    walking: {
      rotate: [0, -15, 15, 0],
      transition: {
        duration: 2.5,  // Increased from 1.5
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    dancing: {
      rotate: [0, 45, -45, 45, 0],
      y: [0, -5, 5, 0],
      transition: {
        duration: 2,  // Increased from 1.2
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Sparkles effect */}
      {showSparkles && (
        <motion.div
          className="absolute -top-2 -right-2 text-yellow-400"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2.5,  // Increased from 1.5
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles size={size * 0.25} />
        </motion.div>
      )}

      {/* Main avocado body */}
      <motion.div
        className="relative w-full h-full"
        animate={animations[state]}
      >
        {/* Avocado shape */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-[45%] shadow-lg" />
        
        {/* Seed */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] bg-gradient-to-br from-amber-700 to-amber-900 rounded-full shadow-inner" />
        
        {/* Eyes */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex gap-[15%] w-[60%]">
          <motion.div 
            className="w-[30%] aspect-square bg-white rounded-full shadow-sm flex items-center justify-center"
            animate={state === "waving" ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5 }}  // Increased from 1.5
          >
            <div className="w-[45%] h-[45%] bg-gray-900 rounded-full" />
          </motion.div>
          <motion.div 
            className="w-[30%] aspect-square bg-white rounded-full shadow-sm flex items-center justify-center"
            animate={state === "waving" ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5 }}  // Increased from 1.5
          >
            <div className="w-[45%] h-[45%] bg-gray-900 rounded-full" />
          </motion.div>
        </div>
        
        {/* Smile */}
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-b-4 border-gray-800 rounded-b-full" />
        
        {/* Arms - only show for running, walking, dancing */}
        {(state === "running" || state === "walking" || state === "dancing") && (
          <>
            {/* Left arm */}
            <motion.div
              className="absolute top-[45%] left-[8%] w-[15%] h-[8%] bg-gradient-to-br from-green-400 to-green-600 rounded-full origin-right"
              animate={armAnimations[state]}
              style={{ transformOrigin: "right center" }}
            />
            {/* Right arm */}
            <motion.div
              className="absolute top-[45%] right-[8%] w-[15%] h-[8%] bg-gradient-to-br from-green-400 to-green-600 rounded-full origin-left"
              animate={{
                ...armAnimations[state],
                rotate: armAnimations[state].rotate.map((r: number) => -r)
              }}
              style={{ transformOrigin: "left center" }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
