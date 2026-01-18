"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  PageWrapper,
  Card3D,
  Button3D,
  SectionHeader,
  ProgressRing3D,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

const goalPresets = [
  { id: "lose", label: "Lose Weight", icon: "📉", calories: 1500, protein: 120, carbs: 150, fat: 50 },
  { id: "maintain", label: "Maintain", icon: "⚖️", calories: 2000, protein: 150, carbs: 250, fat: 65 },
  { id: "gain", label: "Build Muscle", icon: "💪", calories: 2500, protein: 180, carbs: 300, fat: 80 },
  { id: "custom", label: "Custom", icon: "🎯", calories: 0, protein: 0, carbs: 0, fat: 0 },
];

export default function GoalsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { dailyGoals, updateDailyGoals, dailyLogs } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find(log => log.date === today);

  const [editValues, setEditValues] = useState({
    calories: dailyGoals?.calories || 2000,
    protein: dailyGoals?.protein || 150,
    carbs: dailyGoals?.carbs || 250,
    fat: dailyGoals?.fat || 65,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (dailyGoals) {
      setEditValues({
        calories: dailyGoals.calories,
        protein: dailyGoals.protein,
        carbs: dailyGoals.carbs,
        fat: dailyGoals.fat,
      });
    }
  }, [dailyGoals]);

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

  // Calculate today's progress
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
  const proteinProgress = dailyGoals?.protein ? (todayTotals.protein / dailyGoals.protein) * 100 : 0;
  const carbsProgress = dailyGoals?.carbs ? (todayTotals.carbs / dailyGoals.carbs) * 100 : 0;
  const fatProgress = dailyGoals?.fat ? (todayTotals.fat / dailyGoals.fat) * 100 : 0;

  const handlePresetSelect = (preset: typeof goalPresets[0]) => {
    hapticMedium();
    setSelectedPreset(preset.id);
    if (preset.id !== "custom") {
      setEditValues({
        calories: preset.calories,
        protein: preset.protein,
        carbs: preset.carbs,
        fat: preset.fat,
      });
    }
    setIsEditing(preset.id === "custom");
  };

  const handleSaveGoals = () => {
    hapticSuccess();
    updateDailyGoals(editValues);
    setIsEditing(false);
    setSelectedPreset(null);
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            🎯 Daily Goals
          </h1>
          <p className="text-gray-400 mt-1">Set your nutrition targets</p>
        </motion.div>

        {/* Today's Progress */}
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="luxury" glowColor="rgba(168, 85, 247, 0.3)">
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">Today's Progress</p>
            </div>
            
            <div className="flex justify-center mb-4">
              <ProgressRing3D
                progress={Math.min(calorieProgress, 100)}
                size={140}
                strokeWidth={12}
                color="purple"
                value={`${todayTotals.calories}`}
                label={`of ${dailyGoals?.calories || 2000} kcal`}
              />
            </div>

            {/* Macro Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">🥩 Protein</span>
                  <span className="text-white">{Math.round(todayTotals.protein)}g / {dailyGoals?.protein || 150}g</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(proteinProgress, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">🍞 Carbs</span>
                  <span className="text-white">{Math.round(todayTotals.carbs)}g / {dailyGoals?.carbs || 250}g</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(carbsProgress, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">🥑 Fat</span>
                  <span className="text-white">{Math.round(todayTotals.fat)}g / {dailyGoals?.fat || 65}g</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(fatProgress, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Goal Presets */}
        <SectionHeader title="Quick Presets" icon="⚡" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {goalPresets.map((preset, index) => (
            <motion.div
              key={preset.id}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
            >
              <Card3D
                variant={selectedPreset === preset.id ? "luxury" : "glass"}
                intensity="subtle"
                glowColor={selectedPreset === preset.id ? "rgba(168, 85, 247, 0.4)" : undefined}
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="text-center py-2">
                  <span className="text-3xl mb-2 block">{preset.icon}</span>
                  <p className="font-medium text-white">{preset.label}</p>
                  {preset.id !== "custom" && (
                    <p className="text-xs text-gray-500 mt-1">{preset.calories} kcal</p>
                  )}
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Edit Goals */}
        <SectionHeader
          title="Your Targets"
          icon="🎯"
          action={
            !isEditing && (
              <Button3D
                variant="ghost"
                size="sm"
                onClick={() => { hapticLight(); setIsEditing(true); }}
              >
                Edit
              </Button3D>
            )
          }
        />
        <Card3D variant="glass">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">🔥 Calories</label>
                <input
                  type="number"
                  value={editValues.calories}
                  onChange={(e) => setEditValues({ ...editValues, calories: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-white focus:outline-none ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20 focus:border-purple-500' 
                      : 'bg-transparent border border-transparent'
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">🥩 Protein (g)</label>
                <input
                  type="number"
                  value={editValues.protein}
                  onChange={(e) => setEditValues({ ...editValues, protein: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-white focus:outline-none ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20 focus:border-purple-500' 
                      : 'bg-transparent border border-transparent'
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">🍞 Carbs (g)</label>
                <input
                  type="number"
                  value={editValues.carbs}
                  onChange={(e) => setEditValues({ ...editValues, carbs: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-white focus:outline-none ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20 focus:border-purple-500' 
                      : 'bg-transparent border border-transparent'
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">🥑 Fat (g)</label>
                <input
                  type="number"
                  value={editValues.fat}
                  onChange={(e) => setEditValues({ ...editValues, fat: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-white focus:outline-none ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20 focus:border-purple-500' 
                      : 'bg-transparent border border-transparent'
                  }`}
                />
              </div>
            </div>

            {isEditing && (
              <motion.div
                className="flex gap-3 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button3D
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setIsEditing(false);
                    setEditValues({
                      calories: dailyGoals?.calories || 2000,
                      protein: dailyGoals?.protein || 150,
                      carbs: dailyGoals?.carbs || 250,
                      fat: dailyGoals?.fat || 65,
                    });
                  }}
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  fullWidth
                  onClick={handleSaveGoals}
                >
                  Save Goals
                </Button3D>
              </motion.div>
            )}
          </div>
        </Card3D>
      </div>

      <BottomNavV2 />
    </PageWrapper>
  );
}
