"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  Target,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Check,
  Edit3,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function GoalsPage() {
  const router = useRouter();
  const { dailyGoals, getDailyTotals, updateDailyGoals } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoals, setEditedGoals] = useState(dailyGoals);

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyTotals = getDailyTotals(todayStr);

  const handleSave = () => {
    updateDailyGoals(editedGoals);
    setIsEditing(false);
  };

  const goalItems = [
    {
      key: "calories",
      label: "Calories",
      icon: Flame,
      color: "#10B981",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      unit: "kcal",
      current: dailyTotals.calories,
      target: dailyGoals.calories,
    },
    {
      key: "protein",
      label: "Protein",
      icon: Beef,
      color: "#3B82F6",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      unit: "g",
      current: dailyTotals.protein,
      target: dailyGoals.protein,
    },
    {
      key: "carbs",
      label: "Carbohydrates",
      icon: Wheat,
      color: "#F59E0B",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      unit: "g",
      current: dailyTotals.carbs,
      target: dailyGoals.carbs,
    },
    {
      key: "fat",
      label: "Fat",
      icon: Droplets,
      color: "#EF4444",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      unit: "g",
      current: dailyTotals.fat,
      target: dailyGoals.fat,
    },
  ];

  return (
    <PageContainer>
      <Header
        title="Nutrition Goals"
        showBack
        rightAction={
          isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Check size={20} className="text-emerald-600" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 size={20} className="text-gray-600" />
            </Button>
          )
        }
      />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Summary Card */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Target size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Goals</h2>
                  <p className="text-sm text-gray-500">Track your nutrition targets</p>
                </div>
              </div>
              <div className="flex justify-around">
                {goalItems.map((item) => {
                  const progress = item.target > 0 ? (item.current / item.target) * 100 : 0;
                  return (
                    <div key={item.key} className="text-center">
                      <ProgressRing
                        progress={progress}
                        size={50}
                        strokeWidth={4}
                        color={item.color}
                      >
                        <span className="text-xs font-medium">
                          {Math.round(progress)}%
                        </span>
                      </ProgressRing>
                      <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Goal Items */}
          {goalItems.map((item) => {
            const Icon = item.icon;
            const progress = item.target > 0 ? (item.current / item.target) * 100 : 0;

            return (
              <motion.div key={item.key} variants={fadeUp} className="mb-3">
                <Card>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                      <Icon size={24} className={item.iconColor} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            value={editedGoals[item.key as keyof typeof editedGoals]}
                            onChange={(e) =>
                              setEditedGoals({
                                ...editedGoals,
                                [item.key]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <span className="text-sm text-gray-500">{item.unit}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {Math.round(item.current)} / {item.target} {item.unit}
                        </p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {Math.round(progress)}%
                        </p>
                        <p className="text-xs text-gray-500">complete</p>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}

          {/* Tips */}
          <motion.div variants={fadeUp} className="mt-6">
            <Card className="bg-emerald-50 border border-emerald-100">
              <div className="flex gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-medium text-emerald-900">Tip</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Adjust your goals based on your activity level and health objectives. 
                    Consult a nutritionist for personalized recommendations.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      <BottomNav />
    </PageContainer>
  );
}
