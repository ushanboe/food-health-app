"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, MealType, MealEntry, getTodayString } from "@/lib/store";
import { ProgressRing, MiniProgressRing } from "@/components/ProgressRing";
import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

const mealConfig: { type: MealType; label: string; icon: string; timeHint: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅", timeHint: "6am - 10am" },
  { type: "lunch", label: "Lunch", icon: "☀️", timeHint: "11am - 2pm" },
  { type: "dinner", label: "Dinner", icon: "🌙", timeHint: "5pm - 9pm" },
  { type: "snacks", label: "Snacks", icon: "🍿", timeHint: "Anytime" },
];

export default function DiaryPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [mounted, setMounted] = useState(false);

  const { dailyGoals, dailyLogs, removeMealEntry } = useAppStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const currentLog = dailyLogs.find((log) => log.date === selectedDate);
  const meals = currentLog?.meals || [];

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Get meals by type
  const getMealsByType = (type: MealType) => meals.filter((m) => m.mealType === type);

  // Date navigation
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === getTodayString();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date(getTodayString());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === getTodayString()) return "Today";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold mb-4">Food Diary</h1>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white/20 rounded-xl p-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-lg">{formatDate(selectedDate)}</span>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors ${isToday ? "opacity-30" : "hover:bg-white/20"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-center mb-4">
            <ProgressRing
              current={totals.calories}
              goal={dailyGoals.calories}
              size={140}
              strokeWidth={10}
            />
          </div>

          {/* Macro Progress */}
          <div className="flex justify-around mt-4">
            <MiniProgressRing
              current={totals.protein}
              goal={dailyGoals.protein}
              label="Protein"
              color="#ef4444"
            />
            <MiniProgressRing
              current={totals.carbs}
              goal={dailyGoals.carbs}
              label="Carbs"
              color="#f59e0b"
            />
            <MiniProgressRing
              current={totals.fat}
              goal={dailyGoals.fat}
              label="Fat"
              color="#3b82f6"
            />
          </div>
        </motion.div>
      </div>

      {/* Meal Sections */}
      <div className="px-4 mt-6 space-y-4">
        {mealConfig.map((meal, index) => {
          const mealItems = getMealsByType(meal.type);
          const mealCalories = mealItems.reduce((sum, m) => sum + (m.calories || 0), 0);

          return (
            <motion.div
              key={meal.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Meal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meal.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{meal.label}</h3>
                    <p className="text-xs text-gray-500">{meal.timeHint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {mealCalories} kcal
                  </span>
                  <button
                    onClick={() => router.push(`/camera?meal=${meal.type}`)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Meal Items */}
              <AnimatePresence>
                {mealItems.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {mealItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageData ? (
                            <img
                              src={item.imageData}
                              alt={item.foodName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xl">🍽️</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.foodName}</p>
                            <p className="text-xs text-gray-500">
                              {item.servingSize || "1 serving"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.calories}</p>
                            <p className="text-xs text-gray-500">kcal</p>
                          </div>
                          <button
                            onClick={() => removeMealEntry(selectedDate, item.id)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No items logged yet
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
