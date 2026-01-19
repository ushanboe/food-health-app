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
import { NutritionRing, ProgressRing } from "@/components/ui/ProgressRing";
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
  Star,
  Flame,
  ChefHat,
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
  const { dailyGoals, getDailyLog, getDailyTotals, removeMealEntry, recipes, addMealEntry } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  const dateKey = selectedDate.toISOString().split("T")[0];
  const dailyLog = getDailyLog(dateKey);
  const totals = getDailyTotals(dateKey);

  // Sort recipes by rating (highest first), then by date
  const sortedRecipes = useMemo(() => {
    return [...(recipes || [])].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [recipes]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getMealEntries = (mealType: string) => {
    return (dailyLog?.meals || []).filter((m) => m.mealType === mealType);
  };

  const getMealCalories = (mealType: string) => {
    return getMealEntries(mealType).reduce((sum, m) => sum + m.calories, 0);
  };

  const progress = dailyGoals.calories > 0 ? (totals.calories / dailyGoals.calories) * 100 : 0;

  // Add recipe as meal entry
  const handleAddRecipe = (recipe: typeof recipes[0]) => {
    if (!selectedMealType) return;

    const nutrition = recipe.ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + (ing.calories || 0),
        protein: acc.protein + (ing.protein || 0),
        carbs: acc.carbs + (ing.carbs || 0),
        fat: acc.fat + (ing.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Per serving
    const servings = recipe.servings || 1;
    const perServing = {
      calories: Math.round(nutrition.calories / servings),
      protein: Math.round(nutrition.protein / servings),
      carbs: Math.round(nutrition.carbs / servings),
      fat: Math.round(nutrition.fat / servings),
    };

    addMealEntry({
      id: `meal-${Date.now()}`,
      mealType: selectedMealType as "breakfast" | "lunch" | "dinner" | "snacks",
      foodName: recipe.name,
      calories: perServing.calories,
      protein: perServing.protein,
      carbs: perServing.carbs,
      fat: perServing.fat,
      servingSize: "1 serving",
      timestamp: new Date(),
    });

    setShowAddSheet(false);
    setSelectedMealType(null);
  };

  return (
    <PageContainer>
      <Header title="Food Diary" showBack />

      <PageContent className="pb-32">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Date Navigation */}
          <motion.div variants={fadeUp}>
            <Card className="!p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    {formatDate(selectedDate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Daily Summary */}
          <motion.div variants={fadeUp}>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Daily Progress</p>
                  <p className="text-3xl font-bold mt-1">
                    {totals.calories.toLocaleString()}
                  </p>
                  <p className="text-emerald-100 text-sm">
                    of {dailyGoals.calories.toLocaleString()} cal
                  </p>
                </div>
                <ProgressRing
                  progress={Math.min(progress, 100)}
                  size={80}
                  strokeWidth={8}
                  color="white"
                  bgColor="rgba(255,255,255,0.2)"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Protein</p>
                  <p className="font-semibold">{totals.protein}g</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Carbs</p>
                  <p className="font-semibold">{totals.carbs}g</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Fat</p>
                  <p className="font-semibold">{totals.fat}g</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Meal Sections */}
          {mealTypes.map((meal) => {
            const entries = getMealEntries(meal.id);
            const mealCalories = getMealCalories(meal.id);
            const Icon = meal.icon;

            return (
              <motion.div key={meal.id} variants={fadeUp}>
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Icon size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {meal.label}
                        </p>
                        <p className="text-xs text-gray-500">{meal.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default">{mealCalories} cal</Badge>
                      <button
                        onClick={() => {
                          setSelectedMealType(meal.id);
                          setShowAddSheet(true);
                        }}
                        className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {entries.length > 0 ? (
                      <motion.div className="space-y-2">
                        {entries.map((entry) => (
                          <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                <Utensils size={16} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {entry.foodName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.servingSize}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium text-gray-900 text-sm">
                                  {entry.calories} cal
                                </p>
                                <p className="text-xs text-gray-500">
                                  P:{entry.protein}g C:{entry.carbs}g F:
                                  {entry.fat}g
                                </p>
                              </div>
                              <button
                                onClick={() => removeMealEntry(dateKey, entry.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-4"
                      >
                        <p className="text-gray-400 text-sm">
                          No entries yet
                        </p>
                        <button
                          onClick={() => {
                            setSelectedMealType(meal.id);
                            setShowAddSheet(true);
                          }}
                          className="text-emerald-600 text-sm font-medium mt-1 hover:underline"
                        >
                          Add {meal.label.toLowerCase()}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </PageContent>

      {/* Add Food Bottom Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setSelectedMealType(null);
        }}
        title={selectedMealType ? `Add to ${mealTypes.find((m) => m.id === selectedMealType)?.label}` : "Add Food"}
      >
        <div className="space-y-4">
          {/* Saved Recipes Section */}
          {sortedRecipes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChefHat size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Saved Recipes</h3>
                <span className="text-xs text-gray-500">({sortedRecipes.length})</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {sortedRecipes.map((recipe) => {
                  const nutrition = recipe.ingredients.reduce(
                    (acc, ing) => ({
                      calories: acc.calories + (ing.calories || 0),
                    }),
                    { calories: 0 }
                  );
                  const perServing = Math.round(nutrition.calories / (recipe.servings || 1));

                  return (
                    <motion.div
                      key={recipe.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddRecipe(recipe)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors"
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <ChefHat size={20} className="text-emerald-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {recipe.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Flame size={12} />
                            {perServing} cal/serving
                          </span>
                          {recipe.rating && recipe.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star size={12} fill="currentColor" />
                              {recipe.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <Plus size={18} className="text-emerald-500" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {sortedRecipes.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Other Options */}
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
        </div>
      </BottomSheet>

      <FloatingNutri interval={25} duration={5} position="bottom-left" />

      <BottomNav />
    </PageContainer>
  );
}
