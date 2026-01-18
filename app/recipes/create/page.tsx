"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ChefHat,
  Plus,
  Minus,
  Search,
  Globe,
  BookOpen,
  Trash2,
  Check,
  X,
  Loader2,
  Flame,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  searchSpoonacularRecipes,
  getSpoonacularRecipe,
  getRandomSpoonacularRecipes,
  extractNutrition,
  SpoonacularSearchResult,
  SpoonacularRecipe,
} from "@/lib/spoonacular-api";

type TabType = "manual" | "browse";

interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

export default function CreateRecipePage() {
  const router = useRouter();
  const { addRecipe, aiSettings } = useAppStore();
  const spoonacularApiKey = aiSettings.spoonacularApiKey;
  
  const [activeTab, setActiveTab] = useState<TabType>("manual");
  
  // Manual recipe state
  const [name, setName] = useState("");
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // New ingredient form
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    amount: 1,
    unit: "piece",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  
  // Browse state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpoonacularSearchResult[]>([]);
  const [randomRecipes, setRandomRecipes] = useState<SpoonacularRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SpoonacularRecipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [error, setError] = useState("");

  const hasApiKey = !!spoonacularApiKey;

  // Add ingredient to list
  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    
    setIngredients([
      ...ingredients,
      {
        ...newIngredient,
        id: Date.now().toString(),
      },
    ]);
    setNewIngredient({
      name: "",
      amount: 1,
      unit: "piece",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    setShowIngredientForm(false);
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  // Calculate total nutrition
  const totalNutrition = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save manual recipe
  const saveRecipe = () => {
    if (!name.trim() || ingredients.length === 0) return;
    
    addRecipe({
      id: Date.now().toString(),
      name: name.trim(),
      servings,
      ingredients,
      instructions: instructions.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      createdAt: new Date(),
      source: "manual",
    });
    
    router.push("/recipes");
  };

  // Search Spoonacular
  const handleSearch = async () => {
    if (!searchQuery.trim() || !hasApiKey) return;
    
    setIsSearching(true);
    setError("");
    
    try {
      const results = await searchSpoonacularRecipes(searchQuery, spoonacularApiKey);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Load random recipes
  const loadRandomRecipes = async () => {
    if (!hasApiKey) return;
    
    setIsLoadingRandom(true);
    setError("");
    
    try {
      const recipes = await getRandomSpoonacularRecipes(spoonacularApiKey, 6);
      setRandomRecipes(recipes);
    } catch (err: any) {
      setError(err.message || "Failed to load recipes");
    } finally {
      setIsLoadingRandom(false);
    }
  };

  // Select recipe from search
  const selectRecipe = async (id: number) => {
    if (!hasApiKey) return;
    
    setIsLoadingRecipe(true);
    setError("");
    
    try {
      const recipe = await getSpoonacularRecipe(id, spoonacularApiKey);
      if (recipe) {
        setSelectedRecipe(recipe);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recipe");
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // Import Spoonacular recipe
  const importRecipe = () => {
    if (!selectedRecipe) return;
    
    const nutrition = extractNutrition(selectedRecipe);
    const ingredientCount = selectedRecipe.extendedIngredients?.length || 1;
    const perIngredient = {
      calories: Math.round(nutrition.calories / ingredientCount),
      protein: Math.round(nutrition.protein / ingredientCount),
      carbs: Math.round(nutrition.carbs / ingredientCount),
      fat: Math.round(nutrition.fat / ingredientCount),
    };
    
    const importedIngredients = (selectedRecipe.extendedIngredients || []).map((ing, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit || "piece",
      ...perIngredient,
    }));
    
    addRecipe({
      id: Date.now().toString(),
      name: selectedRecipe.title,
      servings: selectedRecipe.servings,
      ingredients: importedIngredients,
      instructions: selectedRecipe.instructions || undefined,
      imageUrl: selectedRecipe.image,
      createdAt: new Date(),
      source: "api",
      sourceUrl: `https://spoonacular.com/recipes/${selectedRecipe.id}`,
    });
    
    router.push("/recipes");
  };

  return (
    <PageContainer>
      <Header title="Create Recipe" showBack />

      <PageContent>
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-emerald-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <BookOpen size={18} />
            Manual
          </button>
          <button
            onClick={() => {
              setActiveTab("browse");
              if (hasApiKey && randomRecipes.length === 0) {
                loadRandomRecipes();
              }
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "browse"
                ? "bg-emerald-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <Globe size={18} />
            Browse Online
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "manual" ? (
            <motion.div key="manual" {...fadeUp}>
              {/* Recipe Name */}
              <Card className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chicken Stir Fry"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </Card>

              {/* Servings */}
              <Card className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                    {servings}
                  </span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </Card>

              {/* Ingredients */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Ingredients ({ingredients.length})
                  </label>
                  <button
                    onClick={() => setShowIngredientForm(true)}
                    className="text-sm text-emerald-600 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <ChefHat size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No ingredients yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{ing.name}</p>
                          <p className="text-sm text-gray-500">
                            {ing.amount} {ing.unit} • {ing.calories} cal
                          </p>
                        </div>
                        <button
                          onClick={() => removeIngredient(ing.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Ingredient Form */}
                <AnimatePresence>
                  {showIngredientForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
                    >
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Ingredient name"
                          value={newIngredient.name}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, name: e.target.value })
                          }
                          className="col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newIngredient.amount}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, amount: parseFloat(e.target.value) || 0 })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                          value={newIngredient.unit}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, unit: e.target.value })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="piece">piece</option>
                          <option value="g">grams</option>
                          <option value="oz">oz</option>
                          <option value="cup">cup</option>
                          <option value="tbsp">tbsp</option>
                          <option value="tsp">tsp</option>
                          <option value="ml">ml</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Calories"
                          value={newIngredient.calories}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, calories: parseInt(e.target.value) || 0 })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Protein (g)"
                          value={newIngredient.protein}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, protein: parseInt(e.target.value) || 0 })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Carbs (g)"
                          value={newIngredient.carbs}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, carbs: parseInt(e.target.value) || 0 })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Fat (g)"
                          value={newIngredient.fat}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, fat: parseInt(e.target.value) || 0 })
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowIngredientForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={addIngredient}
                          className="flex-1"
                        >
                          Add
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Instructions */}
              <Card className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (optional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step by step cooking instructions..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </Card>

              {/* Image URL */}
              <Card className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </Card>

              {/* Nutrition Summary */}
              {ingredients.length > 0 && (
                <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                  <h3 className="font-medium text-gray-900 mb-3">Total Nutrition</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-orange-500">{totalNutrition.calories}</p>
                      <p className="text-xs text-gray-500">Calories</p>
                    </div>
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-red-500">{totalNutrition.protein}g</p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-blue-500">{totalNutrition.carbs}g</p>
                      <p className="text-xs text-gray-500">Carbs</p>
                    </div>
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-yellow-500">{totalNutrition.fat}g</p>
                      <p className="text-xs text-gray-500">Fat</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Per serving: {Math.round(totalNutrition.calories / servings)} cal
                  </p>
                </Card>
              )}

              {/* Save Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={saveRecipe}
                disabled={!name.trim() || ingredients.length === 0}
                className="w-full"
              >
                <Check size={20} className="mr-2" />
                Save Recipe
              </Button>
            </motion.div>
          ) : (
            <motion.div key="browse" {...fadeUp}>
              {!hasApiKey ? (
                <Card className="text-center py-8">
                  <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="font-semibold text-gray-900 mb-2">API Key Required</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your Spoonacular API key in Settings → API Settings to browse online recipes.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/settings/api")}
                  >
                    Go to API Settings
                  </Button>
                </Card>
              ) : selectedRecipe ? (
                /* Recipe Detail View */
                <div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-700"
                  >
                    <X size={18} /> Back to search
                  </button>
                  
                  <Card className="mb-4 overflow-hidden">
                    {selectedRecipe.image && (
                      <img
                        src={selectedRecipe.image}
                        alt={selectedRecipe.title}
                        className="w-full h-48 object-cover -mx-4 -mt-4 mb-4"
                        style={{ width: "calc(100% + 2rem)" }}
                      />
                    )}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedRecipe.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users size={16} /> {selectedRecipe.servings} servings
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {selectedRecipe.readyInMinutes} min
                      </span>
                    </div>
                    
                    {/* Nutrition */}
                    {selectedRecipe.nutrition && (
                      <div className="grid grid-cols-4 gap-2 text-center mb-4">
                        {(() => {
                          const n = extractNutrition(selectedRecipe);
                          return (
                            <>
                              <div className="p-2 bg-orange-50 rounded-lg">
                                <p className="font-bold text-orange-500">{n.calories}</p>
                                <p className="text-xs text-gray-500">cal</p>
                              </div>
                              <div className="p-2 bg-red-50 rounded-lg">
                                <p className="font-bold text-red-500">{n.protein}g</p>
                                <p className="text-xs text-gray-500">protein</p>
                              </div>
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <p className="font-bold text-blue-500">{n.carbs}g</p>
                                <p className="text-xs text-gray-500">carbs</p>
                              </div>
                              <div className="p-2 bg-yellow-50 rounded-lg">
                                <p className="font-bold text-yellow-500">{n.fat}g</p>
                                <p className="text-xs text-gray-500">fat</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Ingredients */}
                    <h3 className="font-medium text-gray-900 mb-2">
                      Ingredients ({selectedRecipe.extendedIngredients?.length || 0})
                    </h3>
                    <ul className="space-y-1 mb-4">
                      {selectedRecipe.extendedIngredients?.map((ing, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          • {ing.original}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={importRecipe}
                    className="w-full"
                  >
                    <Plus size={20} className="mr-2" />
                    Import Recipe
                  </Button>
                </div>
              ) : (
                /* Search & Browse View */
                <div>
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search recipes online..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-11 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Search Results</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {searchResults.map((recipe) => (
                          <Card
                            key={recipe.id}
                            onClick={() => selectRecipe(recipe.id)}
                            className="cursor-pointer p-0 overflow-hidden"
                          >
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-full h-24 object-cover"
                            />
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {recipe.title}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Random Recipes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" />
                        Discover Recipes
                      </h3>
                      <button
                        onClick={loadRandomRecipes}
                        disabled={isLoadingRandom}
                        className="text-sm text-emerald-600 font-medium"
                      >
                        {isLoadingRandom ? "Loading..." : "Refresh"}
                      </button>
                    </div>
                    
                    {isLoadingRandom ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                      </div>
                    ) : randomRecipes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {randomRecipes.map((recipe) => (
                          <Card
                            key={recipe.id}
                            onClick={() => setSelectedRecipe(recipe)}
                            className="cursor-pointer p-0 overflow-hidden"
                          >
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-full h-24 object-cover"
                            />
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {recipe.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} /> {recipe.readyInMinutes}m
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users size={12} /> {recipe.servings}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center py-8 border-dashed">
                        <Globe size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">Click Refresh to discover recipes</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {isLoadingRecipe && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                    <span>Loading recipe...</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PageContent>
    </PageContainer>
  );
}
