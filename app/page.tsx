"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  PageWrapper,
  Card3D,
  Button3D,
  StatCard,
  SectionHeader,
  ProgressRing3D,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { dailyGoals, dailyLogs, userProfile } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find(log => log.date === today);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // Calculate today's totals
  const todayTotals = todayLog?.meals?.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const calorieProgress = dailyGoals?.calories ? (todayTotals.calories / dailyGoals.calories) * 100 : 0;
  const remaining = (dailyGoals?.calories || 2000) - todayTotals.calories;

  const startCamera = async () => {
    hapticMedium();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const capturePhoto = () => {
    hapticSuccess();
    setAnalyzing(true);
    
    // Simulate analysis then navigate
    setTimeout(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      router.push("/analysis");
    }, 1500);
  };

  const closeCamera = () => {
    hapticLight();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-400">{greeting()}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            {userProfile?.name || "Welcome"} 👋
          </h1>
        </motion.div>

        {/* Main Scanner Card */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="mb-6"
        >
          <Card3D variant="luxury" glowColor="rgba(168, 85, 247, 0.4)">
            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-5xl">📸</span>
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">AI Food Scanner</h2>
              <p className="text-gray-400 text-sm mb-4">
                Point your camera at any food to instantly analyze nutrition
              </p>
              <Button3D
                variant="primary"
                size="lg"
                icon="📷"
                onClick={startCamera}
                fullWidth
              >
                Scan Food
              </Button3D>
            </div>
          </Card3D>
        </motion.div>

        {/* Today's Progress */}
        <SectionHeader title="Today's Progress" icon="📊" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="glass">
            <div className="flex items-center gap-6">
              <ProgressRing3D
                progress={Math.min(calorieProgress, 100)}
                size={100}
                strokeWidth={10}
                color="purple"
                value={`${todayTotals.calories}`}
                label="kcal"
              />
              <div className="flex-1">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Remaining</span>
                    <span className={remaining >= 0 ? "text-green-400" : "text-red-400"}>
                      {remaining >= 0 ? remaining : 0} kcal
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(calorieProgress, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-blue-400 font-semibold">{Math.round(todayTotals.protein)}g</p>
                    <p className="text-gray-500 text-xs">Protein</p>
                  </div>
                  <div>
                    <p className="text-amber-400 font-semibold">{Math.round(todayTotals.carbs)}g</p>
                    <p className="text-gray-500 text-xs">Carbs</p>
                  </div>
                  <div>
                    <p className="text-pink-400 font-semibold">{Math.round(todayTotals.fat)}g</p>
                    <p className="text-gray-500 text-xs">Fat</p>
                  </div>
                </div>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" icon="⚡" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: "📖", label: "Food Diary", path: "/diary", color: "from-blue-600 to-cyan-600" },
            { icon: "🍳", label: "Recipes", path: "/recipes", color: "from-orange-600 to-amber-600" },
            { icon: "⚖️", label: "Weight", path: "/weight", color: "from-green-600 to-emerald-600" },
            { icon: "💪", label: "Fitness", path: "/fitness", color: "from-purple-600 to-pink-600" },
          ].map((action, index) => (
            <motion.div
              key={action.path}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
            >
              <Card3D
                variant="glass"
                onClick={() => { hapticLight(); router.push(action.path); }}
              >
                <div className="text-center py-2">
                  <motion.div
                    className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-2xl">{action.icon}</span>
                  </motion.div>
                  <p className="text-white font-medium text-sm">{action.label}</p>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Recent Meals */}
        {todayLog?.meals && todayLog.meals.length > 0 && (
          <>
            <SectionHeader
              title="Recent Meals"
              icon="🍽️"
              action={
                <Button3D
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/diary")}
                >
                  See All
                </Button3D>
              }
            />
            <div className="space-y-2">
              {todayLog.meals.slice(-3).reverse().map((meal, index) => (
                <motion.div
                  key={meal.id}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.05 }}
                >
                  <Card3D variant="glass" intensity="subtle">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {meal.mealType === "breakfast" ? "🌅" :
                           meal.mealType === "lunch" ? "☀️" :
                           meal.mealType === "dinner" ? "🌙" : "🍎"}
                        </span>
                        <div>
                          <p className="font-medium text-white">{meal.foodName}</p>
                          <p className="text-gray-500 text-sm capitalize">{meal.mealType}</p>
                        </div>
                      </div>
                      <span className="text-purple-400 font-semibold">{meal.calories} kcal</span>
                    </div>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {cameraActive && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-64 h-64 border-2 border-purple-500 rounded-3xl"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.3)",
                    "0 0 40px rgba(168, 85, 247, 0.6)",
                    "0 0 20px rgba(168, 85, 247, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-xl" />
                
                {/* Scanning line */}
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Analyzing overlay */}
            {analyzing && (
              <motion.div
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full border-4 border-purple-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-white mt-4 text-lg">Analyzing food...</p>
              </motion.div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
              <motion.button
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                onClick={closeCamera}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-2xl">✕</span>
              </motion.button>
              <motion.button
                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50"
                onClick={capturePhoto}
                whileTap={{ scale: 0.9 }}
                disabled={analyzing}
              >
                <div className="w-16 h-16 rounded-full border-4 border-white" />
              </motion.button>
              <motion.button
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-2xl">⚡</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavV2 />
    </PageWrapper>
  );
}
