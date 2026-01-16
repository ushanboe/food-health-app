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
  // Animation variants for different states (SLOWER TIMINGS)
  const animations = {
    happy: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 3,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    excited: {
      y: [0, -15, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    waving: {
      rotate: [0, 10, -10, 10, 0],
      transition: {
        duration: 2.5,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    thinking: {
      rotate: [0, -5, 5, -5, 0],
      y: [0, -5, 0],
      transition: {
        duration: 4,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    celebrating: {
      rotate: [0, -15, 15, -15, 15, 0],
      y: [0, -20, 0, -10, 0],
      scale: [1, 1.15, 1, 1.1, 1],
      transition: {
        duration: 1.5,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    running: {
      x: [0, 3, -3, 0],
      y: [0, -6, 0],
      rotate: [0, -3, 3, 0],
      transition: {
        duration: 1.2,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    walking: {
      x: [0, 2, -2, 0],
      y: [0, -3, 0],
      rotate: [0, -2, 2, 0],
      transition: {
        duration: 2.5,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    dancing: {
      rotate: [0, -10, 10, -10, 10, 0],
      y: [0, -8, 0, -8, 0],
      scale: [1, 1.08, 1, 1.08, 1],
      transition: {
        duration: 2,  // Slower
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Arm animations for active states
  const getArmAnimation = () => {
    if (state === "running") {
      return {
        rotate: [0, -25, 25, 0],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "walking") {
      return {
        rotate: [0, -15, 15, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "dancing") {
      return {
        rotate: [0, 45, -45, 45, 0],
        y: [0, -5, 5, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    return {};
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
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles size={size * 0.25} />
        </motion.div>
      )}

      {/* Main Nutri animation container */}
      <motion.div
        className="relative w-full h-full"
        animate={animations[state]}
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
          
          {/* Eyes */}
          <g>
            <circle cx="80" cy="85" r="8" fill="#065f46" />
            <circle cx="120" cy="85" r="8" fill="#065f46" />
            {/* Eye shine */}
            <circle cx="83" cy="82" r="3" fill="white" />
            <circle cx="123" cy="82" r="3" fill="white" />
          </g>
          
          {/* Mouth - varies by state */}
          {state === "celebrating" || state === "excited" || state === "dancing" ? (
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
          
          {/* Arms - animated for active states */}
          {(state === "waving" || state === "celebrating" || state === "running" || state === "walking" || state === "dancing") ? (
            <>
              {/* Left arm up/moving */}
              <motion.path
                d="M 40 100 Q 20 80 25 60"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                animate={getArmAnimation()}
                style={{ transformOrigin: "40px 100px" }}
              />
              {/* Right arm up/moving */}
              <motion.path
                d="M 160 100 Q 180 80 175 60"
                stroke="#65a30d"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                animate={{
                  ...getArmAnimation(),
                  rotate: getArmAnimation().rotate?.map((r: number) => -r)
                }}
                style={{ transformOrigin: "160px 100px" }}
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
    </div>
  );
}
