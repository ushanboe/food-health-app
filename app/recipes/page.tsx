"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, ChefHat, Link, Search, X, 
  Loader2, Globe, Package, Check, Minus, BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, Recipe } from '@/lib/store';
import { parseRecipeFromUrl, searchIngredient, ParsedRecipe } from '@/lib/recipe-parser';

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  servingSize?: string;
}

export default function RecipesPage() {
  const router = useRouter();
  const { recipes, addRecipe, removeRecipe, aiSettings } = useAppStore();

  const [showCreator, setShowCreator] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate totals
  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.nutrition.calories * ing.quantity),
      protein: acc.protein + (ing.nutrition.protein * ing.quantity),
      carbs: acc.carbs + (ing.nutrition.carbs * ing.quantity),
      fat: acc.fat + (ing.nutrition.fat * ing.quantity),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
  };

  // Import recipe from URL
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;

    setIsImporting(true);
    setImportError('');

    try {
      const parsed = await parseRecipeFromUrl(importUrl, aiSettings.provider, aiSettings.provider === "gemini" ? aiSettings.geminiApiKey : aiSettings.openaiApiKey);

      setRecipeName(parsed.title);
      setServings(parsed.servings || 4);

      // Convert parsed ingredients to our format
      // We'll need to search for nutrition data for each
      const ingredientsWithNutrition: RecipeIngredient[] = [];

      for (const ing of parsed.ingredients.slice(0, 10)) {
        const results = await searchIngredient(ing.name);
        if (results.length > 0) {
          const match = results[0];
          ingredientsWithNutrition.push({
            id: `${Date.now()}-${Math.random()}`,
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 1,
            nutrition: match.nutrition,
            servingSize: match.servingSize,
          });
        } else {
          // Add with zero nutrition if not found
          ingredientsWithNutrition.push({
            id: `${Date.now()}-${Math.random()}`,
            name: ing.original || ing.name,
            quantity: 1,
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          });
        }
      }

      setIngredients(ingredientsWithNutrition);
      setShowUrlImport(false);
      setShowCreator(true);
      setImportUrl('');
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import recipe. Please check the URL and try again.');
    } finally {
      setIsImporting(false);
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
    const newIngredient: RecipeIngredient = {
      id: `${Date.now()}-${Math.random()}`,
      name: item.brand ? `${item.name} (${item.brand})` : item.name,
      quantity: 1,
      nutrition: item.nutrition,
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
      ing.id === id 
        ? { ...ing, quantity: Math.max(0.5, ing.quantity + delta) }
        : ing
    ));
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  // Save recipe
  const saveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    const recipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      ingredients: ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        calories: ing.nutrition.calories,
        protein: ing.nutrition.protein,
        carbs: ing.nutrition.carbs,
        fat: ing.nutrition.fat,
        servingSize: ing.servingSize,
      })),
      servings,
      createdAt: new Date(),
    };

    addRecipe(recipe);
    resetCreator();
  };

  // Reset creator
  const resetCreator = () => {
    setShowCreator(false);
    setRecipeName('');
    setServings(4);
    setIngredients([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Recipe Builder</h1>
          <p className="text-gray-400 text-sm">Create custom meals</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUrlImport(true)}
            className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl text-left"
          >
            <Globe className="mb-2" size={24} />
            <p className="font-semibold">Import from URL</p>
            <p className="text-blue-200 text-sm">Paste recipe link</p>
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
              <p className="text-gray-500 text-sm">Import from URL or create manually</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => (
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
                        <span className="text-orange-400">
                          {Math.round(recipe.ingredients.reduce((sum, i) => sum + i.calories * i.quantity, 0) / recipe.servings)} cal
                        </span>
                        <span className="text-blue-400">
                          {Math.round(recipe.ingredients.reduce((sum, i) => sum + i.protein * i.quantity, 0) / recipe.servings)}g protein
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRecipe(recipe.id)}
                      className="p-2 text-red-400 hover:bg-red-400/20 rounded-full"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* URL Import Modal */}
      <AnimatePresence>
        {showUrlImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => setShowUrlImport(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Import Recipe from URL</h2>
                <button onClick={() => setShowUrlImport(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-400 mb-4">
                Paste a recipe URL from any website. AI will extract the ingredients.
              </p>

              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com/recipe..."
                className="w-full bg-gray-800 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {importError && (
                <p className="text-red-400 text-sm mb-4">{importError}</p>
              )}

              {aiSettings.provider === 'demo' && (
                <p className="text-yellow-400 text-sm mb-4 bg-yellow-400/10 p-3 rounded-xl">
                  ⚠️ Demo mode: Will return sample data. Set up AI in Settings for real parsing.
                </p>
              )}

              <button
                onClick={handleUrlImport}
                disabled={isImporting || !importUrl.trim()}
                className="w-full bg-blue-600 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Globe size={20} />
                    Import Recipe
                  </>
                )}
              </button>
            </motion.div>
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
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Recipe</h2>
                <button onClick={resetCreator} className="p-2">
                  <X size={24} />
                </button>
              </div>

              {/* Recipe Name */}
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Recipe name..."
                className="w-full bg-gray-800 rounded-xl px-4 py-3 mb-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Servings */}
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 mb-4">
                <span className="text-gray-400">Servings</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-xl font-bold w-8 text-center">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Ingredients ({ingredients.length})</h3>
                  <button
                    onClick={() => setShowIngredientSearch(true)}
                    className="text-purple-400 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-4 text-center text-gray-400">
                    <Package className="mx-auto mb-2" size={24} />
                    <p>No ingredients yet</p>
                    <p className="text-sm">Tap "Add" to search</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ing.name}</p>
                          <p className="text-gray-400 text-xs">
                            {ing.servingSize} • {Math.round(ing.nutrition.calories * ing.quantity)} cal
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(ing.id, -0.5)}
                            className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm">{ing.quantity}</span>
                          <button
                            onClick={() => updateQuantity(ing.id, 0.5)}
                            className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeIngredient(ing.id)}
                          className="p-1 text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nutrition Summary */}
              {ingredients.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-4 mb-4">
                  <p className="text-gray-400 text-sm mb-2">Per Serving</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-orange-400">{perServing.calories}</p>
                      <p className="text-xs text-gray-400">cal</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{perServing.protein}g</p>
                      <p className="text-xs text-gray-400">protein</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">{perServing.carbs}g</p>
                      <p className="text-xs text-gray-400">carbs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">{perServing.fat}g</p>
                      <p className="text-xs text-gray-400">fat</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveRecipe}
                disabled={!recipeName.trim() || ingredients.length === 0}
                className="w-full bg-purple-600 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Save Recipe
              </button>
            </motion.div>
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
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-purple-600 px-4 rounded-xl"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-3">
                Searching Open Food Facts database
              </p>

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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.brand && <p className="text-gray-400 text-sm truncate">{item.brand}</p>}
                        <p className="text-orange-400 text-sm">{Math.round(item.nutrition.calories)} cal/100g</p>
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
