"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function GoalsPage() {
  const router = useRouter();
  const { dailyGoals, updateDailyGoals } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState(dailyGoals);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGoals(dailyGoals);
  }, [dailyGoals]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const handleSave = () => {
    updateDailyGoals(goals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Preset calorie goals
  const presets = [
    { label: "Lose Weight", calories: 1500, description: "Calorie deficit" },
    { label: "Maintain", calories: 2000, description: "Balanced intake" },
    { label: "Build Muscle", calories: 2500, description: "Calorie surplus" },
  ];

  const applyPreset = (calories: number) => {
    // Calculate macros based on calories
    // Typical ratio: 30% protein, 40% carbs, 30% fat
    const protein = Math.round((calories * 0.3) / 4); // 4 cal per gram
    const carbs = Math.round((calories * 0.4) / 4); // 4 cal per gram
    const fat = Math.round((calories * 0.3) / 9); // 9 cal per gram
    setGoals({ calories, protein, carbs, fat });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Daily Goals</h1>
        </div>
        <p className="text-green-100">Set your nutrition targets</p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Presets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Presets</h2>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.calories)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  goals.calories === preset.calories
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{preset.label}</p>
                <p className="text-lg font-bold text-green-600">{preset.calories}</p>
                <p className="text-xs text-gray-500">{preset.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Calorie Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Calorie Goal</h2>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1000"
              max="4000"
              step="50"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="w-24 text-center">
              <input
                type="number"
                value={goals.calories}
                onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) || 0 })}
                className="w-full text-center text-xl font-bold bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">kcal</span>
            </div>
          </div>
        </motion.div>

        {/* Macro Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Macro Goals</h2>
          <div className="space-y-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-red-500">Protein</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{goals.protein}g</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                value={goals.protein}
                onChange={(e) => setGoals({ ...goals, protein: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-amber-500">Carbohydrates</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{goals.carbs}g</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={goals.carbs}
                onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-500">Fat</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{goals.fat}g</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={goals.fat}
                onChange={(e) => setGoals({ ...goals, fat: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Macro Summary */}
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Total from macros: {(goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)} kcal
              <br />
              <span className="text-gray-400">
                (Protein: {goals.protein * 4} + Carbs: {goals.carbs * 4} + Fat: {goals.fat * 9})
              </span>
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleSave}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
            saved
              ? "bg-green-600"
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Goals"}
        </motion.button>
      </div>
    </div>
  );
}
