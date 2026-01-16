"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Sparkles, Target, ChevronRight, Barcode, Flame, Footprints, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ProgressRing } from "@/components/ProgressRing";
import BottomNav from "@/components/BottomNav";

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { 
    analysisHistory, dailyGoals, dailyLogs, setCurrentAnalysis,
    getDailyCaloriesBurned, getDailyFitnessLog, getNetCalories 
  } = useAppStore();

  useEffect(() => { setMounted(true); }, []);

  const today = getTodayString();
  const todayLog = dailyLogs?.find(l => l.date === today);
  const todayTotals = todayLog?.meals?.reduce(
    (acc, m) => ({ calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0), carbs: acc.carbs + (m.carbs || 0), fat: acc.fat + (m.fat || 0) }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Fitness data
  const fitnessLog = getDailyFitnessLog(today);
  const caloriesBurned = getDailyCaloriesBurned(today);
  const steps = fitnessLog?.steps || 0;
  const exerciseCount = fitnessLog?.exercises?.length || 0;
  const netCalories = getNetCalories(today);

  const recentScans = analysisHistory?.slice(0, 3) || [];

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="px-5 py-6 safe-top">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Nutri<span className="text-green-500">Scan</span></h1>
          <p className="text-gray-500 mt-1">Your personal food health analyzer</p>
        </motion.div>

        {/* Daily Progress Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          onClick={() => router.push("/diary")}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">Today's Nutrition</h2>
              <p className="text-sm text-gray-500">{todayLog?.meals?.length || 0} items logged</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); router.push("/goals"); }} className="text-green-600 text-sm font-medium flex items-center gap-1">
              <Target className="w-4 h-4" /> Goals
            </button>
          </div>
          <div className="flex items-center justify-center">
            <ProgressRing current={todayTotals.calories} goal={dailyGoals?.calories || 2000} size={120} strokeWidth={10} />
          </div>
          <div className="flex justify-around mt-4 text-center">
            <div><p className="text-lg font-bold text-red-500">{Math.round(todayTotals.protein)}g</p><p className="text-xs text-gray-500">Protein</p></div>
            <div><p className="text-lg font-bold text-amber-500">{Math.round(todayTotals.carbs)}g</p><p className="text-xs text-gray-500">Carbs</p></div>
            <div><p className="text-lg font-bold text-blue-500">{Math.round(todayTotals.fat)}g</p><p className="text-xs text-gray-500">Fat</p></div>
          </div>
        </motion.div>

        {/* Fitness Summary Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          onClick={() => router.push("/fitness")}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 mb-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-white" />
              <h2 className="font-semibold text-white">Today's Fitness</h2>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{caloriesBurned}</p>
              <p className="text-xs text-white/70">Burned</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <Footprints className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{steps.toLocaleString()}</p>
              <p className="text-xs text-white/70">Steps</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-white mx-auto mb-1" />
              <p className={`text-xl font-bold ${netCalories > (dailyGoals?.calories || 2000) ? 'text-red-200' : 'text-green-200'}`}>{netCalories}</p>
              <p className="text-xs text-white/70">Net Cal</p>
            </div>
          </div>
          {exerciseCount > 0 && (
            <p className="text-xs text-white/70 mt-2 text-center">{exerciseCount} exercise{exerciseCount > 1 ? 's' : ''} logged today</p>
          )}
        </motion.div>

        {/* Scan CTA */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 mb-5 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-green-100 text-xs font-medium">AI-Powered</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Scan Your Food</h2>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push("/camera")}
              className="w-full flex items-center justify-center gap-2 bg-white text-green-600 font-semibold py-3 px-4 rounded-xl shadow">
              <Camera className="w-5 h-5" /> Start Scanning
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Scans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white">Recent Scans</h3>
            {recentScans.length > 0 && <button onClick={() => router.push("/history")} className="text-green-600 text-sm font-medium flex items-center gap-1">See all<ChevronRight className="w-4 h-4" /></button>}
          </div>
          {recentScans.length > 0 ? (
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <motion.div key={scan.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  onClick={() => { setCurrentAnalysis(scan); router.push("/details"); }}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {scan.imageData ? <img src={scan.imageData} alt={scan.foodName} className="w-full h-full object-cover" /> : <Barcode className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 dark:text-white truncate">{scan.foodName}</h4>
                    <p className="text-xs text-gray-500">{scan.calories} kcal</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${scan.healthScore >= 60 ? "bg-green-100 text-green-700" : scan.healthScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{scan.healthScore}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">No scans yet. Start by scanning your first food!</p>
            </div>
          )}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
