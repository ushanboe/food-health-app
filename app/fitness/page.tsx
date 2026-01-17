"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Flame, Footprints, Clock, Dumbbell,
  Heart, Zap, X, Check, ChevronRight, TrendingUp,
  Activity, Target, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, EXERCISE_TYPES, calculateCaloriesBurned, ExerciseEntry, ExerciseCategory } from '@/lib/store';
import { FitnessActivity } from '@/lib/fitness-sync/types';
import BottomNav from '@/components/BottomNav';
import SyncedActivities from '@/components/fitness/SyncedActivities';

const getTodayString = () => new Date().toISOString().split('T')[0];

const categoryColors: Record<ExerciseCategory, string> = {
  cardio: 'bg-red-500',
  strength: 'bg-blue-500',
  flexibility: 'bg-purple-500',
  sports: 'bg-green-500',
  daily: 'bg-yellow-500',
};

const categoryLabels: Record<ExerciseCategory, string> = {
  cardio: 'Cardio',
  strength: 'Strength',
  flexibility: 'Flexibility',
  sports: 'Sports',
  daily: 'Daily Activities',
};

export default function FitnessPage() {
  const router = useRouter();
  const {
    userStats, dailyGoals, fitnessLogs,
    addExerciseEntry, removeExerciseEntry, updateSteps,
    getDailyFitnessLog, getDailyCaloriesBurned, getDailyTotals, getNetCalories
  } = useAppStore();

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');
  const [notes, setNotes] = useState('');
  const [steps, setSteps] = useState('');
  const [showStepsInput, setShowStepsInput] = useState(false);

  const today = getTodayString();
  const todayLog = getDailyFitnessLog(today);
  const caloriesBurned = getDailyCaloriesBurned(today);
  const caloriesConsumed = getDailyTotals(today).calories;
  const netCalories = getNetCalories(today);
  const currentSteps = todayLog?.steps || 0;

  const filteredExercises = selectedCategory === 'all'
    ? EXERCISE_TYPES
    : EXERCISE_TYPES.filter(e => e.category === selectedCategory);

  const selectedExerciseData = EXERCISE_TYPES.find(e => e.id === selectedExercise);
  const previewCalories = selectedExerciseData
    ? calculateCaloriesBurned(selectedExerciseData.metValue, userStats.currentWeight, duration, intensity)
    : 0;

  const handleAddExercise = () => {
    if (!selectedExerciseData) return;

    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      exerciseId: selectedExerciseData.id,
      exerciseName: selectedExerciseData.name,
      category: selectedExerciseData.category,
      duration,
      caloriesBurned: previewCalories,
      intensity,
      notes: notes || undefined,
      timestamp: new Date(),
      date: today,
    };

    addExerciseEntry(entry);
    setShowAddExercise(false);
    setSelectedExercise(null);
    setDuration(30);
    setIntensity('moderate');
    setNotes('');
  };

  const handleUpdateSteps = () => {
    const stepsNum = parseInt(steps);
    if (!isNaN(stepsNum) && stepsNum >= 0) {
      updateSteps(today, stepsNum);
      setShowStepsInput(false);
      setSteps('');
    }
  };

  // Handle importing activity from external fitness providers
  const handleImportActivity = (activity: FitnessActivity) => {
    const entry: ExerciseEntry = {
      id: `imported-${activity.id}`,
      exerciseId: activity.type.toLowerCase().replace(/\s+/g, '-'),
      exerciseName: activity.name,
      category: mapActivityTypeToCategory(activity.type),
      duration: Math.round(activity.duration),
      caloriesBurned: activity.calories || Math.round(activity.duration * 5),
      intensity: 'moderate',
      notes: `Imported from ${activity.source}`,
      timestamp: new Date(activity.startTime),
      date: new Date(activity.startTime).toISOString().split('T')[0],
    };
    addExerciseEntry(entry);
  };

  // Map external activity types to our categories
  const mapActivityTypeToCategory = (type: string): ExerciseCategory => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('run') || lowerType.includes('walk') || lowerType.includes('cycling') || lowerType.includes('swim')) {
      return 'cardio';
    }
    if (lowerType.includes('weight') || lowerType.includes('strength')) {
      return 'strength';
    }
    if (lowerType.includes('yoga') || lowerType.includes('stretch')) {
      return 'flexibility';
    }
    if (lowerType.includes('soccer') || lowerType.includes('basketball') || lowerType.includes('tennis')) {
      return 'sports';
    }
    return 'cardio'; // Default
  };

  const stepCalories = Math.round(currentSteps * 0.04);
  const exerciseCalories = caloriesBurned - stepCalories;
  const totalActiveMinutes = todayLog?.exercises.reduce((sum, e) => sum + e.duration, 0) || 0;

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-black text-white">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-900/50 to-black p-6 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Fitness Tracker</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} />
              <span className="text-sm opacity-80">Burned</span>
            </div>
            <p className="text-3xl font-bold">{caloriesBurned}</p>
            <p className="text-xs opacity-70">calories</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-4"
            onClick={() => setShowStepsInput(true)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Footprints size={20} />
              <span className="text-sm opacity-80">Steps</span>
            </div>
            <p className="text-3xl font-bold">{currentSteps.toLocaleString()}</p>
            <p className="text-xs opacity-70">tap to update</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-purple-400" />
              <span className="text-sm opacity-80">Active</span>
            </div>
            <p className="text-2xl font-bold">{totalActiveMinutes}</p>
            <p className="text-xs opacity-70">minutes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={20} className="text-green-400" />
              <span className="text-sm opacity-80">Net Cal</span>
            </div>
            <p className={`text-2xl font-bold ${netCalories > dailyGoals.calories ? 'text-red-400' : 'text-green-400'}`}>
              {netCalories}
            </p>
            <p className="text-xs opacity-70">eaten - burned</p>
          </motion.div>
        </div>
      </div>
            {/* Synced Activities from External Providers */}
            <SyncedActivities 
              date={today} 
              onImportActivity={handleImportActivity}
            />


      {/* Today's Exercises */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Activities</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddExercise(true)}
            className="bg-orange-500 p-2 rounded-full"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        {todayLog?.exercises.length === 0 || !todayLog ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl p-8 text-center"
          >
            <Activity size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-2">No exercises logged today</p>
            <button
              onClick={() => setShowAddExercise(true)}
              className="text-orange-400 font-medium"
            >
              Add your first workout
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {todayLog.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 ${categoryColors[exercise.category]} rounded-xl flex items-center justify-center text-2xl`}>
                  {EXERCISE_TYPES.find(e => e.id === exercise.exerciseId)?.icon || '🏃'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{exercise.exerciseName}</p>
                  <p className="text-sm text-gray-400">
                    {exercise.duration} min • {exercise.intensity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-400">{exercise.caloriesBurned}</p>
                  <p className="text-xs text-gray-500">cal</p>
                </div>
                <button
                  onClick={() => removeExerciseEntry(today, exercise.id)}
                  className="p-2 text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {(exerciseCalories > 0 || stepCalories > 0) && (
          <div className="mt-6 bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Calorie Breakdown</h3>
            <div className="space-y-2">
              {exerciseCalories > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">🏋️ Exercises</span>
                  <span className="font-medium">{exerciseCalories} cal</span>
                </div>
              )}
              {stepCalories > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">👟 Steps ({currentSteps.toLocaleString()})</span>
                  <span className="font-medium">{stepCalories} cal</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span>Total Burned</span>
                <span className="text-orange-400">{caloriesBurned} cal</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {showAddExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => setShowAddExercise(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add Exercise</h2>
                <button onClick={() => setShowAddExercise(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === 'all' ? 'bg-orange-500' : 'bg-white/10'
                  }`}
                >
                  All
                </button>
                {(Object.keys(categoryLabels) as ExerciseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === cat ? categoryColors[cat] : 'bg-white/10'
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>

              {/* Exercise List */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {filteredExercises.map((exercise) => (
                  <motion.button
                    key={exercise.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedExercise(exercise.id);
                      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                    }}
                    className={`p-3 rounded-xl text-center transition-colors ${
                      selectedExercise === exercise.id
                        ? 'bg-orange-500'
                        : 'bg-white/10'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{exercise.icon}</span>
                    <span className="text-xs">{exercise.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Duration & Intensity */}
              {selectedExercise && (
                <motion.div ref={formRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Duration (minutes)</label>
                    <div className="flex gap-2">
                      {[15, 30, 45, 60, 90].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                            duration === d ? 'bg-orange-500' : 'bg-white/10'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="180"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full mt-2 accent-orange-500"
                    />
                    <p className="text-center text-sm text-gray-400">{duration} minutes</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Intensity</label>
                    <div className="flex gap-2">
                      {(['light', 'moderate', 'vigorous'] as const).map((i) => (
                        <button
                          key={i}
                          onClick={() => setIntensity(i)}
                          className={`flex-1 py-3 rounded-lg text-sm font-medium capitalize ${
                            intensity === i ? 'bg-orange-500' : 'bg-white/10'
                          }`}
                        >
                          {i === 'light' && '🚶'}
                          {i === 'moderate' && '🏃'}
                          {i === 'vigorous' && '🔥'}
                          <br />{i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Notes (optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Morning run in the park"
                      className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-orange-500"
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-orange-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-orange-300 mb-1">Estimated Calories Burned</p>
                    <p className="text-4xl font-bold text-orange-400">{previewCalories}</p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddExercise}
                    className="w-full bg-orange-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <Check size={24} />
                    Add Exercise
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps Input Modal */}
      <AnimatePresence>
        {showStepsInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStepsInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 w-full max-w-sm rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 text-center">Update Steps</h3>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder={currentSteps.toString()}
                className="w-full bg-white/10 rounded-xl px-4 py-4 text-center text-2xl font-bold outline-none focus:ring-2 ring-blue-500 mb-4"
                autoFocus
              />
              <p className="text-center text-sm text-gray-400 mb-4">
                ≈ {Math.round(parseInt(steps || '0') * 0.04)} calories
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStepsInput(false)}
                  className="flex-1 bg-white/10 py-3 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSteps}
                  className="flex-1 bg-blue-500 py-3 rounded-xl font-medium"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>

      {/* Fixed Bottom Nav */}
      <BottomNav />
    </div>
  );
}
