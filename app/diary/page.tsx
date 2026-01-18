"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { NutritionRing } from "@/components/ui/ProgressRing";
import { FloatingNutri } from "@/components/FloatingNutri";
import {
  Plus,
  Camera,
  Search,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Utensils,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const mealTypes = [
  { id: "breakfast", label: "Breakfast", icon: Coffee, time: "6am - 10am" },
  { id: "lunch", label: "Lunch", icon: Sun, time: "11am - 2pm" },
  { id: "dinner", label: "Dinner", icon: Sunset, time: "5pm - 9pm" },
  { id: "snack", label: "Snacks", icon: Moon, time: "Anytime" },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DiaryPage() {
  const router = useRouter();
  const { dailyGoals, getDailyLog, getDailyTotals, removeMealEntry } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const dailyLog = getDailyLog(dateStr);
  const dailyTotals = getDailyTotals(dateStr);
  const meals = dailyLog?.meals || [];

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getMealEntries = (mealType: string) => {
    return meals.filter((m) => m.mealType === mealType);
  };

  const getMealCalories = (mealType: string) => {
    return getMealEntries(mealType).reduce((sum, m) => sum + (m.calories || 0), 0);
  };

  const caloriesRemaining = dailyGoals.calories - dailyTotals.calories;

  return (
    <PageContainer>
      <Header title="Food Diary" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Date Navigation */}
          <motion.div variants={fadeUp} className="mb-4">
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <span className="font-semibold text-gray-900">{formatDate(selectedDate)}</span>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={selectedDate.toDateString() === new Date().toDateString()}
              >
                <ChevronRight
                  size={20}
                  className={selectedDate.toDateString() === new Date().toDateString() ? "text-gray-300" : "text-gray-600"}
                />
              </button>
            </div>
          </motion.div>

          {/* Daily Summary */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Calories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(dailyTotals.calories)}
                    <span className="text-base font-normal text-gray-400"> / {dailyGoals.calories}</span>
                  </p>
                  <p className={`text-sm mt-1 ${caloriesRemaining >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {caloriesRemaining >= 0 ? `${Math.round(caloriesRemaining)} remaining` : `${Math.round(Math.abs(caloriesRemaining))} over`}
                  </p>
                </div>
                <NutritionRing
                  current={dailyTotals.calories}
                  target={dailyGoals.calories}
                  label=""
                  size="lg"
                  color="#10B981"
                />
              </div>

              {/* Macro Summary */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Protein</p>
                  <p className="font-semibold text-gray-900">{Math.round(dailyTotals.protein)}g</p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.protein}g</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Carbs</p>
                  <p className="font-semibold text-gray-900">{Math.round(dailyTotals.carbs)}g</p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.carbs}g</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Fat</p>
                  <p className="font-semibold text-gray-900">{Math.round(dailyTotals.fat)}g</p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.fat}g</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Meal Sections */}
          {mealTypes.map((meal) => {
            const Icon = meal.icon;
            const entries = getMealEntries(meal.id);
            const calories = getMealCalories(meal.id);

            return (
              <motion.div key={meal.id} variants={fadeUp} className="mb-3">
                <Card>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      setSelectedMealType(meal.id);
                      setShowAddSheet(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Icon size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{meal.label}</p>
                        <p className="text-xs text-gray-500">{meal.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {calories > 0 && (
                        <Badge variant="default">{calories} cal</Badge>
                      )}
                      <Plus size={20} className="text-emerald-500" />
                    </div>
                  </div>

                  {/* Meal Entries */}
                  {entries.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {entries.map((entry, index) => (
                        <div
                          key={entry.id || index}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <Utensils size={16} className="text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.foodName || "Food Entry"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.servingSize || "1 serving"} • {entry.calories} cal
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (entry.id) removeMealEntry(dateStr, entry.id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}

          {/* Empty State */}
          {meals.length === 0 && (
            <motion.div variants={fadeUp}>
              <EmptyState
                icon={<Utensils size={32} />}
                title="No meals logged"
                description="Start tracking your nutrition by adding your first meal"
                action={{
                  label: "Add Food",
                  onClick: () => setShowAddSheet(true),
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </PageContent>

      {/* Add Food Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setSelectedMealType(null);
        }}
        title={selectedMealType ? `Add to ${mealTypes.find((m) => m.id === selectedMealType)?.label}` : "Add Food"}
      >
        <div className="space-y-3">
          <Card
            onClick={() => {
              setShowAddSheet(false);
              router.push("/camera");
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Camera size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Scan with Camera</p>
                <p className="text-sm text-gray-500">AI-powered food recognition</p>
              </div>
              <Sparkles size={20} className="ml-auto text-emerald-500" />
            </div>
          </Card>

          <Card
            onClick={() => {
              setShowAddSheet(false);
              router.push("/diary/search");
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Search size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Search Food</p>
                <p className="text-sm text-gray-500">Browse food database</p>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => {
              setShowAddSheet(false);
              router.push("/diary/manual");
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Plus size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manual Entry</p>
                <p className="text-sm text-gray-500">Enter nutrition manually</p>
              </div>
            </div>
          </Card>
        </div>
      </BottomSheet>

      <FloatingNutri interval={25} duration={5} position="bottom-left" />

      <BottomNav />
    </PageContainer>
  );
}
