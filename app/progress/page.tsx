"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Scale,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react";
import { useAppStore, getTodayString } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export default function ProgressPage() {
  const router = useRouter();
  const { dailyLogs, dailyGoals, getDailyTotals, fitnessLogs } = useAppStore();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  // Calculate date range
  const { start, end, daysInRange } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === "week") {
      start.setDate(end.getDate() - 7);
    } else if (timeRange === "month") {
      start.setMonth(end.getMonth() - 1);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { start, end, daysInRange };
  }, [timeRange]);

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      const date = new Date(log.date);
      return date >= start && date <= end;
    });
  }, [dailyLogs, start, end]);

  const filteredFitnessLogs = useMemo(() => {
    return (fitnessLogs || []).filter((log) => {
      const date = new Date(log.date);
      return date >= start && date <= end;
    });
  }, [fitnessLogs, start, end]);

  // Calculate totals from filtered logs
  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    
    filteredLogs.forEach((log) => {
      log.meals.forEach((meal) => {
        calories += meal.calories || 0;
        protein += meal.protein || 0;
        carbs += meal.carbs || 0;
        fat += meal.fat || 0;
      });
    });
    
    return { calories, protein, carbs, fat };
  }, [filteredLogs]);

  // Calculate averages
  const avgCalories = Math.round(totals.calories / Math.max(daysInRange, 1));
  const avgProtein = Math.round(totals.protein / Math.max(daysInRange, 1));
  const avgCarbs = Math.round(totals.carbs / Math.max(daysInRange, 1));
  const avgFat = Math.round(totals.fat / Math.max(daysInRange, 1));

  // Activity stats
  const totalWorkouts = filteredFitnessLogs.reduce((sum, log) => sum + (log.exercises?.length || 0), 0);
  const totalCaloriesBurned = filteredFitnessLogs.reduce((sum, log) => {
    return sum + (log.exercises?.reduce((s, e) => s + (e.caloriesBurned || 0), 0) || 0);
  }, 0);

  // Goal progress
  const calorieGoalProgress = dailyGoals.calories > 0 
    ? Math.round((avgCalories / dailyGoals.calories) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Progress</h1>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 px-4 pb-4">
          {(["week", "month", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-white text-emerald-600"
                  : "bg-white/20 text-white"
              }`}
            >
              {range === "week" ? "7 Days" : range === "month" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 -mt-2">
        {/* Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-emerald-500" />
              <h2 className="font-semibold text-gray-900">Daily Averages</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <Flame size={24} className="mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-orange-600">{avgCalories}</p>
                <p className="text-xs text-orange-500">Avg Calories</p>
                <p className="text-xs text-gray-400 mt-1">
                  Goal: {dailyGoals.calories || "Not set"}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>
                <p className="text-2xl font-bold text-blue-600">{avgProtein}g</p>
                <p className="text-xs text-blue-500">Avg Protein</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
                <p className="text-2xl font-bold text-amber-600">{avgCarbs}g</p>
                <p className="text-xs text-amber-500">Avg Carbs</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">F</div>
                <p className="text-2xl font-bold text-pink-600">{avgFat}g</p>
                <p className="text-xs text-pink-500">Avg Fat</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weight Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-purple-500" />
                <h2 className="font-semibold text-gray-900">Weight Progress</h2>
              </div>
              <button
                onClick={() => router.push("/weight")}
                className="text-sm text-emerald-600 flex items-center gap-1"
              >
                Details <ChevronRight size={16} />
              </button>
            </div>

            <p className="text-gray-400 text-center py-4">Track your weight in the Weight section</p>
          </Card>
        </motion.div>

        {/* Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-green-500" />
                <h2 className="font-semibold text-gray-900">Fitness Activity</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{totalWorkouts}</p>
                <p className="text-xs text-green-500">Workouts</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{totalCaloriesBurned}</p>
                <p className="text-xs text-red-500">Calories Burned</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Achievements</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 text-center ${
                filteredLogs.length >= 7 ? "bg-yellow-100" : "bg-gray-100"
              }`}>
                <p className="text-2xl mb-1">📝</p>
                <p className="text-xs text-gray-600">7 Day Streak</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                totalWorkouts >= 5 ? "bg-yellow-100" : "bg-gray-100"
              }`}>
                <p className="text-2xl mb-1">💪</p>
                <p className="text-xs text-gray-600">5 Workouts</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                calorieGoalProgress >= 80 && calorieGoalProgress <= 120 ? "bg-yellow-100" : "bg-gray-100"
              }`}>
                <p className="text-2xl mb-1">🎯</p>
                <p className="text-xs text-gray-600">On Target</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
