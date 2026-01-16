"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nutri } from "./Nutri";

type FloatingNutriState = "running" | "walking" | "dancing";

interface FloatingNutriProps {
  /** How often Nutri appears (in seconds) */
  interval?: number;
  /** How long Nutri stays visible (in seconds) */
  duration?: number;
  /** Position on screen */
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
}

export function FloatingNutri({
  interval = 15,
  duration = 5,
  position = "bottom-right"
}: FloatingNutriProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentState, setCurrentState] = useState<FloatingNutriState>("walking");

  const states: FloatingNutriState[] = ["running", "walking", "dancing"];

  useEffect(() => {
    // Random initial delay (0-5 seconds)
    const initialDelay = Math.random() * 5000;

    const showNutri = () => {
      // Pick a random animation state
      const randomState = states[Math.floor(Math.random() * states.length)];
      setCurrentState(randomState);
      setIsVisible(true);

      // Hide after duration
      setTimeout(() => {
        setIsVisible(false);
      }, duration * 1000);
    };

    // Show Nutri after initial delay
    const initialTimer = setTimeout(showNutri, initialDelay);

    // Set up recurring interval
    const intervalTimer = setInterval(showNutri, interval * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [interval, duration]);

  const positionClasses = {
    "bottom-left": "bottom-20 left-4",
    "bottom-right": "bottom-20 right-4",
    "top-left": "top-20 left-4",
    "top-right": "top-20 right-4"
  };

  const slideVariants = {
    "bottom-left": {
      initial: { x: -150, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -150, opacity: 0 }
    },
    "bottom-right": {
      initial: { x: 150, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 150, opacity: 0 }
    },
    "top-left": {
      initial: { x: -150, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -150, opacity: 0 }
    },
    "top-right": {
      initial: { x: 150, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 150, opacity: 0 }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={slideVariants[position].initial}
          animate={slideVariants[position].animate}
          exit={slideVariants[position].exit}
          transition={{
            type: "spring",
            stiffness: 100,  // Reduced from 200 for smoother motion
            damping: 25      // Increased from 20 for less bounce
          }}
          className={`fixed ${positionClasses[position]} z-40 pointer-events-none`}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl" />
            
            {/* Nutri mascot */}
            <Nutri 
              state={currentState}
              size={80}
              showSparkles={currentState === "dancing"}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
