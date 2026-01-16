"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nutri } from "./Nutri";
import { getRandomHealthTip } from "@/lib/health-tips";
import { Volume2, VolumeX } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [healthTip, setHealthTip] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Function to speak text using Web Speech API
  const speak = (text: string, delay: number = 0) => {
    if (!speechEnabled || typeof window === 'undefined') return;
    
    setTimeout(() => {
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher pitch for friendly tone
        utterance.volume = 0.8; // Not too loud
        
        // Try to use a friendly voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Female') ||
          voice.name.includes('Samantha')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    }, delay);
  };

  useEffect(() => {
    // Set random health tip
    const tip = getRandomHealthTip();
    setHealthTip(tip);
    
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

    // Load voices (needed for some browsers)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    // Speak greeting after Nutri appears (2 seconds)
    speak(`${greetingText} I'm Nutri, your friendly health buddy!`, 2000);
    
    // Speak health tip after it appears (3.5 seconds)
    // Remove emoji from speech for better clarity
    const tipWithoutEmoji = tip.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    speak(`Here's a health tip for you: ${tipWithoutEmoji}`, 3500);

    // Hide splash screen after 7 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Cancel any ongoing speech when closing
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => {
        onComplete?.();
      }, 800);
    }, 7000);

    return () => {
      clearTimeout(timer);
      // Cleanup speech on unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onComplete, speechEnabled]);

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-6"
        >
          {/* Speech toggle button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={toggleSpeech}
            className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-colors"
            aria-label={speechEnabled ? "Mute speech" : "Enable speech"}
          >
            {speechEnabled ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <VolumeX className="w-5 h-5 text-white" />
            )}
          </motion.button>

          {/* Speaking indicator */}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </motion.div>
          )}

          {/* Animated background circles */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
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
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute bottom-32 right-10 w-40 h-40 bg-white/20 rounded-full blur-xl"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
            {/* App Logo/Name */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold text-white mb-2">
                Nutri<span className="text-yellow-300">Scan</span>
              </h1>
              <p className="text-white/90 text-lg">Your Health Companion</p>
            </motion.div>

            {/* Nutri Mascot */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 1,
                duration: 0.8,
                type: "spring", 
                stiffness: 150,
                damping: 15 
              }}
            >
              <Nutri 
                state="waving" 
                size={160}
                showSparkles
              />
            </motion.div>

            {/* Greeting */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                {greeting}
              </h2>
              <p className="text-white/90 text-sm">I'm Nutri, your friendly health buddy! 🥑</p>
            </motion.div>

            {/* Health Tip */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 3, duration: 0.8 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
            >
              <p className="text-sm text-white font-medium text-center">
                💡 <span className="font-bold">Health Tip:</span>
              </p>
              <p className="text-sm text-white/90 text-center mt-2">
                {healthTip}
              </p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 0.8 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
