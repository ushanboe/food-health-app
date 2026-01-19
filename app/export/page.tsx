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
    dailyLogs,
    recipes,
    weightHistory,
    dailyGoals,
    userStats,
    userProfile,
  } = useAppStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "meals",
    "recipes",
    "weight",
    "goals",
  ]);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Count total meal entries across all daily logs
  const totalMealEntries = (dailyLogs || []).reduce(
    (sum, log) => sum + (log.meals?.length || 0),
    0
  );

  const categories: DataCategory[] = [
    {
      id: "meals",
      label: "Food Diary",
      description: "All logged meals and nutrition data",
      icon: Utensils,
      iconColor: "text-orange-500",
      count: totalMealEntries,
    },
    {
      id: "recipes",
      label: "Saved Recipes",
      description: "Your recipe collection with ingredients",
      icon: BookOpen,
      iconColor: "text-emerald-500",
      count: (recipes || []).length,
    },
    {
      id: "weight",
      label: "Weight History",
      description: "Weight tracking entries over time",
      icon: Scale,
      iconColor: "text-blue-500",
      count: (weightHistory || []).length,
    },
    {
      id: "goals",
      label: "Goals & Profile",
      description: "Your nutrition goals and profile settings",
      icon: Target,
      iconColor: "text-purple-500",
      count: 1,
    },
  ];

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const generateJSONExport = () => {
    const data: any = {};

    if (selectedCategories.includes("meals")) {
      data.dailyLogs = dailyLogs || [];
    }
    if (selectedCategories.includes("recipes")) {
      data.recipes = recipes || [];
    }
    if (selectedCategories.includes("weight")) {
      data.weightHistory = weightHistory || [];
    }
    if (selectedCategories.includes("goals")) {
      data.dailyGoals = dailyGoals;
      data.userStats = userStats;
      data.userProfile = userProfile;
    }

    return JSON.stringify(data, null, 2);
  };

  const generateCSVExport = () => {
    const csvSections: string[] = [];

    // Meals CSV
    if (selectedCategories.includes("meals") && dailyLogs?.length) {
      const lines: string[] = [];
      lines.push("=== FOOD DIARY ===");
      lines.push("Date,Meal Name,Calories,Protein (g),Carbs (g),Fat (g),Fiber (g),Sugar (g),Sodium (mg),Serving Size,Notes");
      
      (dailyLogs || []).forEach((log) => {
        (log.meals || []).forEach((meal) => {
          lines.push(
            [
              escapeCSV(log.date),
              escapeCSV(meal.foodName),
              escapeCSV(meal.calories || 0),
              escapeCSV(meal.protein || 0),
              escapeCSV(meal.carbs || 0),
              escapeCSV(meal.fat || 0),
              escapeCSV(meal.fiber || 0),
              escapeCSV(meal.sugar || 0),
              escapeCSV(0),
              escapeCSV(meal.servingSize || ""),
              escapeCSV(""),
            ].join(",")
          );
        });
      });
      csvSections.push(lines.join("\n"));
    }

    // Recipes CSV
    if (selectedCategories.includes("recipes") && recipes?.length) {
      const lines: string[] = [];
      lines.push("");
      lines.push("=== SAVED RECIPES ===");
      lines.push("Name,Servings,Rating,Source,Ingredients,Instructions,Total Calories,Total Protein,Total Carbs,Total Fat,Created");
      
      (recipes || []).forEach((recipe) => {
        // Sum nutrition from ingredients
        const totalNutrition = (recipe.ingredients || []).reduce(
          (acc, ing) => ({
            calories: acc.calories + (ing.calories || 0),
            protein: acc.protein + (ing.protein || 0),
            carbs: acc.carbs + (ing.carbs || 0),
            fat: acc.fat + (ing.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        // Format ingredients list
        const ingredientsList = (recipe.ingredients || [])
          .map((ing) => `${ing.amount || ""} ${ing.unit || ""} ${ing.name}`.trim())
          .join("; ");

        // Format instructions
        const instructionsList = recipe.instructions || "";

        lines.push(
          [
            escapeCSV(recipe.name),
            escapeCSV(recipe.servings || 1),
            escapeCSV(recipe.rating || 0),
            escapeCSV(recipe.source || ""),
            escapeCSV(ingredientsList),
            escapeCSV(instructionsList),
            escapeCSV(totalNutrition.calories),
            escapeCSV(totalNutrition.protein),
            escapeCSV(totalNutrition.carbs),
            escapeCSV(totalNutrition.fat),
            escapeCSV(recipe.createdAt || ""),
          ].join(",")
        );
      });
      csvSections.push(lines.join("\n"));
    }

    // Weight CSV
    if (selectedCategories.includes("weight") && weightHistory?.length) {
      const lines: string[] = [];
      lines.push("");
      lines.push("=== WEIGHT HISTORY ===");
      lines.push("Date,Weight (kg),Weight (lbs),Notes");
      
      (weightHistory || []).forEach((entry) => {
        const weightLbs = entry.weight ? (entry.weight * 2.20462).toFixed(1) : "";
        lines.push(
          [
            escapeCSV(entry.date),
            escapeCSV(entry.weight),
            escapeCSV(weightLbs),
            escapeCSV(entry.note || ""),
          ].join(",")
        );
      });
      csvSections.push(lines.join("\n"));
    }

    // Goals CSV
    if (selectedCategories.includes("goals")) {
      const lines: string[] = [];
      lines.push("");
      lines.push("=== GOALS & PROFILE ===");
      lines.push("Setting,Value");
      lines.push(`Daily Calorie Goal,${dailyGoals?.calories || ""}`); 
      lines.push(`Protein Goal (g),${dailyGoals?.protein || ""}`);
      lines.push(`Carbs Goal (g),${dailyGoals?.carbs || ""}`);
      lines.push(`Fat Goal (g),${dailyGoals?.fat || ""}`);
      lines.push(`Height (cm),${userStats?.height || ""}`);
      lines.push(`Activity Level,${userStats?.activityLevel || ""}`);
      lines.push(`Name,${userProfile?.name || ""}`);
      lines.push(`Age,${userStats?.age || ""}`);
      lines.push(`Gender,${userStats?.gender || ""}`);
      csvSections.push(lines.join("\n"));
    }

    return csvSections.join("\n");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    setExported(false);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const content = generateJSONExport();
      downloadFile(content, `fitfork-export-${timestamp}.json`, "application/json");
    } else {
      const content = generateCSVExport();
      downloadFile(content, `fitfork-export-${timestamp}.csv`, "text/csv");
    }

    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <PageContainer>
      <Header title="Export Data" showBack />

      <PageContent>
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {/* Info Card */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <p className="text-sm text-emerald-800">
                📦 Export your FitFork data to keep a backup or use in other apps.
                Select the categories you want to export below.
              </p>
            </Card>
          </motion.div>

          {/* Categories */}
          <motion.div variants={fadeUp}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Select Data to Export
            </h3>
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <Card
                    key={category.id}
                    className={`p-4 cursor-pointer transition-all ${
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
                        <Icon className={`w-5 h-5 ${category.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {category.label}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {category.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.count !== undefined && (
                          <span className="text-sm text-gray-400">
                            {category.count} items
                          </span>
                        )}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Export Buttons */}
          <motion.div variants={fadeUp} className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Export Format
            </h3>

            <Button
              onClick={() => handleExport("json")}
              disabled={selectedCategories.length === 0 || exporting}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileJson className="w-5 h-5" />
              {exporting ? "Exporting..." : "Export as JSON"}
            </Button>

            <Button
              onClick={() => handleExport("csv")}
              disabled={selectedCategories.length === 0 || exporting}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              {exporting ? "Exporting..." : "Export as CSV"}
            </Button>

            {exported && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-emerald-600 py-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Export complete!</span>
              </motion.div>
            )}
          </motion.div>

          {/* Help Text */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-2">💡 Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>JSON</strong> - Best for backups and importing back</li>
                <li>• <strong>CSV</strong> - Opens in Excel, Google Sheets, etc.</li>
                <li>• Your data stays on your device until exported</li>
              </ul>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
