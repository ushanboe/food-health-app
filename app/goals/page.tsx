"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, Target, Flame, Scale, Activity, User, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store";

const activityOptions = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", label: "Light", desc: "Exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", desc: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", desc: "Exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", desc: "Hard exercise daily" },
];

const goalOptions = [
  { value: "lose", label: "Lose Weight", desc: "-500 cal/day", icon: "📉" },
  { value: "maintain", label: "Maintain", desc: "Stay same", icon: "⚖️" },
  { value: "gain", label: "Gain Weight", desc: "+300 cal/day", icon: "📈" },
];

export default function GoalsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { userStats, dailyGoals, updateUserStats, updateDailyGoals, calculateTDEE } = useAppStore();
  const [localStats, setLocalStats] = useState(userStats);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLocalStats(userStats); }, [userStats]);

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" /></div>;

  const handleCalculate = () => {
    updateUserStats(localStats);
    const tdee = calculateTDEE();
    // Calculate macros based on TDEE
    const protein = Math.round(localStats.currentWeight * 1.6); // 1.6g per kg
    const fat = Math.round((tdee * 0.25) / 9); // 25% from fat
    const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
    updateDailyGoals({ calories: tdee, protein, carbs, fat });
    setShowCalculator(false);
  };

  const tdeePreview = (() => {
    const bmr = localStats.gender === "male"
      ? 10 * localStats.currentWeight + 6.25 * localStats.height - 5 * localStats.age + 5
      : 10 * localStats.currentWeight + 6.25 * localStats.height - 5 * localStats.age - 161;
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = bmr * mult[localStats.activityLevel];
    if (localStats.weightGoal === "lose") return Math.round(tdee - 500);
    if (localStats.weightGoal === "gain") return Math.round(tdee + 300);
    return Math.round(tdee);
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-5 pt-12 pb-6 safe-top">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Daily Goals</h1>
        </div>
        <p className="text-green-100">Personalized nutrition targets</p>
      </div>

      <div className="px-5 py-4 space-y-4 -mt-4">
        {/* Current Goals Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Your Daily Targets</h3>
            <button onClick={() => setShowCalculator(true)} className="text-green-600 text-sm font-medium flex items-center gap-1">
              <Calculator className="w-4 h-4" /> Calculate
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 rounded-xl p-4">
              <Flame className="w-6 h-6 text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{dailyGoals.calories}</p>
              <p className="text-sm text-gray-500">Calories</p>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl p-4">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2">P</div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{dailyGoals.protein}g</p>
              <p className="text-sm text-gray-500">Protein</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl p-4">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2">C</div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{dailyGoals.carbs}g</p>
              <p className="text-sm text-gray-500">Carbs</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2">F</div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{dailyGoals.fat}g</p>
              <p className="text-sm text-gray-500">Fat</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={() => router.push("/weight")} className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-gray-800 dark:text-white">Weight Tracker</h4>
              <p className="text-sm text-gray-500">Log and track your weight</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button onClick={() => router.push("/recipes")} className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🍳</span>
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-gray-800 dark:text-white">Recipe Builder</h4>
              <p className="text-sm text-gray-500">Create custom meals</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
        </motion.div>
      </div>

      {/* TDEE Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">TDEE Calculator</h3>
            <p className="text-sm text-gray-500 mb-4">Calculate your daily calorie needs</p>

            <div className="space-y-4">
              {/* Gender */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {["male", "female"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setLocalStats({ ...localStats, gender: g as "male" | "female" })}
                      className={`py-3 rounded-xl font-medium capitalize transition-colors ${
                        localStats.gender === g
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {g === "male" ? "👨" : "👩"} {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age, Height, Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Age</label>
                  <input
                    type="number"
                    value={localStats.age}
                    onChange={(e) => setLocalStats({ ...localStats, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-center font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Height (cm)</label>
                  <input
                    type="number"
                    value={localStats.height}
                    onChange={(e) => setLocalStats({ ...localStats, height: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-center font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={localStats.currentWeight}
                    onChange={(e) => setLocalStats({ ...localStats, currentWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-center font-medium"
                  />
                </div>
              </div>

              {/* Target Weight */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Target Weight (kg)</label>
                <input
                  type="number"
                  value={localStats.targetWeight}
                  onChange={(e) => setLocalStats({ ...localStats, targetWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-center font-medium"
                />
              </div>

              {/* Activity Level */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Activity Level</label>
                <div className="space-y-2">
                  {activityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLocalStats({ ...localStats, activityLevel: opt.value as any })}
                      className={`w-full p-3 rounded-xl text-left transition-colors ${
                        localStats.activityLevel === opt.value
                          ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <p className="font-medium text-gray-800 dark:text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Goal */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Goal</label>
                <div className="grid grid-cols-3 gap-2">
                  {goalOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLocalStats({ ...localStats, weightGoal: opt.value as any })}
                      className={`p-3 rounded-xl text-center transition-colors ${
                        localStats.weightGoal === opt.value
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <p className="text-xs font-medium mt-1">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center">
                <p className="text-sm opacity-80">Your Daily Calories</p>
                <p className="text-4xl font-bold">{tdeePreview}</p>
                <p className="text-xs opacity-80 mt-1">Based on Mifflin-St Jeor equation</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCalculator(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">
                  Cancel
                </button>
                <button onClick={handleCalculate} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium">
                  Apply Goals
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
