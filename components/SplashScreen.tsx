"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nutri } from "./Nutri";
import { getRandomHealthTip } from "@/lib/health-tips";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [healthTip, setHealthTip] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Set random health tip
    setHealthTip(getRandomHealthTip());
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    let greetingText = "Hello!";
    
    if (hour < 12) {
      greetingText = "Good morning!";
    } else if (hour < 18) {
      greetingText = "Good afternoon!";
    } else {
      greetingText = "Good evening!";
    }
    
    setGreeting(greetingText);

    // Hide splash screen after 7 seconds (increased from 4)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 800); // Longer exit animation
    }, 7000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }} // Slower fade in/out
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-6"
        >
          {/* Animated background circles - slower */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5, // Slower from 3s
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6, // Slower from 4s
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute bottom-32 right-10 w-40 h-40 bg-white/20 rounded-full blur-xl"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
            {/* App Logo/Name - slower entrance */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }} // Slower
              className="text-center"
            >
              <h1 className="text-5xl font-bold text-white mb-2">
                Nutri<span className="text-yellow-300">Scan</span>
              </h1>
              <p className="text-white/90 text-lg">Your Health Companion</p>
            </motion.div>

            {/* Nutri Mascot - slower entrance */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 1, // Longer delay
                duration: 0.8, // Slower
                type: "spring", 
                stiffness: 150, // Less bouncy
                damping: 15 
              }}
            >
              <Nutri 
                state="waving" 
                size={160}
                showSparkles
              />
            </motion.div>

            {/* Greeting - slower entrance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }} // Much slower
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                {greeting}
              </h2>
              <p className="text-white/90 text-sm">I'm Nutri, your friendly health buddy! 🥑</p>
            </motion.div>

            {/* Health Tip - slower entrance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 3, duration: 0.8 }} // Much slower
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
            >
              <p className="text-sm text-white font-medium text-center">
                💡 <span className="font-bold">Health Tip:</span>
              </p>
              <p className="text-sm text-white/90 text-center mt-2">
                {healthTip}
              </p>
            </motion.div>

            {/* Loading indicator - slower entrance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 0.8 }} // Much slower
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }} // Slower rotation
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <p className="text-white/70 text-sm">Loading your health journey...</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
