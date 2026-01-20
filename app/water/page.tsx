"use client";

import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Droplets,
  Plus,
  Minus,
  Trash2,
  Target,
  TrendingUp,
  Clock,
  GlassWater,
  Coffee,
  Wine,
} from "lucide-react";
import { useAppStore, getTodayString, WaterEntry } from "@/lib/store";

const QUICK_AMOUNTS = [
  { label: "Small Glass", amount: 200, icon: GlassWater },
  { label: "Glass", amount: 250, icon: GlassWater },
  { label: "Large Glass", amount: 350, icon: GlassWater },
  { label: "Bottle", amount: 500, icon: Droplets },
  { label: "Large Bottle", amount: 750, icon: Droplets },
  { label: "Coffee/Tea", amount: 200, icon: Coffee },
];

export default function WaterPage() {
  const router = useRouter();
  const {
    dailyGoals,
    updateDailyGoals,
    addWaterEntry,
    removeWaterEntry,
    getDailyWaterLog,
    getDailyWaterTotal,
  } = useAppStore();

  const [customAmount, setCustomAmount] = useState(250);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoals.water || 2000);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const today = getTodayString();
  const todayLog = getDailyWaterLog(today);
  const totalWater = getDailyWaterTotal(today);
  const waterGoal = dailyGoals.water || 2000;
  const progress = Math.min((totalWater / waterGoal) * 100, 100);
  const remaining = Math.max(waterGoal - totalWater, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddWater = (amount: number) => {
    const entry: WaterEntry = {
      id: crypto.randomUUID(),
      date: today,
      amount,
      timestamp: new Date(),
    };
    addWaterEntry(entry);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleRemoveEntry = (entryId: string) => {
    removeWaterEntry(today, entryId);
  };

  const handleSaveGoal = () => {
    updateDailyGoals({ water: newGoal });
    setShowGoalEdit(false);
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PageContainer>
      <Header 
        variant="green" 
        title="Water Tracker" 
        showLogo 
        rightAction={
          <button
            onClick={() => setShowGoalEdit(true)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Target className="w-6 h-6 text-white" />
          </button>
        }
      />

      <PageContent className="space-y-6">
        {/* Progress Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg"
        >
          <div className="flex flex-col items-center">
            {/* Animated Water Glass */}
            <div className="relative w-48 h-48 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Glass outline */}
                <path
                  d="M20 15 L25 85 C25 90 35 95 50 95 C65 95 75 90 75 85 L80 15 Z"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                  className="dark:stroke-gray-600"
                />
                {/* Water fill */}
                <defs>
                  <clipPath id="glassClip">
                    <path d="M22 17 L26.5 83 C26.5 88 36 93 50 93 C64 93 73.5 88 73.5 83 L78 17 Z" />
                  </clipPath>
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <g clipPath="url(#glassClip)">
                  <motion.rect
                    x="15"
                    width="70"
                    height="80"
                    fill="url(#waterGradient)"
                    initial={{ y: 100 }}
                    animate={{ y: 100 - (progress * 0.85) }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {/* Wave animation */}
                  <motion.path
                    d="M15 0 Q30 5 50 0 T85 0 V10 H15 Z"
                    fill="rgba(255,255,255,0.3)"
                    initial={{ y: 100 }}
                    animate={{ 
                      y: 100 - (progress * 0.85) - 5,
                      d: [
                        "M15 0 Q30 5 50 0 T85 0 V10 H15 Z",
                        "M15 0 Q30 -5 50 0 T85 0 V10 H15 Z",
                        "M15 0 Q30 5 50 0 T85 0 V10 H15 Z",
                      ]
                    }}
                    transition={{ 
                      y: { duration: 0.8, ease: "easeOut" },
                      d: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                </g>
              </svg>
              {/* Percentage in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.span
                    key={totalWater}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                  >
                    {Math.round(progress)}%
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-center space-y-1">
              <motion.p
                key={totalWater}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {totalWater} ml
              </motion.p>
              <p className="text-gray-500 dark:text-gray-400">
                of {waterGoal} ml goal
              </p>
              {remaining > 0 && (
                <p className="text-sm text-blue-500">
                  {remaining} ml remaining
                </p>
              )}
              {progress >= 100 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-500 font-medium flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  Goal reached! 🎉
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Add Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            Quick Add
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddWater(item.amount)}
                className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <item.icon className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {item.amount}ml
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Custom Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Custom Amount
          </h2>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustomAmount(Math.max(50, customAmount - 50))}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Minus className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </motion.button>
            <div className="text-center min-w-[120px]">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-center text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">ml</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustomAmount(customAmount + 50)}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAddWater(customAmount)}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Add {customAmount}ml
          </motion.button>
        </motion.div>

        {/* Today's Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Today's Log
          </h2>
          {todayLog && todayLog.entries.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {[...(todayLog.entries || [])].reverse().map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <Droplets className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {entry.amount}ml
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Droplets className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No water logged yet today</p>
              <p className="text-sm">Start by adding your first glass!</p>
            </div>
          )}
        </motion.div>
      </PageContent>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Droplets className="w-5 h-5" />
            Water added! 💧
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Edit Modal */}
      <AnimatePresence>
        {showGoalEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGoalEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                Set Daily Goal
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Daily water goal (ml)</label>
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(Math.max(500, parseInt(e.target.value) || 2000))}
                    className="w-full mt-1 p-3 text-lg font-semibold bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 text-sm">
                  {[1500, 2000, 2500, 3000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setNewGoal(preset)}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        newGoal === preset
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {preset / 1000}L
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Recommended: 2000-2500ml (8-10 cups) per day
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowGoalEdit(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGoal}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Save Goal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </PageContainer>
  );
}
