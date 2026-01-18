"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, MealType, MealEntry, getTodayString } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  PageWrapper,
  Card3D,
  Button3D,
  SectionHeader,
  ProgressRing3D,
  BottomNavV2,
  Header,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticWarning,
} from "@/components/ui";

const mealConfig: { type: MealType; label: string; icon: string; timeHint: string; color: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅", timeHint: "6am - 10am", color: "from-amber-500 to-orange-500" },
  { type: "lunch", label: "Lunch", icon: "☀️", timeHint: "11am - 2pm", color: "from-yellow-500 to-amber-500" },
  { type: "dinner", label: "Dinner", icon: "🌙", timeHint: "5pm - 9pm", color: "from-indigo-500 to-purple-500" },
  { type: "snacks", label: "Snacks", icon: "🍿", timeHint: "Anytime", color: "from-pink-500 to-rose-500" },
];

export default function DiaryPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [mounted, setMounted] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);

  const { dailyGoals, dailyLogs, removeMealEntry } = useAppStore();

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

  const currentLog = dailyLogs.find((log) => log.date === selectedDate);
  const meals = currentLog?.meals || [];

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getMealsByType = (type: MealType) => meals.filter((m) => m.mealType === type);

  const changeDate = (days: number) => {
    hapticLight();
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

  const calorieGoal = dailyGoals?.calories || 2000;
  const proteinGoal = dailyGoals?.protein || 150;
  const carbsGoal = dailyGoals?.carbs || 250;
  const fatGoal = dailyGoals?.fat || 65;
  const calorieProgress = Math.min((totals.calories / calorieGoal) * 100, 100);

  const handleDeleteMeal = (mealId: string) => {
    hapticWarning();
    removeMealEntry(selectedDate, mealId);
  };

  const toggleMealExpand = (type: MealType) => {
    hapticLight();
    setExpandedMeal(expandedMeal === type ? null : type);
  };

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header with Date Selector */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-4">
            📔 Food Diary
          </h1>
          
          {/* Date Selector */}
          <Card3D variant="glass" noPadding>
            <div className="flex items-center justify-between p-3">
              <motion.button
                onClick={() => changeDate(-1)}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ←
              </motion.button>
              <div className="text-center">
                <span className="font-semibold text-lg text-white">{formatDate(selectedDate)}</span>
                <p className="text-xs text-gray-400">{meals.length} items logged</p>
              </div>
              <motion.button
                onClick={() => changeDate(1)}
                disabled={isToday}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isToday ? 'opacity-30 bg-white/5' : 'bg-white/10'}`}
                whileHover={!isToday ? { scale: 1.1 } : {}}
                whileTap={!isToday ? { scale: 0.9 } : {}}
              >
                →
              </motion.button>
            </div>
          </Card3D>
        </motion.div>

        {/* Daily Summary Card */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="mb-6"
        >
          <Card3D variant="luxury" glowColor="rgba(168, 85, 247, 0.3)">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ProgressRing3D
                  progress={calorieProgress}
                  size={140}
                  strokeWidth={12}
                  color="purple"
                  value={`${totals.calories}`}
                  label={`of ${calorieGoal} kcal`}
                />
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex justify-center">
                    <ProgressRing3D
                      progress={(totals.protein / proteinGoal) * 100}
                      size={50}
                      strokeWidth={4}
                      color="blue"
                      showPercentage={false}
                      icon="🥩"
                    />
                  </div>
                  <p className="text-white font-semibold mt-1">{Math.round(totals.protein)}g</p>
                  <p className="text-gray-500 text-xs">Protein</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    <ProgressRing3D
                      progress={(totals.carbs / carbsGoal) * 100}
                      size={50}
                      strokeWidth={4}
                      color="gold"
                      showPercentage={false}
                      icon="🍞"
                    />
                  </div>
                  <p className="text-white font-semibold mt-1">{Math.round(totals.carbs)}g</p>
                  <p className="text-gray-500 text-xs">Carbs</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    <ProgressRing3D
                      progress={(totals.fat / fatGoal) * 100}
                      size={50}
                      strokeWidth={4}
                      color="pink"
                      showPercentage={false}
                      icon="🥑"
                    />
                  </div>
                  <p className="text-white font-semibold mt-1">{Math.round(totals.fat)}g</p>
                  <p className="text-gray-500 text-xs">Fat</p>
                </div>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Meal Sections */}
        <div className="space-y-4">
          {mealConfig.map((meal, index) => {
            const mealItems = getMealsByType(meal.type);
            const mealCalories = mealItems.reduce((sum, m) => sum + (m.calories || 0), 0);
            const isExpanded = expandedMeal === meal.type;

            return (
              <motion.div
                key={meal.type}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
              >
                <Card3D
                  variant="glass"
                  intensity="subtle"
                  noPadding
                  onClick={() => toggleMealExpand(meal.type)}
                >
                  <div className="p-4">
                    {/* Meal Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meal.color} flex items-center justify-center text-2xl shadow-lg`}>
                          {meal.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{meal.label}</h3>
                          <p className="text-xs text-gray-400">{meal.timeHint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{mealCalories} kcal</p>
                        <p className="text-xs text-gray-400">{mealItems.length} items</p>
                      </div>
                    </div>

                    {/* Expanded Meal Items */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {mealItems.length === 0 ? (
                              <p className="text-gray-500 text-center py-4">No items logged</p>
                            ) : (
                              mealItems.map((item) => (
                                <motion.div
                                  key={item.id}
                                  className="flex items-center justify-between bg-white/5 rounded-xl p-3"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  layout
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-white">{item.foodName}</p>
                                    <p className="text-xs text-gray-400">
                                      {item.calories} kcal • P:{item.protein}g • C:{item.carbs}g • F:{item.fat}g
                                    </p>
                                  </div>
                                  <motion.button
                                    onClick={() => {
                                      handleDeleteMeal(item.id);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    ×
                                  </motion.button>
                                </motion.div>
                              ))
                            )}

                            {/* Add Food Button */}
                            <Button3D
                              variant="secondary"
                              size="sm"
                              fullWidth
                              icon="+"
                              onClick={() => {
                                hapticMedium();
                                router.push(`/camera?meal=${meal.type}`);
                              }}
                            >
                              Add {meal.label}
                            </Button3D>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card3D>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Add Button */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button3D
            variant="primary"
            size="lg"
            fullWidth
            icon="📸"
            onClick={() => router.push('/camera')}
          >
            Scan Food
          </Button3D>
        </motion.div>
      </div>

      <BottomNavV2 />
    </PageWrapper>
  );
}
