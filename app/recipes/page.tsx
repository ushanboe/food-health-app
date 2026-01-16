"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ChefHat, Link, Search, X,
  Loader2, Globe, Package, Check, Minus, BookOpen, Utensils, Shuffle, Grid, Share2, Link2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, Recipe, RecipeIngredient } from '@/lib/store';
import { searchIngredient } from '@/lib/recipe-parser';
import { searchMeals, getMealById, getRandomMeal, getCategories, getMealsByCategory, MealDBMeal, MealDBCategory } from '@/lib/mealdb-api';
import { searchSpoonacularRecipes, getSpoonacularRecipe, extractNutrition, SpoonacularSearchResult, SpoonacularRecipe } from '@/lib/spoonacular-api';
import { parseRecipeFromUrl } from '@/lib/recipe-parser';

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
  const { recipes, addRecipe, removeRecipe, aiSettings } = useAppStore();

  const [showCreator, setShowCreator] = useState(false);
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [showMealDB, setShowMealDB] = useState(false);

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(4);
  const [recipeImageUrl, setRecipeImageUrl] = useState<string | null>(null);
  const [recipeInstructions, setRecipeInstructions] = useState<string | null>(null);
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
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isLoadingMeal, setIsLoadingMeal] = useState(false);
  const [isImportingMeal, setIsImportingMeal] = useState(false);
  // URL Import state
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Spoonacular state
  const [showSpoonacular, setShowSpoonacular] = useState(false);
  const [spoonacularQuery, setSpoonacularQuery] = useState('');
  const [spoonacularResults, setSpoonacularResults] = useState<SpoonacularSearchResult[]>([]);
  const [isSpoonacularSearching, setIsSpoonacularSearching] = useState(false);
  const [selectedSpoonacularRecipe, setSelectedSpoonacularRecipe] = useState<SpoonacularRecipe | null>(null);
  const [isImportingSpoonacular, setIsImportingSpoonacular] = useState(false);


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
    setRecipeImageUrl(meal.strMealThumb);
    setRecipeInstructions(meal.strInstructions);
    setServings(4);

    // Fast parallel lookup with 3 second timeout per ingredient
    const ingredientPromises = meal.ingredients.slice(0, 12).map(async (ing, index) => {
      try {
        // Race between API call and timeout
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const searchPromise = searchIngredient(ing.name);
        const results = await Promise.race([searchPromise, timeoutPromise]);
        
        if (results && Array.isArray(results) && results.length > 0) {
          const match = results[0];
          return {
            id: `${Date.now()}-${index}-${Math.random()}`,
            name: `${ing.name} (${ing.measure})`,
            quantity: 1,
            calories: match.nutrition?.calories || 50,
            protein: match.nutrition?.protein || 2,
            carbs: match.nutrition?.carbs || 5,
            fat: match.nutrition?.fat || 2,
            servingSize: match.servingSize || '100g',
          };
        }
      } catch (e) {
        console.log('Ingredient lookup failed:', ing.name);
      }
      // Fallback with estimated nutrition
      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        name: `${ing.name} (${ing.measure})`,
        quantity: 1,
        calories: 50,
        protein: 2,
        carbs: 5,
        fat: 2,
      };
    });

    const newIngredients = await Promise.all(ingredientPromises);
    
    setIngredients(newIngredients);
    setIsImportingMeal(false);
    setShowMealDB(false);
    setSelectedMeal(null);
    setShowCreator(true);
  };

  // URL Import function
  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setIsParsingUrl(true);
    setUrlError('');

    try {
      const apiKey = aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey;
      const parsed = await parseRecipeFromUrl(urlInput, aiSettings.provider, apiKey);
      if (parsed && parsed.ingredients && parsed.ingredients.length > 0) {
        setRecipeName(parsed.title || 'Imported Recipe');
        setServings(parsed.servings || 4);
        setRecipeInstructions(parsed.instructions || null);

        const newIngredients = parsed.ingredients.map((ing: any, idx: number) => ({
          id: `url-${Date.now()}-${idx}`,
          name: ing.name || ing,
          quantity: 1,
          calories: ing.calories || 50,
          protein: ing.protein || 2,
          carbs: ing.carbs || 5,
          fat: ing.fat || 2,
        }));

        setIngredients(newIngredients);
        setShowUrlImport(false);
        setShowCreator(true);
        setUrlInput('');
      } else {
        setUrlError('Could not extract recipe from URL');
      }
    } catch (error) {
      setUrlError('Failed to parse recipe URL');
    } finally {
      setIsParsingUrl(false);
    }
  };

  // Spoonacular search
  const handleSpoonacularSearch = async () => {
    if (!spoonacularQuery.trim() || !aiSettings.spoonacularApiKey) return;
    setIsSpoonacularSearching(true);

    try {
      const results = await searchSpoonacularRecipes(spoonacularQuery, aiSettings.spoonacularApiKey);
      setSpoonacularResults(results);
    } catch (error: any) {
      alert(error.message || 'Search failed');
    } finally {
      setIsSpoonacularSearching(false);
    }
  };

  // Import from Spoonacular
  const importSpoonacularRecipe = async (id: number) => {
    if (!aiSettings.spoonacularApiKey) return;
    setIsImportingSpoonacular(true);

    try {
      const recipe = await getSpoonacularRecipe(id, aiSettings.spoonacularApiKey);
      if (recipe) {
        setRecipeName(recipe.title);
        setServings(recipe.servings || 4);
        setRecipeImageUrl(recipe.image);
        setRecipeInstructions(recipe.instructions?.replace(/<[^>]*>/g, '') || null);

        const nutrition = extractNutrition(recipe);
        const perIngredient = {
          calories: Math.round(nutrition.calories / (recipe.extendedIngredients?.length || 1)),
          protein: Math.round(nutrition.protein / (recipe.extendedIngredients?.length || 1)),
          carbs: Math.round(nutrition.carbs / (recipe.extendedIngredients?.length || 1)),
          fat: Math.round(nutrition.fat / (recipe.extendedIngredients?.length || 1)),
        };

        const newIngredients = (recipe.extendedIngredients || []).map((ing, idx) => ({
          id: `spoon-${Date.now()}-${idx}`,
          name: ing.original || ing.name,
          quantity: 1,
          calories: perIngredient.calories,
          protein: perIngredient.protein,
          carbs: perIngredient.carbs,
          fat: perIngredient.fat,
        }));

        setIngredients(newIngredients);
        setShowSpoonacular(false);
        setShowCreator(true);
        setSpoonacularResults([]);
        setSpoonacularQuery('');
      }
    } catch (error) {
      alert('Failed to import recipe');
    } finally {
      setIsImportingSpoonacular(false);
    }
  };

  // Share recipe
  const shareRecipe = async (recipe: Recipe) => {
    const text = `${recipe.name}\n\nIngredients:\n${recipe.ingredients.map(i => `- ${i.name}`).join('\n')}\n\nNutrition per serving:\n- Calories: ${Math.round(recipe.ingredients.reduce((a, i) => a + i.calories, 0) / recipe.servings)}\n- Protein: ${Math.round(recipe.ingredients.reduce((a, i) => a + i.protein, 0) / recipe.servings)}g\n- Carbs: ${Math.round(recipe.ingredients.reduce((a, i) => a + i.carbs, 0) / recipe.servings)}g\n- Fat: ${Math.round(recipe.ingredients.reduce((a, i) => a + i.fat, 0) / recipe.servings)}g${recipe.instructions ? '\n\nInstructions:\n' + recipe.instructions : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.name, text });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Recipe copied to clipboard!');
    }
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
      amount: ing.quantity,
      unit: "serving",
      calories: Math.round(ing.calories * ing.quantity),
      protein: Math.round(ing.protein * ing.quantity * 10) / 10,
      carbs: Math.round(ing.carbs * ing.quantity * 10) / 10,
      fat: Math.round(ing.fat * ing.quantity * 10) / 10,
    }));

    const recipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      servings,
      ingredients: recipeIngredients,
      createdAt: new Date(),
      imageUrl: recipeImageUrl || undefined,
      instructions: recipeInstructions || undefined,
    };

    addRecipe(recipe);
    setShowCreator(false);
    setRecipeName('');
    setServings(4);
    setIngredients([]);
    setRecipeImageUrl(null);
    setRecipeInstructions(null);
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
            onClick={() => setShowUrlImport(true)}
            className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl text-left"
          >
            <Link2 className="mb-2" size={24} />
            <p className="font-semibold">Import URL</p>
            <p className="text-blue-200 text-sm">Paste recipe link</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSpoonacular(true)}
            className="bg-gradient-to-br from-teal-600 to-teal-700 p-4 rounded-2xl text-left"
          >
            <Search className="mb-2" size={24} />
            <p className="font-semibold">Spoonacular</p>
            <p className="text-teal-200 text-sm">Search recipes</p>
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
                    onClick={() => setViewingRecipe(recipe)}
                    className="bg-gray-900 rounded-2xl p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                        ) : (
                          <ChefHat size={24} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg truncate pr-2">{recipe.name}</h3>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); shareRecipe(recipe); }}
                                className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                              >
                                <Share2 size={18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeRecipe(recipe.id); }}
                                className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {recipe.ingredients.length} ingredients • {recipe.servings} servings
                        </p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-orange-400">{Math.round(recipeCalories / recipe.servings)} cal</span>
                          <span className="text-blue-400">{Math.round(recipeProtein / recipe.servings)}g P</span>
                          <span className="text-green-400">{Math.round(recipeCarbs / recipe.servings)}g C</span>
                        </div>
                      </div>
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
      {/* View Recipe Modal */}
      <AnimatePresence>
        {viewingRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
            onClick={() => setViewingRecipe(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-48 bg-gray-800">
                {viewingRecipe.imageUrl ? (
                  <img src={viewingRecipe.imageUrl} alt={viewingRecipe.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat size={64} className="text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                <button
                  onClick={() => setViewingRecipe(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
                >
                  <X size={24} />
                </button>
                <h2 className="absolute bottom-4 left-4 text-2xl font-bold">{viewingRecipe.name}</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-orange-400">{Math.round(viewingRecipe.ingredients.reduce((s: number, i: any) => s + i.calories, 0) / viewingRecipe.servings)}</p>
                    <p className="text-xs text-gray-400">Calories</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-blue-400">{Math.round(viewingRecipe.ingredients.reduce((s: number, i: any) => s + i.protein, 0) / viewingRecipe.servings)}g</p>
                    <p className="text-xs text-gray-400">Protein</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-400">{Math.round(viewingRecipe.ingredients.reduce((s: number, i: any) => s + i.carbs, 0) / viewingRecipe.servings)}g</p>
                    <p className="text-xs text-gray-400">Carbs</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-yellow-400">{Math.round(viewingRecipe.ingredients.reduce((s: number, i: any) => s + i.fat, 0) / viewingRecipe.servings)}g</p>
                    <p className="text-xs text-gray-400">Fat</p>
                  </div>
                </div>
                <p className="text-center text-gray-400 text-sm">Per serving ({viewingRecipe.servings} servings total)</p>
                <div>
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {viewingRecipe.ingredients.map((ing: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                        <span>{ing.name}</span>
                        <span className="text-gray-400 text-sm">{ing.calories} cal</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {viewingRecipe.instructions && (
                  <div>
                    <h3 className="font-semibold mb-3">Instructions</h3>
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                        {viewingRecipe.instructions}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { removeRecipe(viewingRecipe.id); setViewingRecipe(null); }}
                  className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold flex items-center justify-center gap-2 mb-8"
                >
                  <Trash2 size={18} /> Delete Recipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      

        {/* URL Import Modal */}
        {showUrlImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Import from URL</h2>
                <button onClick={() => { setShowUrlImport(false); setUrlError(''); }} className="p-2">
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Paste a recipe URL from any website (AllRecipes, BBC Good Food, etc.)
              </p>

              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.allrecipes.com/recipe/..."
                className="w-full bg-gray-800 rounded-xl px-4 py-3 mb-4"
              />

              {urlError && (
                <p className="text-red-400 text-sm mb-4">{urlError}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleUrlImport}
                disabled={isParsingUrl || !urlInput.trim()}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
              >
                {isParsingUrl ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Parsing...
                  </span>
                ) : (
                  'Import Recipe'
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Spoonacular Modal */}
        {showSpoonacular && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-50 overflow-auto"
          >
            <div className="p-4 pb-24">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => { setShowSpoonacular(false); setSpoonacularResults([]); }} className="p-2 -ml-2">
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Spoonacular Recipes</h1>
              </div>


              {/* Search */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={spoonacularQuery}
                  onChange={(e) => setSpoonacularQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpoonacularSearch()}
                  placeholder="Search recipes..."
                  className="flex-1 bg-gray-800 rounded-xl px-4 py-3"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSpoonacularSearch}
                  disabled={isSpoonacularSearching || !aiSettings.spoonacularApiKey}
                  className="bg-green-500 text-white rounded-xl px-4 disabled:opacity-50"
                >
                  {isSpoonacularSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </motion.button>
              </div>

              {/* Results */}
              <div className="space-y-3">
                {spoonacularResults.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => importSpoonacularRecipe(recipe.id)}
                    className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer"
                  >
                    {recipe.image && (
                      <img src={recipe.image} alt={recipe.title} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{recipe.title}</p>
                      <p className="text-gray-400 text-sm">Tap to import</p>
                    </div>
                    {isImportingSpoonacular ? (
                      <Loader2 className="animate-spin text-green-400" size={20} />
                    ) : (
                      <Plus className="text-green-400" size={20} />
                    )}
                  </motion.div>
                ))}
              </div>

              {spoonacularResults.length === 0 && aiSettings.spoonacularApiKey && (
                <p className="text-gray-500 text-center mt-8">Search for recipes above</p>
              )}

              {!aiSettings.spoonacularApiKey && (
                <div className="text-center mt-8">
                  <p className="text-gray-500 mb-2">Get a free API key at:</p>
                  <a href="https://spoonacular.com/food-api" target="_blank" className="text-green-400 underline">
                    spoonacular.com/food-api
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
