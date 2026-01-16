"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";
import BottomNav from "./BottomNav";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Check if this is the first load
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (hasSeenSplash) {
      setShowSplash(false);
      setIsFirstLoad(false);
    } else {
      sessionStorage.setItem("hasSeenSplash", "true");
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && isFirstLoad && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      <div className="app-container">
        <main className="main-content hide-scrollbar">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
