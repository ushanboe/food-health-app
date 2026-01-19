"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore, Recipe, RecipeIngredient } from "@/lib/store";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
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
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""').replace(/\n/g, " ")}"`;
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

  // Calculate total nutrition from recipe ingredients
  const calculateRecipeNutrition = (ingredients: RecipeIngredient[]) => {
    return ingredients.reduce(
      (totals, ing) => ({
        calories: totals.calories + (ing.calories || 0),
        protein: totals.protein + (ing.protein || 0),
        carbs: totals.carbs + (ing.carbs || 0),
        fat: totals.fat + (ing.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const exportData = async (format: "json" | "csv") => {
    setExporting(true);
    setExported(false);

    try {
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
        const jsonString = JSON.stringify(exportDataObj, null, 2);
        blob = new Blob([jsonString], { type: "application/json" });
        filename = `fitfork-export-${new Date().toISOString().split("T")[0]}.json`;
      } else {
        // CSV export
        const lines: string[] = [];

        // FOOD DIARY
        if (selectedCategories.includes("meals") && meals) {
          lines.push("=== FOOD DIARY ===");
          lines.push("Date,Meal Type,Food Name,Calories,Protein (g),Carbs (g),Fat (g),Fiber (g),Sugar (g),Sodium (mg),Serving Size,Notes");
          Object.entries(meals).forEach(([date, dayMeals]) => {
            (dayMeals as any[]).forEach((meal) => {
              lines.push([
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
              ].join(","));
            });
          });
          lines.push("");
        }

        // RECIPES
        if (selectedCategories.includes("recipes") && recipes) {
          lines.push("=== RECIPES ===");
          lines.push("Name,Servings,Total Calories,Total Protein (g),Total Carbs (g),Total Fat (g),Rating,Source,Ingredients,Instructions");
          (recipes as Recipe[]).forEach((recipe) => {
            // Calculate total nutrition from ingredients
            const nutrition = calculateRecipeNutrition(recipe.ingredients || []);
            
            // Format ingredients as semicolon-separated list
            const ingredientsList = (recipe.ingredients || []).map((ing) => {
              const amount = ing.amount ? `${ing.amount}` : "";
              const unit = ing.unit || "";
              const name = ing.name || "";
              return `${amount} ${unit} ${name}`.trim();
            }).join("; ");

            // Format instructions - clean up and truncate if very long
            let instructionsText = recipe.instructions || "";
            instructionsText = instructionsText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

            lines.push([
              escapeCSV(recipe.name),
              escapeCSV(recipe.servings || 1),
              escapeCSV(Math.round(nutrition.calories)),
              escapeCSV(Math.round(nutrition.protein)),
              escapeCSV(Math.round(nutrition.carbs)),
              escapeCSV(Math.round(nutrition.fat)),
              escapeCSV(recipe.rating || ""),
              escapeCSV(recipe.source || ""),
              escapeCSV(ingredientsList),
              escapeCSV(instructionsText),
            ].join(","));
          });
          lines.push("");
        }

        // WEIGHT HISTORY
        if (selectedCategories.includes("weight") && weightHistory) {
          lines.push("=== WEIGHT HISTORY ===");
          lines.push("Date,Weight (kg),Weight (lbs),Notes");
          (weightHistory as any[]).forEach((entry) => {
            const weightLbs = entry.weight ? (entry.weight * 2.20462).toFixed(1) : "";
            lines.push([
              escapeCSV(entry.date),
              escapeCSV(entry.weight),
              escapeCSV(weightLbs),
              escapeCSV(entry.note || entry.notes || ""),
            ].join(","));
          });
          lines.push("");
        }

        // WATER INTAKE
        if (selectedCategories.includes("water") && waterLog) {
          lines.push("=== WATER INTAKE ===");
          lines.push("Date,Amount (ml),Amount (oz),Goal (ml),Percentage");
          const waterGoal = dailyGoals?.water || 2000;
          Object.entries(waterLog).forEach(([date, amount]) => {
            const amountNum = Number(amount) || 0;
            const amountOz = (amountNum / 29.5735).toFixed(1);
            const percentage = ((amountNum / waterGoal) * 100).toFixed(0);
            lines.push([
              escapeCSV(date),
              escapeCSV(amountNum),
              escapeCSV(amountOz),
              escapeCSV(waterGoal),
              escapeCSV(`${percentage}%`),
            ].join(","));
          });
          lines.push("");
        }

        // GOALS & PROFILE
        if (selectedCategories.includes("goals")) {
          lines.push("=== DAILY GOALS ===");
          lines.push("Setting,Value");
          if (dailyGoals) {
            lines.push(`Calories,${escapeCSV(dailyGoals.calories)}`);
            lines.push(`Protein (g),${escapeCSV(dailyGoals.protein)}`);
            lines.push(`Carbs (g),${escapeCSV(dailyGoals.carbs)}`);
            lines.push(`Fat (g),${escapeCSV(dailyGoals.fat)}`);
            lines.push(`Water (ml),${escapeCSV(dailyGoals.water)}`);
          }
          lines.push("");

          lines.push("=== USER PROFILE ===");
          lines.push("Setting,Value");
          if (userStats) {
            lines.push(`Height (cm),${escapeCSV(userStats.height)}`);
            lines.push(`Current Weight (kg),${escapeCSV(userStats.weight)}`);
            lines.push(`Age,${escapeCSV(userStats.age)}`);
            lines.push(`Gender,${escapeCSV(userStats.gender)}`);
            lines.push(`Activity Level,${escapeCSV(userStats.activityLevel)}`);
          }
        }

        const csvContent = lines.join("\n");
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
                <strong>CSV format</strong> can be opened in Excel or Google Sheets. Includes full recipe details with ingredients, instructions, and calculated nutrition totals.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
