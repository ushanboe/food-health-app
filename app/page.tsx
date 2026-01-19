"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { MacroDonut, FitnessDonut } from "@/components/ui/DonutChart";
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
  Cloud,
  Flame,
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

// Activity colors for donut chart
const activityColors = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
];

// Get array of last N days
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

// Format date for display
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return "Today";
  if (dateStr === yesterday.toISOString().split('T')[0]) return "Yesterday";

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HomePage() {
  const router = useRouter();
  const { dailyGoals, getDailyTotals, getDailyLog, getDailyFitnessLog } = useAppStore();

  // Swipeable days state
  const days = useMemo(() => getLastNDays(7), []);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentDate = days[currentDayIndex];
  const dailyTotals = getDailyTotals(currentDate);
  const dailyLog = getDailyLog(currentDate);
  const fitnessLog = getDailyFitnessLog(currentDate);
  const todayEntries = dailyLog?.meals || [];
  const exercises = fitnessLog?.exercises || [];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

  // Navigate days with buttons
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

  // Calculate total exercise stats for the day
  const totalExerciseCalories = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const totalExerciseDuration = exercises.reduce((sum, e) => sum + e.duration, 0);

  // Prepare fitness activities for donut chart
  const fitnessActivities = exercises.map((e, index) => ({
    name: e.exerciseName,
    calories: e.caloriesBurned,
    duration: e.duration,
    color: activityColors[index % activityColors.length],
  }));

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
      icon: TrendingUp,
      label: "Progress",
      description: "View stats",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      route: "/progress",
    },
    {
      icon: Target,
      label: "Goals",
      description: "Set targets",
      color: "bg-amber-100",
      iconColor: "text-amber-600",
      route: "/goals",
    },
    {
      icon: Cloud,
      label: "Cloud Backup",
      description: "Sync data",
      color: "bg-sky-100",
      iconColor: "text-sky-600",
      route: "/cloud-sync",
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
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gray-500 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">FitFork</h1>
          </motion.div>
        </div>
      </div>

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
                    {/* Two Column Layout for Charts */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Nutrition Donut */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame size={16} className="text-emerald-500" />
                          <span className="text-sm font-semibold text-gray-700">Nutrition</span>
                        </div>
                        <MacroDonut
                          protein={Math.round(dailyTotals.protein)}
                          carbs={Math.round(dailyTotals.carbs)}
                          fat={Math.round(dailyTotals.fat)}
                          calories={Math.round(dailyTotals.calories)}
                          targetCalories={dailyGoals.calories}
                          size={130}
                          className="flex-col"
                        />
                      </div>

                      {/* Fitness Donut */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Dumbbell size={16} className="text-emerald-500" />
                          <span className="text-sm font-semibold text-gray-700">Fitness</span>
                        </div>
                        <FitnessDonut
                          activities={fitnessActivities}
                          totalCalories={totalExerciseCalories}
                          totalDuration={totalExerciseDuration}
                          size={130}
                          className="flex-col"
                        />
                      </div>
                    </div>

                    {/* Activity List (if any) */}
                    {exercises.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {exercises.slice(0, 4).map((exercise, index) => (
                            <motion.div
                              key={exercise.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 text-xs"
                            >
                              <span>{exerciseIcons[exercise.exerciseId] || "🏃"}</span>
                              <span className="font-medium text-gray-700">{exercise.exerciseName}</span>
                              <Badge variant="success" size="sm">
                                {exercise.caloriesBurned} cal
                              </Badge>
                            </motion.div>
                          ))}
                          {exercises.length > 4 && (
                            <span className="flex items-center px-2.5 py-1.5 text-xs text-gray-400">
                              +{exercises.length - 4} more
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
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">Recent Meals</p>
              <button
                onClick={() => router.push("/diary")}
                className="text-sm text-emerald-600 font-medium flex items-center gap-1"
              >
                View all <ChevronRight size={16} />
              </button>
            </div>

            {todayEntries.length === 0 ? (
              <Card
                className="border-2 border-dashed border-gray-200 bg-gray-50/50"
                onClick={() => router.push("/camera")}
              >
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Camera size={32} className="mb-2" />
                  <p className="text-sm font-medium">No meals logged yet</p>
                  <p className="text-xs">Tap to scan your first meal</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {todayEntries.slice(0, 3).map((entry) => (
                  <Card key={entry.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Utensils size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {entry.foodName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.mealType} • {entry.servingSize}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {entry.calories} cal
                        </p>
                        <p className="text-xs text-gray-500">
                          P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {todayEntries.length > 3 && (
                  <button
                    onClick={() => router.push("/diary")}
                    className="w-full text-center text-sm text-emerald-600 font-medium py-2"
                  >
                    View {todayEntries.length - 3} more entries
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageContent>

      <FloatingNutri interval={25} duration={5} position="bottom-left" />

      <BottomNav />
    </PageContainer>
  );
}
