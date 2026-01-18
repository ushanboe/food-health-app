"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore, getTodayString, ExerciseEntry } from "@/lib/store";
import { useFitnessSync, useFitnessDataForDate } from "@/lib/fitness-sync/hooks";
import SyncedActivities from "@/components/fitness/SyncedActivities";
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

const exerciseTypes = [
  { type: "walking", icon: "🚶", label: "Walking", color: "from-green-500 to-emerald-500" },
  { type: "running", icon: "🏃", label: "Running", color: "from-orange-500 to-red-500" },
  { type: "cycling", icon: "🚴", label: "Cycling", color: "from-blue-500 to-cyan-500" },
  { type: "swimming", icon: "🏊", label: "Swimming", color: "from-cyan-500 to-blue-500" },
  { type: "gym", icon: "🏋️", label: "Gym", color: "from-purple-500 to-pink-500" },
  { type: "yoga", icon: "🧘", label: "Yoga", color: "from-pink-500 to-rose-500" },
  { type: "sports", icon: "⚽", label: "Sports", color: "from-amber-500 to-orange-500" },
  { type: "other", icon: "💪", label: "Other", color: "from-gray-500 to-gray-600" },
];

export default function FitnessPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");

  const {
    getDailyFitnessLog,
    getDailyCaloriesBurned,
    addExerciseEntry,
    updateSteps,
    dailyGoals,
  } = useAppStore();

  const today = getTodayString();
  const fitnessLog = getDailyFitnessLog(today);
  const { connectedProviders, syncAllProviders, isLoading: isSyncing } = useFitnessSync();
  const syncedData = useFitnessDataForDate(today);

  useEffect(() => {
    setMounted(true);
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

  const manualSteps = fitnessLog?.steps || 0;
  const syncedSteps = syncedData.steps?.value || 0;
  const steps = Math.max(manualSteps, syncedSteps);
  const stepsGoal = 10000;
  const stepsProgress = Math.min((steps / stepsGoal) * 100, 100);

  const manualCalories = getDailyCaloriesBurned(today);
  const syncedCalories = syncedData.calories?.value || 0;
  const caloriesBurned = Math.max(manualCalories, syncedCalories);

  const exercises = fitnessLog?.exercises || [];
  const activeMinutes = exercises.reduce((sum, e) => sum + (e.duration || 0), 0);

  const handleAddExercise = () => {
    if (!selectedType || !duration) return;
    
    hapticSuccess();
    const exerciseType = exerciseTypes.find(e => e.type === selectedType);
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    addExerciseEntry({
      id: Date.now().toString(),
      exerciseId: selectedType,
      exerciseName: exerciseType?.label || selectedType,
      category: "cardio",
      duration: parseInt(duration),
      caloriesBurned: parseInt(calories) || Math.round(parseInt(duration) * 5),
      intensity: "moderate",
      timestamp: new Date(),
      date: today,
    });
    
    setShowAddExercise(false);
    setSelectedType(null);
    setDuration("");
    setCalories("");
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
            💪 Fitness
          </h1>
          <p className="text-gray-400 mt-1">Track your daily activity</p>
        </motion.div>

        {/* Steps Ring Card */}
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="luxury" glowColor="rgba(16, 185, 129, 0.3)">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ProgressRing3D
                  progress={stepsProgress}
                  size={160}
                  strokeWidth={14}
                  color="green"
                  value={steps.toLocaleString()}
                  label={`of ${stepsGoal.toLocaleString()} steps`}
                />
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">🔥 {caloriesBurned}</p>
                  <p className="text-xs text-gray-400">Calories Burned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">⏱️ {activeMinutes}</p>
                  <p className="text-xs text-gray-400">Active Minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">🏃 {exercises.length}</p>
                  <p className="text-xs text-gray-400">Workouts</p>
                </div>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Today's Activities */}
        <SectionHeader
          title="Today's Activities"
          icon="🎯"
          action={
            <Button3D
              variant="secondary"
              size="sm"
              icon="+"
              onClick={() => { hapticMedium(); setShowAddExercise(true); }}
            >
              Add
            </Button3D>
          }
        />

        {exercises.length === 0 ? (
          <Card3D variant="glass" className="mb-6">
            <div className="text-center py-6">
              <span className="text-4xl mb-3 block">🏃‍♂️</span>
              <p className="text-gray-400">No activities logged today</p>
              <p className="text-gray-500 text-sm mt-1">Tap + to add your first workout</p>
            </div>
          </Card3D>
        ) : (
          <div className="space-y-3 mb-6">
            {exercises.map((exercise, index) => {
              const typeInfo = exerciseTypes.find(e => e.type === exercise.exerciseId) || exerciseTypes[7];
              return (
                <motion.div
                  key={exercise.id || index}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card3D variant="glass" intensity="subtle">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center text-2xl shadow-lg`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{exercise.exerciseName}</h3>
                        <p className="text-gray-400 text-sm">
                          {exercise.duration} min • {exercise.caloriesBurned} kcal
                        </p>
                      </div>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Synced Activities */}
        <SyncedActivities date={today} />

        {/* Quick Add Steps */}
        <SectionHeader title="Quick Add Steps" icon="👟" />
        <Card3D variant="glass" className="mb-6">
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Enter steps..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value);
                  if (value > 0) {
                    hapticSuccess();
                    updateSteps(today, value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <Button3D
              variant="success"
              icon="✓"
              onClick={() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                const value = parseInt(input?.value);
                if (value > 0) {
                  hapticSuccess();
                  updateSteps(today, value);
                  input.value = '';
                }
              }}
            >
              Add
            </Button3D>
          </div>
        </Card3D>

        {/* Connect Fitness Apps */}
        <SectionHeader title="Connected Apps" icon="📱" />
        <Card3D
          variant="glass"
          onClick={() => { hapticLight(); router.push('/settings'); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">
                🔗
              </div>
              <div>
                <p className="font-semibold text-white">
                  {connectedProviders.length > 0 
                    ? `${connectedProviders.length} app${connectedProviders.length > 1 ? 's' : ''} connected`
                    : "Connect fitness apps"
                  }
                </p>
                <p className="text-sm text-gray-400">
                  {connectedProviders.length > 0 
                    ? connectedProviders.join(", ")
                    : "Strava, Google Fit & more"
                  }
                </p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </div>
        </Card3D>
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {showAddExercise && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddExercise(false)}
            />
            <motion.div
              className="relative w-full max-w-md bg-gray-900 rounded-t-3xl p-6 border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-white mb-4">Add Exercise</h2>
              
              {/* Exercise Type Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {exerciseTypes.map((type) => (
                  <motion.button
                    key={type.type}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedType === type.type
                        ? `bg-gradient-to-br ${type.color} shadow-lg`
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={() => { hapticLight(); setSelectedType(type.type); }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xs text-white">{type.label}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* Duration & Calories */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Calories (optional)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Auto"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button3D
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowAddExercise(false)}
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  fullWidth
                  disabled={!selectedType || !duration}
                  onClick={handleAddExercise}
                >
                  Add Exercise
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavV2 />
    </PageWrapper>
  );
}
