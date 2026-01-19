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
      const exportData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        appVersion: "2.1.0",
        format: format,
      };

      if (selectedCategories.includes("meals")) {
        exportData.meals = meals || {};
      }
      if (selectedCategories.includes("recipes")) {
        exportData.recipes = recipes || [];
      }
      if (selectedCategories.includes("weight")) {
        exportData.weightHistory = weightHistory || [];
      }
      if (selectedCategories.includes("water")) {
        exportData.waterLog = waterLog || {};
      }
      if (selectedCategories.includes("goals")) {
        exportData.dailyGoals = dailyGoals;
        exportData.userStats = userStats;
      }

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        // JSON export
        const jsonString = JSON.stringify(exportData, null, 2);
        blob = new Blob([jsonString], { type: "application/json" });
        filename = `fitfork-export-${new Date().toISOString().split("T")[0]}.json`;
      } else {
        // CSV export - flatten data for spreadsheet
        let csvContent = "";

        // Meals CSV
        if (selectedCategories.includes("meals") && meals) {
          csvContent += "=== FOOD DIARY ===\n";
          csvContent += "Date,Meal Type,Food Name,Calories,Protein,Carbs,Fat\n";
          Object.entries(meals).forEach(([date, dayMeals]) => {
            (dayMeals as any[]).forEach((meal) => {
              csvContent += `${date},${meal.mealType || ""},"${meal.name || ""}",${meal.calories || 0},${meal.protein || 0},${meal.carbs || 0},${meal.fat || 0}\n`;
            });
          });
          csvContent += "\n";
        }

        // Weight CSV
        if (selectedCategories.includes("weight") && weightHistory) {
          csvContent += "=== WEIGHT HISTORY ===\n";
          csvContent += "Date,Weight (kg),Notes\n";
          (weightHistory as any[]).forEach((entry) => {
            csvContent += `${entry.date},${entry.weight},"${entry.note || ""}"\n`;
          });
          csvContent += "\n";
        }

        // Recipes CSV
        if (selectedCategories.includes("recipes") && recipes) {
          csvContent += "=== RECIPES ===\n";
          csvContent += "Name,Servings,Source,Rating\n";
          (recipes as any[]).forEach((recipe) => {
            csvContent += `"${recipe.name || ""}",${recipe.servings || 1},"${recipe.source || ""}",${recipe.rating || ""}\n`;
          });
        }

        blob = new Blob([csvContent], { type: "text/csv" });
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
                <strong>JSON format</strong> is best for backups and importing into other apps.
                <br />
                <strong>CSV format</strong> can be opened in Excel or Google Sheets.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
