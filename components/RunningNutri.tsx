"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nutri } from "./Nutri";

export function RunningNutri() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    // Check if Nutri has already run on this page view
    if (hasRun) return;

    // Wait 1 second after page load, then show Nutri
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setHasRun(true);
    }, 1000);

    // Hide Nutri after animation completes (4 seconds total)
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [hasRun]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -200 }}
          animate={{ x: "100vw" }}
          exit={{ opacity: 0 }}
          transition={{
            x: {
              duration: 4,
              ease: "linear"
            },
            opacity: {
              duration: 0.3
            }
          }}
          className="fixed bottom-20 left-0 z-40 pointer-events-none"
        >
          <Nutri state="running" size={80} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
