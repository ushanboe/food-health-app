"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, ChefHat, Save, X, Search, Minus } from "lucide-react";
import { useAppStore, Recipe, RecipeIngredient } from "@/lib/store";

export default function RecipesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { recipes, analysisHistory, addRecipe, removeRecipe } = useAppStore();
  const [showBuilder, setShowBuilder] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" /></div>;

  // Filter scanned foods for ingredient search
  const filteredFoods = analysisHistory.filter(f => 
    f.foodName.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const addIngredient = (food: typeof analysisHistory[0]) => {
    const existing = ingredients.find(i => i.name === food.foodName);
    if (existing) {
      setIngredients(ingredients.map(i => 
        i.name === food.foodName ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setIngredients([...ingredients, {
        id: `ing-${Date.now()}`,
        name: food.foodName,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        servingSize: food.servingSize,
        quantity: 1,
      }]);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const updateQuantity = (id: string, delta: number) => {
    setIngredients(ingredients.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0.5, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const totals = ingredients.reduce((acc, i) => ({
    calories: acc.calories + i.calories * i.quantity,
    protein: acc.protein + i.protein * i.quantity,
    carbs: acc.carbs + i.carbs * i.quantity,
    fat: acc.fat + i.fat * i.quantity,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
  };

  const saveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;
    addRecipe({
      id: `recipe-${Date.now()}`,
      name: recipeName,
      ingredients,
      servings,
      createdAt: new Date(),
    });
    setShowBuilder(false);
    setRecipeName("");
    setIngredients([]);
    setServings(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white px-5 pt-12 pb-6 safe-top">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Recipe Builder</h1>
        </div>
        <p className="text-purple-100">Create custom meals from scanned foods</p>
      </div>

      <div className="px-5 py-4 space-y-4 -mt-4">
        {/* Saved Recipes */}
        {recipes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Your Recipes</h3>
            <div className="space-y-2">
              {recipes.map((recipe) => {
                const recTotals = recipe.ingredients.reduce((acc, i) => ({
                  calories: acc.calories + i.calories * i.quantity,
                  protein: acc.protein + i.protein * i.quantity,
                }), { calories: 0, protein: 0 });
                return (
                  <div key={recipe.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white">{recipe.name}</h4>
                      <p className="text-xs text-gray-500">
                        {Math.round(recTotals.calories / recipe.servings)} cal • {recipe.ingredients.length} ingredients • {recipe.servings} servings
                      </p>
                    </div>
                    <button onClick={() => removeRecipe(recipe.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {recipes.length === 0 && !showBuilder && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">No Recipes Yet</h3>
            <p className="text-gray-500 text-sm mb-4">Create custom meals by combining your scanned foods</p>
            <button onClick={() => setShowBuilder(true)} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium">
              Create First Recipe
            </button>
          </motion.div>
        )}

        {/* Recipe Builder */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">New Recipe</h3>
                <button onClick={() => setShowBuilder(false)} className="p-1 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recipe Name */}
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Recipe name..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 font-medium"
              />

              {/* Servings */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-gray-600 dark:text-gray-300">Servings</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{servings}</span>
                  <button onClick={() => setServings(servings + 1)} className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Ingredients</span>
                  <button onClick={() => setShowSearch(true)} className="text-purple-500 text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {ingredients.length > 0 ? (
                  <div className="space-y-2">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800 dark:text-white">{ing.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(ing.calories * ing.quantity)} cal</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(ing.id, -0.5)} className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{ing.quantity}</span>
                          <button onClick={() => updateQuantity(ing.id, 0.5)} className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                            +
                          </button>
                        </div>
                        <button onClick={() => removeIngredient(ing.id)} className="p-1 text-gray-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">Add ingredients from your scanned foods</p>
                )}
              </div>

              {/* Totals */}
              {ingredients.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white mb-4">
                  <p className="text-sm opacity-80 mb-1">Per Serving</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-xl font-bold">{perServing.calories}</p><p className="text-xs opacity-80">cal</p></div>
                    <div><p className="text-xl font-bold">{perServing.protein}g</p><p className="text-xs opacity-80">protein</p></div>
                    <div><p className="text-xl font-bold">{perServing.carbs}g</p><p className="text-xs opacity-80">carbs</p></div>
                    <div><p className="text-xl font-bold">{perServing.fat}g</p><p className="text-xs opacity-80">fat</p></div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveRecipe}
                disabled={!recipeName.trim() || ingredients.length === 0}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Save Recipe
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Button */}
      {!showBuilder && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBuilder(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Ingredient Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Add Ingredient</h3>
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scanned foods..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => addIngredient(food)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {food.imageData ? (
                      <img src={food.imageData} alt={food.foodName} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">{food.foodName}</p>
                      <p className="text-xs text-gray-500">{food.calories} cal • {food.protein}g protein</p>
                    </div>
                    <Plus className="w-5 h-5 text-purple-500" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>{analysisHistory.length === 0 ? "Scan some foods first!" : "No matching foods"}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
