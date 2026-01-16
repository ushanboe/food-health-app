"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type NutriState = "happy" | "celebrating" | "thinking" | "sleeping" | "waving";

interface NutriProps {
  state?: NutriState;
  message?: string;
  size?: number;
  showSparkles?: boolean;
}

export function Nutri({ 
  state = "happy", 
  message,
  size = 120,
  showSparkles = false
}: NutriProps) {
  
  // Animation variants for different states
  const animations = {
    happy: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    celebrating: {
      y: [0, -20, 0],
      rotate: [0, 10, -10, 10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    thinking: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    sleeping: {
      y: [0, 5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    waving: {
      rotate: [0, 15, -15, 15, 0],
      transition: {
        duration: 1,
        repeat: 3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Sparkles decoration */}
      {showSparkles && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-4 -left-4" />
          <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 right-0" />
          <Sparkles className="w-7 h-7 text-yellow-400 absolute bottom-0 -right-4" />
        </motion.div>
      )}

      {/* Nutri the Avocado */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, ...animations[state] }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Avocado body */}
          <ellipse
            cx="100"
            cy="110"
            rx="70"
            ry="85"
            fill="#84cc16"
            className="drop-shadow-md"
          />
          
          {/* Avocado pit (belly) */}
          <circle
            cx="100"
            cy="115"
            r="35"
            fill="#fbbf24"
          />
          
          {/* Cute face */}
          {/* Eyes */}
          <g>
            {state === "sleeping" ? (
              // Sleeping eyes (closed)
              <>
                <path d="M 75 85 Q 80 90 85 85" stroke="#065f46" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 115 85 Q 120 90 125 85" stroke="#065f46" strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            ) : (
              // Open eyes
              <>
                <circle cx="80" cy="85" r="8" fill="#065f46" />
                <circle cx="120" cy="85" r="8" fill="#065f46" />
                {/* Eye shine */}
                <circle cx="83" cy="82" r="3" fill="white" />
                <circle cx="123" cy="82" r="3" fill="white" />
              </>
            )}
          </g>
          
          {/* Mouth */}
          {state === "celebrating" ? (
            // Big happy smile
            <path
              d="M 75 105 Q 100 125 125 105"
              stroke="#065f46"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : state === "thinking" ? (
            // Thoughtful expression
            <path
              d="M 85 105 L 115 105"
              stroke="#065f46"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            // Normal smile
            <path
              d="M 80 105 Q 100 115 120 105"
              stroke="#065f46"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}
          
          {/* Rosy cheeks */}
          <circle cx="60" cy="100" r="8" fill="#fca5a5" opacity="0.6" />
          <circle cx="140" cy="100" r="8" fill="#fca5a5" opacity="0.6" />
          
          {/* Arms */}
          {state === "waving" || state === "celebrating" ? (
            <>
              {/* Left arm up */}
              <motion.path
                d="M 40 100 Q 20 80 25 60"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                animate={{ rotate: state === "waving" ? [0, 20, -20, 0] : 0 }}
                transition={{ duration: 0.5, repeat: state === "waving" ? Infinity : 0 }}
              />
              {/* Right arm up */}
              <motion.path
                d="M 160 100 Q 180 80 175 60"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                animate={{ rotate: state === "waving" ? [0, -20, 20, 0] : 0 }}
                transition={{ duration: 0.5, repeat: state === "waving" ? Infinity : 0 }}
              />
            </>
          ) : (
            <>
              {/* Left arm down */}
              <path
                d="M 40 120 Q 20 130 25 145"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Right arm down */}
              <path
                d="M 160 120 Q 180 130 175 145"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
        </svg>
      </motion.div>

      {/* Speech bubble with message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative bg-white rounded-2xl px-5 py-3 shadow-lg max-w-xs"
        >
          {/* Speech bubble pointer */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
          
          <p className="text-sm text-gray-700 text-center relative z-10">
            {message}
          </p>
        </motion.div>
      )}
    </div>
  );
}
