"use client";

import { motion } from "framer-motion";
import { Flame, Beef, Wheat, Droplets, Cookie, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

// Accept a more flexible nutrition type
interface NutritionInput {
  foodName?: string;
  calories: number;
  protein: number;
  carbs?: number;
  carbohydrates?: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  nutriScore?: string;
  novaGroup?: number;
  source?: string;
  brandName?: string;
}

interface NutritionCardProps {
  nutrition: NutritionInput;
  className?: string;
}

interface MacroItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
  dailyValue?: number;
}

function MacroItem({ icon, label, value, unit, color, dailyValue }: MacroItemProps) {
  const safeValue = value ?? 0;
  const percentage = dailyValue ? Math.min((safeValue / dailyValue) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2", color)}>
        {icon}
      </div>
      <span className="text-lg font-bold text-gray-800">
        {safeValue.toFixed(1)}
        <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
      {dailyValue && (
        <div className="w-full mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn("h-full rounded-full", color.replace("/20", ""))}
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5">{percentage.toFixed(0)}% DV</span>
        </div>
      )}
    </div>
  );
}

export function NutritionCard({ nutrition, className }: NutritionCardProps) {
  // Handle both carbs and carbohydrates field names
  const carbs = nutrition.carbs ?? nutrition.carbohydrates ?? 0;
  const fiber = nutrition.fiber ?? 0;
  const sugar = nutrition.sugar ?? 0;
  const calories = nutrition.calories ?? 0;
  const protein = nutrition.protein ?? 0;
  const fat = nutrition.fat ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("bg-gradient-to-br from-white to-green-50/50 rounded-3xl p-5 shadow-lg", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Nutrition Facts</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {nutrition.servingSize || "per 100g"}
        </span>
      </div>

      {/* Calories highlight */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <div className="text-center text-white">
              <Flame className="w-6 h-6 mx-auto mb-1" />
              <span className="text-2xl font-bold">{Math.round(calories)}</span>
              <span className="text-xs block">kcal</span>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            <span className="text-xs font-bold text-orange-500">
              {Math.round((calories / 2000) * 100)}%
            </span>
          </motion.div>
        </div>
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MacroItem
          icon={<Beef className="w-5 h-5 text-red-600" />}
          label="Protein"
          value={protein}
          unit="g"
          color="bg-red-100"
          dailyValue={50}
        />
        <MacroItem
          icon={<Wheat className="w-5 h-5 text-amber-600" />}
          label="Carbs"
          value={carbs}
          unit="g"
          color="bg-amber-100"
          dailyValue={300}
        />
        <MacroItem
          icon={<Droplets className="w-5 h-5 text-yellow-600" />}
          label="Fat"
          value={fat}
          unit="g"
          color="bg-yellow-100"
          dailyValue={65}
        />
      </div>

      {/* Additional nutrients */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 bg-white/70 rounded-xl">
          <Leaf className="w-4 h-4 text-green-500" />
          <div>
            <span className="text-sm font-medium text-gray-700">{fiber.toFixed(1)}g</span>
            <span className="text-xs text-gray-500 ml-1">Fiber</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white/70 rounded-xl">
          <Cookie className="w-4 h-4 text-pink-500" />
          <div>
            <span className="text-sm font-medium text-gray-700">{sugar.toFixed(1)}g</span>
            <span className="text-xs text-gray-500 ml-1">Sugar</span>
          </div>
        </div>
      </div>

      {/* Nutri-Score if available */}
      {nutrition.nutriScore && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-1">
            {["A", "B", "C", "D", "E"].map((grade) => (
              <div
                key={grade}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white transition-transform",
                  grade === nutrition.nutriScore?.toUpperCase() && "scale-125 shadow-lg",
                  grade === "A" && "bg-green-600",
                  grade === "B" && "bg-lime-500",
                  grade === "C" && "bg-yellow-500",
                  grade === "D" && "bg-orange-500",
                  grade === "E" && "bg-red-500",
                  grade !== nutrition.nutriScore?.toUpperCase() && "opacity-40"
                )}
              >
                {grade}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source badge */}
      <div className="mt-4 text-center">
        <span className="text-[10px] text-gray-400">
          Data from {nutrition.source === "usda" ? "USDA FoodData Central" : nutrition.source === "openfoodfacts" ? "Open Food Facts" : "Nutrition Database"}
        </span>
      </div>
    </motion.div>
  );
}
