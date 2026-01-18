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
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  const dateStr = selectedDate.toISOString().split('T')[0];
  const dailyLog = getDailyLog(dateStr);
  const dailyTotals = getDailyTotals(dateStr);
  const todayEntries = dailyLog?.meals || [];

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getMealEntries = (mealType: string) => {
    return todayEntries.filter(
      (entry) => entry.mealType?.toLowerCase() === mealType.toLowerCase()
    );
  };

  const getMealCalories = (mealType: string) => {
    return getMealEntries(mealType).reduce((sum, entry) => sum + (entry.calories || 0), 0);
  };

  return (
    <PageContainer>
      {/* Header with Date Navigation */}
      <div className="bg-white sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </motion.button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">{formatDate(selectedDate)}</h1>
              <p className="text-sm text-gray-500">
                {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl hover:bg-gray-100"
              disabled={selectedDate.toDateString() === new Date().toDateString()}
            >
              <ChevronRight size={24} className={selectedDate.toDateString() === new Date().toDateString() ? "text-gray-300" : "text-gray-600"} />
            </motion.button>
          </div>
        </div>
      </div>

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Nutrition Summary */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6">
              <p className="text-sm text-gray-500 font-medium mb-4">Daily Summary</p>
              <div className="flex justify-around">
                <NutritionRing
                  current={dailyTotals.calories}
                  target={dailyGoals.calories}
                  label="Calories"
                  unit=""
                  color="#10B981"
                />
                <NutritionRing
                  current={dailyTotals.protein}
                  target={dailyGoals.protein}
                  label="Protein"
                  color="#3B82F6"
                />
                <NutritionRing
                  current={dailyTotals.carbs}
                  target={dailyGoals.carbs}
                  label="Carbs"
                  color="#F59E0B"
                />
                <NutritionRing
                  current={dailyTotals.fat}
                  target={dailyGoals.fat}
                  label="Fat"
                  color="#EF4444"
                />
              </div>
            </Card>
          </motion.div>

          {/* Meal Sections */}
          {mealTypes.map((meal) => {
            const entries = getMealEntries(meal.id);
            const calories = getMealCalories(meal.id);
            const Icon = meal.icon;

            return (
              <motion.div key={meal.id} variants={fadeUp} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{meal.label}</span>
                    {calories > 0 && (
                      <Badge variant="default">{calories} cal</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMeal(meal.id);
                      setShowAddSheet(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={20} className="text-emerald-600" />
                  </button>
                </div>

                {entries.length === 0 ? (
                  <Card
                    padding="sm"
                    className="border-2 border-dashed border-gray-200 bg-gray-50/50"
                    onClick={() => {
                      setSelectedMeal(meal.id);
                      setShowAddSheet(true);
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 py-3 text-gray-400">
                      <Plus size={18} />
                      <span className="text-sm">Add {meal.label.toLowerCase()}</span>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry, index) => (
                      <Card key={entry.id || index} padding="sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Utensils size={18} className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {entry.foodName || "Food Entry"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {entry.servingSize || "1 serving"} • {entry.calories} cal
                            </p>
                          </div>
                          <button
                            onClick={() => entry.id && removeMealEntry(dateStr, entry.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </PageContent>

      {/* Floating Add Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg flex items-center justify-center text-white"
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddSheet(true)}
      >
        <Plus size={28} />
      </motion.button>

      {/* Add Food Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setSelectedMeal(null);
        }}
        title={selectedMeal ? `Add ${selectedMeal}` : "Add Food"}
      >
        <div className="space-y-3">
          <Card
            onClick={() => {
              setShowAddSheet(false);
              router.push("/diary/scan");
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

      <BottomNav />
    </PageContainer>
  );
}
