"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Plus,
  Flame,
  Loader2,
  Apple,
  Utensils,
} from "lucide-react";
import { useAppStore, MealType } from "@/lib/store";
import { Card } from "@/components/ui/Card";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  brand?: string;
}

// Common foods database for quick search
const commonFoods: FoodItem[] = [
  { id: "1", name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: "1 medium (118g)" },
  { id: "2", name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "1 medium (182g)" },
  { id: "3", name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g cooked" },
  { id: "4", name: "Brown Rice", calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: "1 cup cooked" },
  { id: "5", name: "Egg", calories: 78, protein: 6, carbs: 0.6, fat: 5, servingSize: "1 large" },
  { id: "6", name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: "170g" },
  { id: "7", name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fat: 3, servingSize: "1 cup cooked" },
  { id: "8", name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: "100g" },
  { id: "9", name: "Broccoli", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: "1 cup" },
  { id: "10", name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: "1 oz (28g)" },
  { id: "11", name: "Sweet Potato", calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: "1 medium" },
  { id: "12", name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingSize: "1 medium" },
  { id: "13", name: "Whole Wheat Bread", calories: 81, protein: 4, carbs: 14, fat: 1, servingSize: "1 slice" },
  { id: "14", name: "Milk (2%)", calories: 122, protein: 8, carbs: 12, fat: 5, servingSize: "1 cup" },
  { id: "15", name: "Cottage Cheese", calories: 163, protein: 28, carbs: 6, fat: 2.3, servingSize: "1 cup" },
];

export default function SearchFoodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealType = (searchParams.get("meal") as MealType) || "snacks";
  const { addMealEntry } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FoodItem[]>(commonFoods);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);

  // Filter foods based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults(commonFoods);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const filtered = commonFoods.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddFood = (food: FoodItem) => {
    const entry = {
      id: crypto.randomUUID(),
      mealType: mealType,
      name: food.name,
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings * 10) / 10,
      carbs: Math.round(food.carbs * servings * 10) / 10,
      fat: Math.round(food.fat * servings * 10) / 10,
      timestamp: new Date().toISOString(),
    };

    addMealEntry(entry);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Meal Type Indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Utensils size={16} />
          <span>Adding to: <strong className="text-gray-700 capitalize">{mealType}</strong></span>
        </div>

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Apple size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No foods found</p>
            <p className="text-sm text-gray-400">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((food) => (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedFood(food)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{food.name}</h3>
                      <p className="text-sm text-gray-500">{food.servingSize}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-orange-400" />
                          {food.calories} cal
                        </span>
                        <span>Pro: {food.protein}g</span>
                        <span>Carb: {food.carbs}g</span>
                        <span>Fat: {food.fat}g</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFood(food);
                      }}
                      className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedFood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedFood(null)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedFood.name}
            </h2>
            <p className="text-gray-500 mb-4">{selectedFood.servingSize}</p>

            {/* Servings Selector */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-700">Servings</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{servings}</span>
                <button
                  onClick={() => setServings(servings + 0.5)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nutrition Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-orange-600">
                  {Math.round(selectedFood.calories * servings)}
                </p>
                <p className="text-xs text-orange-500">Calories</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {Math.round(selectedFood.protein * servings)}g
                </p>
                <p className="text-xs text-blue-500">Protein</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-600">
                  {Math.round(selectedFood.carbs * servings)}g
                </p>
                <p className="text-xs text-amber-500">Carbs</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-pink-600">
                  {Math.round(selectedFood.fat * servings)}g
                </p>
                <p className="text-xs text-pink-500">Fat</p>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleAddFood(selectedFood)}
              className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-2xl hover:bg-emerald-600 transition-colors"
            >
              Add to {mealType}
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
