"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { NutritionRing } from "@/components/ui/ProgressRing";
import { Badge } from "@/components/ui/Badge";
import { FloatingNutri } from "@/components/FloatingNutri";
import {
  Camera,
  Utensils,
  TrendingUp,
  Target,
  ChevronRight,
  Sparkles,
  Flame,
  Droplets,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function HomePage() {
  const router = useRouter();
  const { dailyGoals, getDailyTotals, getDailyLog } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyTotals = getDailyTotals(todayStr);
  const dailyLog = getDailyLog(todayStr);
  const todayEntries = dailyLog?.meals || [];

  const calorieProgress = dailyGoals.calories > 0
    ? (dailyTotals.calories / dailyGoals.calories) * 100
    : 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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
  ];

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
          {/* Calorie Summary Card */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Today's Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(dailyTotals.calories)}
                    <span className="text-base font-normal text-gray-400"> / {dailyGoals.calories} cal</span>
                  </p>
                </div>
                <div className="relative">
                  <NutritionRing
                    current={dailyTotals.calories}
                    target={dailyGoals.calories}
                    label=""
                    size="lg"
                    color="#10B981"
                  />
                </div>
              </div>

              {/* Macro Progress */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame size={14} className="text-blue-500" />
                    <span className="text-xs text-gray-500">Protein</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {Math.round(dailyTotals.protein)}g
                  </p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.protein}g</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs text-gray-500">Carbs</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {Math.round(dailyTotals.carbs)}g
                  </p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.carbs}g</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Droplets size={14} className="text-red-500" />
                    <span className="text-xs text-gray-500">Fat</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {Math.round(dailyTotals.fat)}g
                  </p>
                  <p className="text-xs text-gray-400">/ {dailyGoals.fat}g</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.label}
                    onClick={() => router.push(action.route)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon size={20} className={action.iconColor} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action.label}</p>
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
                  <p className="text-sm">No meals logged today</p>
                  <p className="text-xs mt-1">Tap to scan your first meal</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {todayEntries.slice(0, 3).map((entry, index) => (
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
                          {entry.mealType} • {entry.calories} cal
                        </p>
                      </div>
                      <Badge variant="default">{entry.calories} cal</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Floating Nutri Mascot */}
      <FloatingNutri interval={20} duration={6} position="bottom-left" />

      <BottomNav />
    </PageContainer>
  );
}
