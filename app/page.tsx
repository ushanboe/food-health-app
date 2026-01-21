"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { UnifiedProgressRing, UnifiedProgressLegend } from "@/components/ui/UnifiedProgressRing";
import { Badge } from "@/components/ui/Badge";
import { FloatingNutri } from "@/components/FloatingNutri";
import {
  Camera,
  Utensils,
  TrendingUp,
  Target,
  ChevronRight,
  ChevronLeft,
  ChefHat,
  Droplets,
  Dumbbell,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

// Exercise type icons mapping
const exerciseIcons: Record<string, string> = {
  walking: "🚶",
  running: "🏃",
  cycling: "🚴",
  swimming: "🏊",
  jump_rope: "⏫",
  yoga: "🧘",
  pilates: "🤸",
  stretching: "🙆",
  weight_training: "🏋️",
  bodyweight: "💪",
  crossfit: "🔥",
  hiit: "⚡",
  basketball: "🏀",
  soccer: "⚽",
  tennis: "🎾",
  golf: "⛳",
  hiking: "🥾",
  dancing: "💃",
  martial_arts: "🥋",
  boxing: "🥊",
};

// Activity colors for activity list
const activityColors = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
];

// Format date to YYYY-MM-DD in UTC (matching store's date format)
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get array of last N days using UTC dates (matching store format)
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    days.push(formatDateKey(date));
  }
  return days;
}

// Format date for display
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayStr = formatDateKey(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HomePage() {
  const router = useRouter();
  const { dailyGoals, getDailyTotals, getDailyLog, getDailyFitnessLog, getDailyWaterTotal } = useAppStore();

  // Swipeable days state
  const days = useMemo(() => getLastNDays(7), []);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentDate = days[currentDayIndex];
  const dailyTotals = getDailyTotals(currentDate);
  const dailyLog = getDailyLog(currentDate);
  const fitnessLog = getDailyFitnessLog(currentDate);
  const todayEntries = dailyLog?.meals || [];
  const manualExercises = fitnessLog?.exercises || [];
  const waterTotal = getDailyWaterTotal(currentDate);

  // Synced activities disabled - coming soon

  // Combine manual exercises and synced activities
  const allActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      name: string;
      calories: number;
      duration: number;
      source: 'manual' | 'synced';
      type?: string;
    }> = [];
    
    manualExercises.forEach(e => {
      activities.push({
        id: e.id,
        name: e.exerciseName,
        calories: e.caloriesBurned,
        duration: e.duration,
        source: 'manual',
      });
    });
    
    // Synced activities disabled - coming soon
    
    return activities;
  }, [manualExercises]);

  // Handle swipe
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentDayIndex < days.length - 1) {
      setDirection(1);
      setCurrentDayIndex(prev => prev + 1);
    } else if (info.offset.x < -threshold && currentDayIndex > 0) {
      setDirection(-1);
      setCurrentDayIndex(prev => prev - 1);
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex < days.length - 1) {
      setDirection(1);
      setCurrentDayIndex(prev => prev + 1);
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex > 0) {
      setDirection(-1);
      setCurrentDayIndex(prev => prev - 1);
    }
  };

  // Calculate total exercise stats for the day (combined)
  const totalExerciseCalories = allActivities.reduce((sum, e) => sum + e.calories, 0);
  const totalExerciseDuration = allActivities.reduce((sum, e) => sum + e.duration, 0);

  const quickActions = [
    {
      icon: Camera,
      label: "Scan Food",
      description: "AI-powered",
      color: "bg-emerald-100",
      iconColor: "text-emerald-600",
      route: "/camera",
    },
    {
      icon: Utensils,
      label: "Log Meal",
      description: "Manual entry",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      route: "/diary",
    },
    {
      icon: ChefHat,
      label: "Recipes",
      description: "Browse & create",
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      route: "/recipes",
    },
    {
      icon: Dumbbell,
      label: "Exercise",
      description: "Log activity",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      route: "/fitness",
    },
    {
      icon: Droplets,
      label: "Water",
      description: "Track hydration",
      color: "bg-cyan-100",
      iconColor: "text-cyan-600",
      route: "/water",
    },
    {
      icon: Target,
      label: "Goals",
      description: "Set targets",
      color: "bg-amber-100",
      iconColor: "text-amber-600",
      route: "/goals",
    },
  ];

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <PageContainer>
      <PageHeader useLogo title="FitFork" subtitle="Version 1.1.0" />
      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Swipeable Progress Card */}
          <motion.div variants={fadeUp} className="mb-6">
            {/* Day Navigation Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                onClick={goToPreviousDay}
                disabled={currentDayIndex >= days.length - 1}
                className={`p-2 rounded-full transition-all ${
                  currentDayIndex >= days.length - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 active:scale-95"
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <motion.span
                  key={currentDate}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-semibold text-gray-700"
                >
                  {formatDateLabel(currentDate)}
                </motion.span>
                {/* Day indicator dots */}
                <div className="flex gap-1">
                  {days.slice(0, 5).map((_, idx) => (
                    <motion.div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentDayIndex
                          ? "bg-emerald-500 w-3"
                          : "bg-gray-300"
                      }`}
                      animate={{
                        scale: idx === currentDayIndex ? 1.2 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={goToNextDay}
                disabled={currentDayIndex <= 0}
                className={`p-2 rounded-full transition-all ${
                  currentDayIndex <= 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 active:scale-95"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Swipeable Card Container */}
            <div className="relative overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentDate}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg">
                    {/* Unified Progress Ring */}
                    <div className="flex flex-col items-center">
                      <UnifiedProgressRing
                        calories={Math.round(dailyTotals.calories)}
                        targetCalories={dailyGoals.calories}
                        protein={Math.round(dailyTotals.protein)}
                        carbs={Math.round(dailyTotals.carbs)}
                        fat={Math.round(dailyTotals.fat)}
                        exerciseCalories={totalExerciseCalories}
                        exerciseGoal={dailyGoals.exerciseCalories || 300}
                        exerciseMinutes={totalExerciseDuration}
                        waterMl={waterTotal}
                        waterGoal={dailyGoals.water || 2000}
                        size={260}
                      />
                      
                      {/* Legend */}
                      <UnifiedProgressLegend
                        calories={Math.round(dailyTotals.calories)}
                        targetCalories={dailyGoals.calories}
                        exerciseCalories={totalExerciseCalories}
                        exerciseGoal={dailyGoals.exerciseCalories || 300}
                        exerciseMinutes={totalExerciseDuration}
                        waterMl={waterTotal}
                        waterGoal={dailyGoals.water || 2000}
                        protein={Math.round(dailyTotals.protein)}
                        carbs={Math.round(dailyTotals.carbs)}
                        fat={Math.round(dailyTotals.fat)}
                      />
                    </div>

                    {/* Activity List (if any) */}
                    {allActivities.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {allActivities.slice(0, 4).map((activity, index) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs ${
                                activity.source === 'synced' ? 'bg-orange-50' : 'bg-emerald-50'
                              }`}
                            >
                              <span>{exerciseIcons[activity.type || ''] || "🏃"}</span>
                              <span className="font-medium text-gray-700">{activity.name}</span>
                              <Badge variant="success" size="sm">
                                {activity.calories} cal
                              </Badge>
                              {activity.source === 'synced' && (
                                <span className="text-[10px] text-orange-500">⚡</span>
                              )}
                            </motion.div>
                          ))}
                          {allActivities.length > 4 && (
                            <span className="flex items-center px-2.5 py-1.5 text-xs text-gray-400">
                              +{allActivities.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Swipe Hint */}
                    <div className="flex items-center justify-center mt-4 pt-3 border-t border-gray-100">
                      <motion.p
                        className="text-xs text-gray-400 flex items-center gap-1"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ChevronLeft size={14} />
                        Swipe to view other days
                        <ChevronRight size={14} />
                      </motion.p>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Quick Actions</p>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.label}
                    onClick={() => router.push(action.route)}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    padding="sm"
                  >
                    <div className="flex flex-col items-center text-center gap-2 py-1">
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon size={20} className={action.iconColor} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Meals */}
          {todayEntries.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm text-gray-500 font-medium">Recent Meals</p>
                <button
                  onClick={() => router.push("/diary")}
                  className="text-sm text-emerald-600 font-medium flex items-center gap-1"
                >
                  View all <ChevronRight size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {todayEntries.slice(0, 3).map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      onClick={() => router.push("/diary")}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      padding="sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                            {meal.mealType === 'breakfast' ? '🌅' :
                             meal.mealType === 'lunch' ? '☀️' :
                             meal.mealType === 'dinner' ? '🌙' : '🍎'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{meal.foodName}</p>
                            <p className="text-xs text-gray-500 capitalize">{meal.mealType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{Math.round(meal.calories)} cal</p>
                          <p className="text-xs text-gray-500">
                            P:{Math.round(meal.protein)}g C:{Math.round(meal.carbs)}g F:{Math.round(meal.fat)}g
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Progress Link */}
          <motion.div variants={fadeUp} className="mb-24">
            <Card
              onClick={() => router.push("/progress")}
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-indigo-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">View Progress</p>
                    <p className="text-sm text-gray-500">Track your journey over time</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      <FloatingNutri />
      <BottomNav />
    </PageContainer>
  );
}
