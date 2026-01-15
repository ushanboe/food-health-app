"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ChefHat, Link, Search, X,
  Loader2, Globe, Package, Check, Minus, BookOpen, Utensils, Shuffle, Grid
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, Recipe, RecipeIngredient } from '@/lib/store';
import { searchIngredient } from '@/lib/recipe-parser';
import { searchMeals, getMealById, getRandomMeal, getCategories, getMealsByCategory, MealDBMeal, MealDBCategory } from '@/lib/mealdb-api';

interface LocalIngredient {
  id: string;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

export default function RecipesPage() {
  const router = useRouter();
  const { recipes, addRecipe, removeRecipe } = useAppStore();

  const [showCreator, setShowCreator] = useState(false);
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [showMealDB, setShowMealDB] = useState(false);

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // MealDB state
  const [mealDBQuery, setMealDBQuery] = useState('');
  const [mealDBResults, setMealDBResults] = useState<MealDBMeal[]>([]);
  const [mealDBCategories, setMealDBCategories] = useState<MealDBCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryMeals, setCategoryMeals] = useState<any[]>([]);
  const [isMealDBSearching, setIsMealDBSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealDBMeal | null>(null);
  const [isLoadingMeal, setIsLoadingMeal] = useState(false);
  const [isImportingMeal, setIsImportingMeal] = useState(false);

  // Load categories on mount
  useEffect(() => {
    if (showMealDB && mealDBCategories.length === 0) {
      getCategories().then(setMealDBCategories);
    }
  }, [showMealDB]);

  // Calculate totals
  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories * ing.quantity),
      protein: acc.protein + (ing.protein * ing.quantity),
      carbs: acc.carbs + (ing.carbs * ing.quantity),
      fat: acc.fat + (ing.fat * ing.quantity),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
  };

  // MealDB search
  const handleMealDBSearch = async () => {
    if (!mealDBQuery.trim()) return;
    setIsMealDBSearching(true);
    setSelectedCategory('');
    setCategoryMeals([]);
    try {
      const results = await searchMeals(mealDBQuery);
      setMealDBResults(results);
    } catch (error) {
      console.error('MealDB search error:', error);
    } finally {
      setIsMealDBSearching(false);
    }
  };

  // Load category meals
  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setMealDBResults([]);
    setIsMealDBSearching(true);
    try {
      const meals = await getMealsByCategory(category);
      setCategoryMeals(meals);
    } catch (error) {
      console.error('Category load error:', error);
    } finally {
      setIsMealDBSearching(false);
    }
  };

  // Load full meal details
  const handleMealSelect = async (mealId: string) => {
    setIsLoadingMeal(true);
    try {
      const meal = await getMealById(mealId);
      setSelectedMeal(meal);
    } catch (error) {
      console.error('Meal load error:', error);
    } finally {
      setIsLoadingMeal(false);
    }
  };

  // Get random meal
  const handleRandomMeal = async () => {
    setIsLoadingMeal(true);
    setShowMealDB(true);
    try {
      const meal = await getRandomMeal();
      setSelectedMeal(meal);
    } catch (error) {
      console.error('Random meal error:', error);
    } finally {
      setIsLoadingMeal(false);
    }
  };

  // Import meal from MealDB to recipe creator
  const importMealDBRecipe = async (meal: MealDBMeal) => {
    setIsImportingMeal(true);
    setRecipeName(meal.strMeal);
    setServings(4);

    const newIngredients: LocalIngredient[] = [];

    for (const ing of meal.ingredients.slice(0, 15)) {
      const results = await searchIngredient(ing.name);
      if (results.length > 0) {
        const match = results[0];
        newIngredients.push({
          id: `${Date.now()}-${Math.random()}`,
          name: `${ing.name} (${ing.measure})`,
          quantity: 1,
          calories: match.nutrition?.calories || 50,
          protein: match.nutrition?.protein || 2,
          carbs: match.nutrition?.carbs || 5,
          fat: match.nutrition?.fat || 2,
          servingSize: match.servingSize || '100g',
        });
      } else {
        newIngredients.push({
          id: `${Date.now()}-${Math.random()}`,
          name: `${ing.name} (${ing.measure})`,
          quantity: 1,
          calories: 50,
          protein: 2,
          carbs: 5,
          fat: 2,
        });
      }
    }

    setIngredients(newIngredients);
    setIsImportingMeal(false);
    setShowMealDB(false);
    setSelectedMeal(null);
    setShowCreator(true);
  };

  // Search for ingredients
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchIngredient(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add ingredient from search
  const addIngredientFromSearch = (item: any) => {
    const newIngredient: LocalIngredient = {
      id: `${Date.now()}-${Math.random()}`,
      name: item.brand ? `${item.name} (${item.brand})` : item.name,
      quantity: 1,
      calories: item.nutrition?.calories || 0,
      protein: item.nutrition?.protein || 0,
      carbs: item.nutrition?.carbs || 0,
      fat: item.nutrition?.fat || 0,
      servingSize: item.servingSize,
    };
    setIngredients([...ingredients, newIngredient]);
    setShowIngredientSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update ingredient quantity
  const updateQuantity = (id: string, delta: number) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, quantity: Math.max(0.5, ing.quantity + delta) } : ing
    ));
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  // Save recipe
  const saveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    const recipeIngredients: RecipeIngredient[] = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      calories: Math.round(ing.calories * ing.quantity),
      protein: Math.round(ing.protein * ing.quantity * 10) / 10,
      carbs: Math.round(ing.carbs * ing.quantity * 10) / 10,
      fat: Math.round(ing.fat * ing.quantity * 10) / 10,
      servingSize: ing.servingSize,
    }));

    const recipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      servings,
      ingredients: recipeIngredients,
      createdAt: new Date(),
    };

    addRecipe(recipe);
    setShowCreator(false);
    setRecipeName('');
    setServings(4);
    setIngredients([]);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-lg z-10 px-4 py-4 flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Recipe Builder</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMealDB(true)}
            className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-2xl text-left"
          >
            <Utensils className="mb-2" size={24} />
            <p className="font-semibold">TheMealDB</p>
            <p className="text-orange-100 text-sm">300+ recipes</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreator(true)}
            className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-2xl text-left"
          >
            <Plus className="mb-2" size={24} />
            <p className="font-semibold">Create Manual</p>
            <p className="text-purple-200 text-sm">Add ingredients</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomMeal}
            disabled={isLoadingMeal}
            className="bg-gradient-to-br from-green-600 to-emerald-700 p-4 rounded-2xl text-left col-span-2"
          >
            {isLoadingMeal ? (
              <Loader2 className="mb-2 animate-spin" size={24} />
            ) : (
              <Shuffle className="mb-2" size={24} />
            )}
            <p className="font-semibold">Random Meal</p>
            <p className="text-green-200 text-sm">Surprise me with a recipe!</p>
          </motion.button>
        </div>

        {/* Saved Recipes */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={20} />
            My Recipes ({recipes.length})
          </h2>

          {recipes.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-8 text-center">
              <ChefHat className="mx-auto mb-3 text-gray-600" size={48} />
              <p className="text-gray-400">No recipes yet</p>
              <p className="text-gray-500 text-sm">Browse TheMealDB or create manually</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => {
                const recipeCalories = recipe.ingredients.reduce((sum, i) => sum + i.calories, 0);
                const recipeProtein = recipe.ingredients.reduce((sum, i) => sum + i.protein, 0);
                const recipeCarbs = recipe.ingredients.reduce((sum, i) => sum + i.carbs, 0);
                return (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{recipe.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {recipe.ingredients.length} ingredients • {recipe.servings} servings
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-orange-400">{Math.round(recipeCalories / recipe.servings)} cal/serving</span>
                          <span className="text-blue-400">{Math.round(recipeProtein / recipe.servings)}g protein</span>
                          <span className="text-green-400">{Math.round(recipeCarbs / recipe.servings)}g carbs</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRecipe(recipe.id)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MealDB Modal */}
      <AnimatePresence>
        {showMealDB && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 overflow-auto"
          >
            <div className="sticky top-0 bg-black/90 backdrop-blur-lg z-10 px-4 py-4 flex items-center gap-4 border-b border-gray-800">
              <button onClick={() => { setShowMealDB(false); setSelectedMeal(null); }} className="p-2 -ml-2">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold">TheMealDB Recipes</h1>
            </div>

            {isLoadingMeal ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin" size={48} />
              </div>
            ) : selectedMeal ? (
              <div className="p-4">
                <img
                  src={selectedMeal.strMealThumb}
                  alt={selectedMeal.strMeal}
                  className="w-full h-48 object-cover rounded-2xl mb-4"
                />
                <h2 className="text-2xl font-bold mb-2">{selectedMeal.strMeal}</h2>
                <div className="flex gap-2 mb-4">
                  <span className="bg-orange-600 px-3 py-1 rounded-full text-sm">{selectedMeal.strCategory}</span>
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">{selectedMeal.strArea}</span>
                </div>

                <h3 className="font-semibold text-lg mb-2">Ingredients ({selectedMeal.ingredients.length})</h3>
                <div className="bg-gray-900 rounded-xl p-3 mb-4 space-y-1">
                  {selectedMeal.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{ing.name}</span>
                      <span className="text-gray-400">{ing.measure}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => importMealDBRecipe(selectedMeal)}
                  disabled={isImportingMeal}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  {isImportingMeal ? (
                    <><Loader2 className="animate-spin" size={20} /> Importing...</>
                  ) : (
                    <><Plus size={20} /> Import to Recipe Builder</>
                  )}
                </motion.button>

                <button
                  onClick={() => setSelectedMeal(null)}
                  className="w-full mt-3 py-3 text-gray-400"
                >
                  ← Back to search
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mealDBQuery}
                    onChange={(e) => setMealDBQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMealDBSearch()}
                    placeholder="Search meals... (chicken, pasta, etc.)"
                    className="flex-1 bg-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleMealDBSearch}
                    disabled={isMealDBSearching}
                    className="bg-orange-600 px-4 rounded-xl"
                  >
                    {isMealDBSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  </button>
                </div>

                {mealDBCategories.length > 0 && !mealDBResults.length && !categoryMeals.length && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Grid size={18} /> Browse by Category
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {mealDBCategories.map((cat) => (
                        <button
                          key={cat.strCategory}
                          onClick={() => handleCategorySelect(cat.strCategory)}
                          className="bg-gray-800 rounded-xl p-2 text-center hover:bg-gray-700 transition"
                        >
                          <img
                            src={cat.strCategoryThumb}
                            alt={cat.strCategory}
                            className="w-full h-16 object-cover rounded-lg mb-1"
                          />
                          <p className="text-xs font-medium truncate">{cat.strCategory}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mealDBResults.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Search Results ({mealDBResults.length})</h3>
                    <div className="space-y-2">
                      {mealDBResults.map((meal) => (
                        <button
                          key={meal.idMeal}
                          onClick={() => setSelectedMeal(meal)}
                          className="w-full bg-gray-800 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-gray-700 transition"
                        >
                          <img src={meal.strMealThumb} alt={meal.strMeal} className="w-16 h-16 object-cover rounded-lg" />
                          <div className="flex-1">
                            <p className="font-semibold">{meal.strMeal}</p>
                            <p className="text-gray-400 text-sm">{meal.strCategory} • {meal.strArea}</p>
                            <p className="text-orange-400 text-sm">{meal.ingredients.length} ingredients</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {categoryMeals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{selectedCategory} ({categoryMeals.length})</h3>
                      <button onClick={() => { setSelectedCategory(''); setCategoryMeals([]); }} className="text-orange-400 text-sm">Clear</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryMeals.map((meal) => (
                        <button
                          key={meal.idMeal}
                          onClick={() => handleMealSelect(meal.idMeal)}
                          className="bg-gray-800 rounded-xl overflow-hidden text-left hover:bg-gray-700 transition"
                        >
                          <img src={meal.strMealThumb} alt={meal.strMeal} className="w-full h-24 object-cover" />
                          <p className="p-2 text-sm font-medium truncate">{meal.strMeal}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isMealDBSearching && (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    <p className="text-gray-400">Loading...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 overflow-auto"
          >
            <div className="sticky top-0 bg-black/90 backdrop-blur-lg z-10 px-4 py-4 flex items-center justify-between border-b border-gray-800">
              <button onClick={() => setShowCreator(false)} className="p-2 -ml-2">
                <X size={24} />
              </button>
              <h1 className="text-lg font-bold">Create Recipe</h1>
              <button
                onClick={saveRecipe}
                disabled={!recipeName.trim() || ingredients.length === 0}
                className="bg-green-600 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Recipe Name</label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="My Delicious Recipe"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Servings</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setServings(Math.max(1, servings - 1))} className="bg-gray-800 p-3 rounded-xl">
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{servings}</span>
                  <button onClick={() => setServings(servings + 1)} className="bg-gray-800 p-3 rounded-xl">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Ingredients ({ingredients.length})</h3>
                  <button onClick={() => setShowIngredientSearch(true)} className="text-purple-400 text-sm flex items-center gap-1">
                    <Plus size={16} /> Add
                  </button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-6 text-center">
                    <Package className="mx-auto mb-2 text-gray-600" size={32} />
                    <p className="text-gray-400 text-sm">No ingredients yet</p>
                    <button onClick={() => setShowIngredientSearch(true)} className="text-purple-400 text-sm mt-2">
                      + Search & add ingredients
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ing.name}</p>
                          <p className="text-gray-400 text-xs">
                            {Math.round(ing.calories * ing.quantity)} cal • {ing.servingSize || '100g'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(ing.id, -0.5)} className="bg-gray-700 p-1 rounded">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm">{ing.quantity}</span>
                          <button onClick={() => updateQuantity(ing.id, 0.5)} className="bg-gray-700 p-1 rounded">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => removeIngredient(ing.id)} className="text-red-400 p-1">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {ingredients.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-3">Per Serving Nutrition</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-black/30 rounded-xl p-2">
                      <p className="text-xl font-bold text-orange-400">{perServing.calories}</p>
                      <p className="text-xs text-gray-400">Calories</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2">
                      <p className="text-xl font-bold text-blue-400">{perServing.protein}g</p>
                      <p className="text-xs text-gray-400">Protein</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2">
                      <p className="text-xl font-bold text-green-400">{perServing.carbs}g</p>
                      <p className="text-xs text-gray-400">Carbs</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2">
                      <p className="text-xl font-bold text-yellow-400">{perServing.fat}g</p>
                      <p className="text-xs text-gray-400">Fat</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingredient Search Modal */}
      <AnimatePresence>
        {showIngredientSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-end"
            onClick={() => setShowIngredientSearch(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Search Ingredients</h2>
                <button onClick={() => setShowIngredientSearch(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search foods..."
                  className="flex-1 bg-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button onClick={handleSearch} disabled={isSearching} className="bg-purple-600 px-4 rounded-xl">
                  {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-3">Searching Open Food Facts database</p>

              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => addIngredientFromSearch(item)}
                      className="w-full bg-gray-800 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-gray-700 transition"
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.brand && <p className="text-gray-400 text-xs">{item.brand}</p>}
                        <p className="text-orange-400 text-xs">
                          {item.nutrition?.calories || 0} cal • {item.nutrition?.protein || 0}g P • {item.nutrition?.carbs || 0}g C
                        </p>
                      </div>
                      <Plus size={20} className="text-purple-400" />
                    </button>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center text-gray-400 py-8">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No results found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
