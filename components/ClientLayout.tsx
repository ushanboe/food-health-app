"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if splash has been shown this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

    if (!hasSeenSplash) {
      // First time this session - show splash
      setShowSplash(true);
      // Mark that splash has been shown
      sessionStorage.setItem('hasSeenSplash', 'true');
    } else {
      // Already seen splash this session - skip it
      setShowSplash(false);
    }

    setIsLoading(false);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Don't render anything until we check session storage
  if (isLoading) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
