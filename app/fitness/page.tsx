"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore, EXERCISE_TYPES, ExerciseCategory } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import SyncedActivities from "@/components/fitness/SyncedActivities";
import { FloatingNutri } from "@/components/FloatingNutri";
import {
  Activity,
  Flame,
  Footprints,
  Timer,
  Plus,
  X,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function FitnessPage() {
  const router = useRouter();
  const {
    getDailyFitnessLog,
    getDailyCaloriesBurned,
    addExerciseEntry,
    removeExerciseEntry,
    userStats,
  } = useAppStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [duration, setDuration] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const fitnessLog = getDailyFitnessLog(todayStr);
  const caloriesBurned = getDailyCaloriesBurned(todayStr);
  const exercises = fitnessLog?.exercises || [];
  const steps = fitnessLog?.steps || 0;

  const stepsGoal = 10000;
  const caloriesGoal = 500;
  const activeMinutesGoal = 30;
  const activeMinutes = exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

  const handleAddExercise = () => {
    if (selectedExercise && duration) {
      const exerciseType = EXERCISE_TYPES.find((e) => e.id === selectedExercise);
      const durationMins = parseInt(duration);
      const weight = userStats.currentWeight || 70;
      const calories = Math.round((exerciseType?.metValue || 4) * weight * (durationMins / 60));

      addExerciseEntry({
        id: Date.now().toString(),
        date: todayStr,
        exerciseId: selectedExercise,
        exerciseName: exerciseType?.name || "Exercise",
        category: (exerciseType?.category || "cardio") as ExerciseCategory,
        duration: durationMins,
        caloriesBurned: calories,
        intensity: "moderate",
        timestamp: new Date(),
      });

      setSelectedExercise(null);
      setDuration("");
      setShowAddSheet(false);
    }
  };

  const stats = [
    {
      label: "Steps",
      value: steps.toLocaleString(),
      target: stepsGoal,
      current: steps,
      icon: Footprints,
      color: "#3B82F6",
    },
    {
      label: "Calories",
      value: Math.round(caloriesBurned).toString(),
      target: caloriesGoal,
      current: caloriesBurned,
      icon: Flame,
      color: "#EF4444",
    },
    {
      label: "Active",
      value: `${activeMinutes}m`,
      target: activeMinutesGoal,
      current: activeMinutes,
      icon: Timer,
      color: "#10B981",
    },
  ];

  return (
    <PageContainer>
      <Header title="Fitness" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Stats Cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const progress = stat.target > 0 ? (stat.current / stat.target) * 100 : 0;
              return (
                <Card key={stat.label} className="text-center py-4">
                  <ProgressRing
                    progress={progress}
                    size={48}
                    strokeWidth={4}
                    color={stat.color}
                  >
                    <Icon size={18} style={{ color: stat.color }} />
                  </ProgressRing>
                  <p className="text-lg font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </Card>
              );
            })}
          </motion.div>

          {/* Today's Activities */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">Today's Activities</p>
              <button
                onClick={() => setShowAddSheet(true)}
                className="text-sm text-emerald-600 font-medium"
              >
                + Add
              </button>
            </div>

            {exercises.length === 0 ? (
              <Card
                padding="sm"
                className="border-2 border-dashed border-gray-200 bg-gray-50/50"
                onClick={() => setShowAddSheet(true)}
              >
                <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                  <Plus size={18} />
                  <span className="text-sm">Log your first activity</span>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {exercises.map((exercise) => {
                  const exerciseType = EXERCISE_TYPES.find((e) => e.id === exercise.exerciseId);
                  return (
                    <Card key={exercise.id} padding="sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                          {exerciseType?.icon || "⚡"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{exercise.exerciseName}</p>
                          <p className="text-sm text-gray-500">
                            {exercise.duration} min • {exercise.caloriesBurned} cal
                          </p>
                        </div>
                        <button
                          onClick={() => removeExerciseEntry(todayStr, exercise.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Synced Activities */}
          <motion.div variants={fadeUp}>
            <SyncedActivities date={todayStr} />
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Add Exercise Sheet */}
      {showAddSheet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddSheet(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Activity</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-3">Activity Type</p>
                  <div className="grid grid-cols-4 gap-2">
                    {EXERCISE_TYPES.slice(0, 8).map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => setSelectedExercise(exercise.id)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          selectedExercise === exercise.id
                            ? "bg-emerald-100 ring-2 ring-emerald-500"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{exercise.icon}</span>
                        <span className="text-xs text-gray-600">{exercise.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedExercise && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <p className="text-sm text-gray-500 font-medium mb-2">Duration (minutes)</p>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="30"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </motion.div>
                )}

                <Button
                  fullWidth
                  onClick={handleAddExercise}
                  disabled={!selectedExercise || !duration}
                >
                  Log Activity
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Add Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg flex items-center justify-center text-white"
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddSheet(true)}
      >
        <Plus size={28} />
      </motion.button>

      <FloatingNutri interval={30} duration={5} position="bottom-left" />

      <BottomNav />
    </PageContainer>
  );
}
