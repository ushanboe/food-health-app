"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  Calendar,
  Utensils,
  Scale,
  BookOpen,
  Target,
  Droplets,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

interface DataCategory {
  id: string;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  count?: number;
}

// Helper to escape CSV values
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes(""") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function ExportDataPage() {
  const {
    meals,
    recipes,
    weightHistory,
    waterLog,
    dailyGoals,
    userStats,
  } = useAppStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "meals",
    "recipes",
    "weight",
    "water",
    "goals",
  ]);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const categories: DataCategory[] = [
    {
      id: "meals",
      label: "Food Diary",
      description: "All logged meals and nutrition data",
      icon: Utensils,
      iconColor: "text-orange-500",
      count: Object.values(meals || {}).flat().length,
    },
    {
      id: "recipes",
      label: "Saved Recipes",
      description: "Your saved and created recipes",
      icon: BookOpen,
      iconColor: "text-emerald-500",
      count: (recipes || []).length,
    },
    {
      id: "weight",
      label: "Weight History",
      description: "Weight tracking entries",
      icon: Scale,
      iconColor: "text-purple-500",
      count: (weightHistory || []).length,
    },
    {
      id: "water",
      label: "Water Intake",
      description: "Hydration tracking data",
      icon: Droplets,
      iconColor: "text-blue-500",
      count: Object.keys(waterLog || {}).length,
    },
    {
      id: "goals",
      label: "Goals & Profile",
      description: "Your nutrition goals and profile settings",
      icon: Target,
      iconColor: "text-red-500",
    },
  ];

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setExported(false);
  };

  const selectAll = () => {
    setSelectedCategories(categories.map((c) => c.id));
    setExported(false);
  };

  const selectNone = () => {
    setSelectedCategories([]);
    setExported(false);
  };

  const exportData = async (format: "json" | "csv") => {
    setExporting(true);
    setExported(false);

    try {
      // Build export data object
      const exportDataObj: Record<string, any> = {
        exportDate: new Date().toISOString(),
        appVersion: "2.1.0",
        format: format,
      };

      if (selectedCategories.includes("meals")) {
        exportDataObj.meals = meals || {};
      }
      if (selectedCategories.includes("recipes")) {
        exportDataObj.recipes = recipes || [];
      }
      if (selectedCategories.includes("weight")) {
        exportDataObj.weightHistory = weightHistory || [];
      }
      if (selectedCategories.includes("water")) {
        exportDataObj.waterLog = waterLog || {};
      }
      if (selectedCategories.includes("goals")) {
        exportDataObj.dailyGoals = dailyGoals;
        exportDataObj.userStats = userStats;
      }

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        // JSON export - full data
        const jsonString = JSON.stringify(exportDataObj, null, 2);
        blob = new Blob([jsonString], { type: "application/json" });
        filename = `fitfork-export-${new Date().toISOString().split("T")[0]}.json`;
      } else {
        // CSV export - comprehensive data
        let csvContent = "";

        // ===== FOOD DIARY =====
        if (selectedCategories.includes("meals") && meals) {
          csvContent += "=== FOOD DIARY ===
";
          csvContent += "Date,Meal Type,Food Name,Calories,Protein (g),Carbs (g),Fat (g),Fiber (g),Sugar (g),Sodium (mg),Serving Size,Notes
";
          Object.entries(meals).forEach(([date, dayMeals]) => {
            (dayMeals as any[]).forEach((meal) => {
              csvContent += [
                escapeCSV(date),
                escapeCSV(meal.mealType),
                escapeCSV(meal.name),
                escapeCSV(meal.calories || 0),
                escapeCSV(meal.protein || 0),
                escapeCSV(meal.carbs || 0),
                escapeCSV(meal.fat || 0),
                escapeCSV(meal.fiber || 0),
                escapeCSV(meal.sugar || 0),
                escapeCSV(meal.sodium || 0),
                escapeCSV(meal.servingSize || meal.portion || ""),
                escapeCSV(meal.notes || ""),
              ].join(",") + "
";
            });
          });
          csvContent += "
";
        }

        // ===== RECIPES =====
        if (selectedCategories.includes("recipes") && recipes) {
          csvContent += "=== RECIPES ===
";
          csvContent += "Name,Servings,Prep Time,Cook Time,Total Time,Calories,Protein (g),Carbs (g),Fat (g),Source,Rating,Cuisine,Diet,Ingredients,Instructions
";
          (recipes as any[]).forEach((recipe) => {
            // Format ingredients as semicolon-separated list
            let ingredientsList = "";
            if (recipe.ingredients) {
              if (Array.isArray(recipe.ingredients)) {
                ingredientsList = recipe.ingredients
                  .map((ing: any) => {
                    if (typeof ing === "string") return ing;
                    if (ing.original) return ing.original;
                    if (ing.name) return `${ing.amount || ""} ${ing.unit || ""} ${ing.name}`.trim();
                    return JSON.stringify(ing);
                  })
                  .join("; ");
              }
            }

            // Format instructions as numbered list
            let instructionsList = "";
            if (recipe.instructions) {
              if (typeof recipe.instructions === "string") {
                instructionsList = recipe.instructions.replace(/
/g, " ");
              } else if (Array.isArray(recipe.instructions)) {
                instructionsList = recipe.instructions
                  .map((inst: any, idx: number) => {
                    if (typeof inst === "string") return `${idx + 1}. ${inst}`;
                    if (inst.step) return `${idx + 1}. ${inst.step}`;
                    return `${idx + 1}. ${JSON.stringify(inst)}`;
                  })
                  .join(" ");
              }
            }

            // Get nutrition info
            const nutrition = recipe.nutrition || {};

            csvContent += [
              escapeCSV(recipe.name || recipe.title),
              escapeCSV(recipe.servings || 1),
              escapeCSV(recipe.prepTime || recipe.preparationMinutes || ""),
              escapeCSV(recipe.cookTime || recipe.cookingMinutes || ""),
              escapeCSV(recipe.readyInMinutes || recipe.totalTime || ""),
              escapeCSV(nutrition.calories || recipe.calories || ""),
              escapeCSV(nutrition.protein || recipe.protein || ""),
              escapeCSV(nutrition.carbs || recipe.carbs || ""),
              escapeCSV(nutrition.fat || recipe.fat || ""),
              escapeCSV(recipe.source || recipe.sourceName || recipe.creditsText || ""),
              escapeCSV(recipe.rating || ""),
              escapeCSV(Array.isArray(recipe.cuisines) ? recipe.cuisines.join("; ") : (recipe.cuisine || "")),
              escapeCSV(Array.isArray(recipe.diets) ? recipe.diets.join("; ") : (recipe.diet || "")),
              escapeCSV(ingredientsList),
              escapeCSV(instructionsList),
            ].join(",") + "
";
          });
          csvContent += "
";
        }

        // ===== WEIGHT HISTORY =====
        if (selectedCategories.includes("weight") && weightHistory) {
          csvContent += "=== WEIGHT HISTORY ===
";
          csvContent += "Date,Weight (kg),Weight (lbs),BMI,Body Fat %,Notes
";
          (weightHistory as any[]).forEach((entry) => {
            const weightLbs = entry.weight ? (entry.weight * 2.20462).toFixed(1) : "";
            csvContent += [
              escapeCSV(entry.date),
              escapeCSV(entry.weight),
              escapeCSV(weightLbs),
              escapeCSV(entry.bmi || ""),
              escapeCSV(entry.bodyFat || ""),
              escapeCSV(entry.note || entry.notes || ""),
            ].join(",") + "
";
          });
          csvContent += "
";
        }

        // ===== WATER INTAKE =====
        if (selectedCategories.includes("water") && waterLog) {
          csvContent += "=== WATER INTAKE ===
";
          csvContent += "Date,Amount (ml),Amount (oz),Goal (ml),Percentage
";
          const waterGoal = dailyGoals?.water || 2000;
          Object.entries(waterLog).forEach(([date, amount]) => {
            const amountNum = Number(amount) || 0;
            const amountOz = (amountNum / 29.5735).toFixed(1);
            const percentage = ((amountNum / waterGoal) * 100).toFixed(0);
            csvContent += [
              escapeCSV(date),
              escapeCSV(amountNum),
              escapeCSV(amountOz),
              escapeCSV(waterGoal),
              escapeCSV(`${percentage}%`),
            ].join(",") + "
";
          });
          csvContent += "
";
        }

        // ===== GOALS & PROFILE =====
        if (selectedCategories.includes("goals")) {
          csvContent += "=== DAILY GOALS ===
";
          csvContent += "Setting,Value
";
          if (dailyGoals) {
            csvContent += `Calories,${escapeCSV(dailyGoals.calories)}
`;
            csvContent += `Protein (g),${escapeCSV(dailyGoals.protein)}
`;
            csvContent += `Carbs (g),${escapeCSV(dailyGoals.carbs)}
`;
            csvContent += `Fat (g),${escapeCSV(dailyGoals.fat)}
`;
            csvContent += `Water (ml),${escapeCSV(dailyGoals.water)}
`;
            csvContent += `Fiber (g),${escapeCSV(dailyGoals.fiber || "")}
`;
          }
          csvContent += "
";

          csvContent += "=== USER PROFILE ===
";
          csvContent += "Setting,Value
";
          if (userStats) {
            csvContent += `Height (cm),${escapeCSV(userStats.height)}
`;
            csvContent += `Current Weight (kg),${escapeCSV(userStats.weight)}
`;
            csvContent += `Target Weight (kg),${escapeCSV(userStats.targetWeight || "")}
`;
            csvContent += `Age,${escapeCSV(userStats.age)}
`;
            csvContent += `Gender,${escapeCSV(userStats.gender)}
`;
            csvContent += `Activity Level,${escapeCSV(userStats.activityLevel)}
`;
            csvContent += `Goal,${escapeCSV(userStats.goal || "")}
`;
          }
        }

        blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        filename = `fitfork-export-${new Date().toISOString().split("T")[0]}.csv`;
      }

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer>
      <Header title="Export Data" showBack />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Download size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Export Your Data</h2>
            <p className="text-gray-500 mt-1">Download a copy of your FitFork data</p>
          </motion.div>

          {/* Info Banner */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4 bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                📦 Your data belongs to you. Export it anytime to keep a backup or transfer to another service.
              </p>
            </Card>
          </motion.div>

          {/* Category Selection */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">Select Data to Export</p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-emerald-600 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-gray-500 font-medium"
                >
                  None
                </button>
              </div>
            </div>

            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Card
                  key={category.id}
                  className={`mb-3 cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald-500 bg-emerald-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-emerald-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon size={20} className={category.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{category.label}</p>
                        {category.count !== undefined && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {category.count} items
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <CheckCircle size={14} className="text-white" />}
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>

          {/* Export Buttons */}
          <motion.div variants={fadeUp} className="mt-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Export Format</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => exportData("json")}
                disabled={exporting || selectedCategories.length === 0}
                variant="secondary"
                className="flex items-center justify-center gap-2"
              >
                <FileJson size={18} />
                JSON
              </Button>
              <Button
                onClick={() => exportData("csv")}
                disabled={exporting || selectedCategories.length === 0}
                variant="secondary"
                className="flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={18} />
                CSV
              </Button>
            </div>
          </motion.div>

          {/* Success Message */}
          {exported && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Card className="bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500" />
                  <div>
                    <p className="font-medium text-emerald-800">Export Complete!</p>
                    <p className="text-sm text-emerald-600">Your data has been downloaded.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Help Text */}
          <motion.div variants={fadeUp} className="mt-6 mb-8">
            <Card className="bg-gray-50">
              <p className="text-sm text-gray-600">
                <strong>JSON format</strong> is best for backups and importing into other apps. Contains complete data structure.
                <br /><br />
                <strong>CSV format</strong> can be opened in Excel or Google Sheets. Includes full details for recipes (ingredients, instructions, nutrition), meals, weight history, and more.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
