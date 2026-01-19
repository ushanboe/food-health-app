"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore, Recipe } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Plus,
  ChefHat,
  Clock,
  Users,
  Flame,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Star,
  Share2,
  Calculator,
  Globe,
  Sparkles,
  BookOpen,
  Shuffle,
  Download,
  ExternalLink,
  Play,
  ArrowLeft,
  X,
  UtensilsCrossed,
} from "lucide-react";
import {
  searchSpoonacularRecipes,
  getSpoonacularRecipe,
  getRandomSpoonacularRecipes,
  SpoonacularRecipe,
  SpoonacularSearchResult,
} from "@/lib/spoonacular-api";
import {
  searchMeals,
  getRandomMeal,
  getCategories,
  getMealsByCategory,
  getAreas,
  getMealsByArea,
  getMealById,
  MealDBMeal,
  MealDBMealSimple,
  MealDBCategory,
} from "@/lib/mealdb-api";
import { extractNutrition } from "@/lib/spoonacular-api";
import { quickEstimateIngredients, calculateIngredientsNutrition } from "@/lib/nutrition-api";

type OnlineTab = "spoonacular" | "mealdb";

// Union type for meal results (can be full or simple)
type MealResult = MealDBMeal | MealDBMealSimple;

export default function RecipesPage() {
  const router = useRouter();
  const { recipes, removeRecipe, updateRecipe, addRecipe, aiSettings } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Online search state
  const [showOnlineSearch, setShowOnlineSearch] = useState(false);
  const [onlineTab, setOnlineTab] = useState<OnlineTab>("mealdb");
  
  // Spoonacular state
  const [spoonSearch, setSpoonSearch] = useState("");
  const [spoonResults, setSpoonResults] = useState<(SpoonacularSearchResult | SpoonacularRecipe)[]>([]);
  const [spoonLoading, setSpoonLoading] = useState(false);
  const [selectedSpoonRecipe, setSelectedSpoonRecipe] = useState<SpoonacularRecipe | null>(null);

  // MealDB state - use union type for results
  const [mealSearch, setMealSearch] = useState("");
  const [mealResults, setMealResults] = useState<MealResult[]>([]);
  const [mealLoading, setMealLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealDBMeal | null>(null);
  const [mealCategories, setMealCategories] = useState<MealDBCategory[]>([]);
  const [mealAreas, setMealAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // Load MealDB categories and areas on mount
  useEffect(() => {
    const loadMealDBData = async () => {
      const [cats, areas] = await Promise.all([getCategories(), getAreas()]);
      setMealCategories(cats);
      setMealAreas(areas);
    };
    loadMealDBData();
  }, []);

  // Sort recipes by rating (highest first), then by date
  const sortedRecipes = [...recipes].sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingB !== ratingA) return ratingB - ratingA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredRecipes = sortedRecipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalNutrition = (recipe: Recipe) => {
    return recipe.ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleRate = (recipeId: string, rating: number) => {
    updateRecipe(recipeId, { rating });
    setShowRatingModal(null);
  };

  const handleShare = async (recipe: Recipe) => {
    const nutrition = getTotalNutrition(recipe);
    const text = `Check out this recipe: ${recipe.name}\n\n` +
      `Servings: ${recipe.servings}\n` +
      `Calories: ${Math.round(nutrition.calories / recipe.servings)} per serving\n` +
      `Ingredients: ${recipe.ingredients.length}\n\n` +
      `Shared from FitFork 🍴`;

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.name, text });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert("Recipe copied to clipboard!");
    }
  };

  const handleDelete = (recipeId: string) => {
    removeRecipe(recipeId);
    setShowDeleteConfirm(null);
    if (currentIndex >= filteredRecipes.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Count recipes with zero nutrition
  const recipesWithoutNutrition = recipes.filter(r => {
    const total = r.ingredients.reduce((sum, ing) => sum + (ing.calories || 0), 0);
    return total === 0;
  });

  // Batch recalculate nutrition for all recipes without nutrition data
  const handleRecalculateAll = async () => {
    if (recipesWithoutNutrition.length === 0) return;
    
    setIsRecalculatingAll(true);
    
    for (const recipe of recipesWithoutNutrition) {
      try {
        const ingredientsWithNutrition = quickEstimateIngredients(
          recipe.ingredients.map(ing => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          }))
        );
        
        const updatedIngredients = recipe.ingredients.map((ing, idx) => ({
          ...ing,
          calories: ingredientsWithNutrition[idx]?.nutrition.calories || 0,
          protein: ingredientsWithNutrition[idx]?.nutrition.protein || 0,
          carbs: ingredientsWithNutrition[idx]?.nutrition.carbs || 0,
          fat: ingredientsWithNutrition[idx]?.nutrition.fat || 0,
        }));
        
        updateRecipe(recipe.id, { ingredients: updatedIngredients });
      } catch (error) {
        console.error('Error recalculating nutrition for recipe:', recipe.name, error);
      }
    }
    
    setIsRecalculatingAll(false);
  };

  const nextRecipe = () => {
    if (currentIndex < filteredRecipes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevRecipe = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 && currentIndex < filteredRecipes.length - 1) {
      nextRecipe();
    } else if (info.offset.x > 50 && currentIndex > 0) {
      prevRecipe();
    }
  };

  // Spoonacular functions
  const searchSpoonacular = async () => {
    if (!spoonSearch || !aiSettings.spoonacularApiKey) return;
    setSpoonLoading(true);
    try {
      const results = await searchSpoonacularRecipes(spoonSearch, aiSettings.spoonacularApiKey);
      setSpoonResults(results);
    } catch (error) {
      console.error("Spoonacular search error:", error);
    }
    setSpoonLoading(false);
  };

  const getRandomSpoonacular = async () => {
    if (!aiSettings.spoonacularApiKey) return;
    setSpoonLoading(true);
    try {
      const results = await getRandomSpoonacularRecipes(aiSettings.spoonacularApiKey, 6);
      setSpoonResults(results);
    } catch (error) {
      console.error("Spoonacular random error:", error);
    }
    setSpoonLoading(false);
  };

  const selectSpoonRecipe = async (recipe: SpoonacularSearchResult | SpoonacularRecipe) => {
    if (!aiSettings.spoonacularApiKey) return;
    setSpoonLoading(true);
    try {
      const detailed = await getSpoonacularRecipe(recipe.id, aiSettings.spoonacularApiKey);
      setSelectedSpoonRecipe(detailed);
    } catch (error) {
      console.error("Spoonacular detail error:", error);
    }
    setSpoonLoading(false);
  };

  const importSpoonRecipe = () => {
    if (!selectedSpoonRecipe) return;

    // Extract total nutrition from Spoonacular response
    const totalNutrition = extractNutrition(selectedSpoonRecipe);
    const ingredientCount = selectedSpoonRecipe.extendedIngredients?.length || 1;
    const servings = selectedSpoonRecipe.servings || 4;
    
    // Distribute nutrition across ingredients (rough estimate)
    // This gives a reasonable approximation for display purposes
    const perIngredient = {
      calories: Math.round(totalNutrition.calories / ingredientCount),
      protein: Math.round((totalNutrition.protein / ingredientCount) * 10) / 10,
      carbs: Math.round((totalNutrition.carbs / ingredientCount) * 10) / 10,
      fat: Math.round((totalNutrition.fat / ingredientCount) * 10) / 10,
    };

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: selectedSpoonRecipe.title,
      servings: servings,
      ingredients: (selectedSpoonRecipe.extendedIngredients || []).map((ing, idx) => ({
        id: idx.toString(),
        name: ing.name || ing.original,
        amount: ing.amount || 0,
        unit: ing.unit || "",
        // Use distributed nutrition from API
        calories: perIngredient.calories,
        protein: perIngredient.protein,
        carbs: perIngredient.carbs,
        fat: perIngredient.fat,
      })),
      instructions: selectedSpoonRecipe.instructions
        ? selectedSpoonRecipe.instructions.replace(/<[^>]*>/g, "")
        : "",
      imageUrl: selectedSpoonRecipe.image,
      source: "imported",
      createdAt: new Date(),
    };

    addRecipe(newRecipe);
    // Navigate to show the newly saved recipe
    // Since recipes are sorted by rating then date, find where this recipe will be
    const updatedRecipes = [...(recipes || []), newRecipe].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const newIndex = updatedRecipes.findIndex(r => r.id === newRecipe.id);
    if (newIndex !== -1) setCurrentIndex(newIndex);

    setSelectedSpoonRecipe(null);
    setSpoonResults([]);
    setSpoonSearch("");
    setShowOnlineSearch(false);
  };

  // MealDB functions
  const searchMealDB = async () => {
    if (!mealSearch) return;
    setMealLoading(true);
    try {
      const results = await searchMeals(mealSearch);
      setMealResults(results);
    } catch (error) {
      console.error("MealDB search error:", error);
    }
    setMealLoading(false);
  };

  const getRandomMealDB = async () => {
    setMealLoading(true);
    try {
      const meals: MealDBMeal[] = [];
      for (let i = 0; i < 6; i++) {
        const meal = await getRandomMeal();
        if (meal) meals.push(meal);
      }
      setMealResults(meals);
    } catch (error) {
      console.error("MealDB random error:", error);
    }
    setMealLoading(false);
  };

  const loadByCategory = async (category: string) => {
    setSelectedCategory(category);
    setSelectedArea("");
    setMealLoading(true);
    try {
      const results = await getMealsByCategory(category);
      setMealResults(results);
    } catch (error) {
      console.error("MealDB category error:", error);
    }
    setMealLoading(false);
  };

  const loadByArea = async (area: string) => {
    setSelectedArea(area);
    setSelectedCategory("");
    setMealLoading(true);
    try {
      const results = await getMealsByArea(area);
      setMealResults(results);
    } catch (error) {
      console.error("MealDB area error:", error);
    }
    setMealLoading(false);
  };

  const selectMeal = async (meal: MealResult) => {
    setMealLoading(true);
    try {
      const detailed = await getMealById(meal.idMeal);
      if (detailed) setSelectedMeal(detailed);
    } catch (error) {
      console.error("MealDB detail error:", error);
    }
    setMealLoading(false);
  };

  const importMealDBRecipe = () => {
    if (!selectedMeal) return;

    // Estimate nutrition for each ingredient using our local database
    const ingredientsWithNutrition = quickEstimateIngredients(
      selectedMeal.ingredients.map(ing => ({
        name: ing.name,
        amount: 1,
        unit: ing.measure || "",
      }))
    );

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: selectedMeal.strMeal,
      servings: 4,
      ingredients: ingredientsWithNutrition.map((ing, idx) => ({
        id: idx.toString(),
        name: `${selectedMeal.ingredients[idx]?.measure || ""} ${ing.name}`.trim(),
        amount: ing.amount,
        unit: ing.unit,
        calories: ing.nutrition.calories,
        protein: ing.nutrition.protein,
        carbs: ing.nutrition.carbs,
        fat: ing.nutrition.fat,
      })),
      instructions: selectedMeal.strInstructions || "",
      imageUrl: selectedMeal.strMealThumb,
      source: "imported",
      createdAt: new Date(),
    };

    addRecipe(newRecipe);
    // Navigate to show the newly saved recipe
    const updatedRecipes = [...(recipes || []), newRecipe].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const newIndex = updatedRecipes.findIndex(r => r.id === newRecipe.id);
    if (newIndex !== -1) setCurrentIndex(newIndex);

    setSelectedMeal(null);
    setMealResults([]);
    setMealSearch("");
    setShowOnlineSearch(false);
  };

  // Helper to check if meal has full details
  const isFullMeal = (meal: MealResult): meal is MealDBMeal => {
    return 'strCategory' in meal && 'ingredients' in meal;
  };

  const renderStars = (rating: number, interactive: boolean = false, recipeId?: string) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && recipeId) {
                handleRate(recipeId, star);
              }
            }}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          >
            <Star
              size={interactive ? 28 : 16}
              className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      <Header title="My Recipes" />

      <PageContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search your recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Nutrition Recalculation Banner */}
          {recipesWithoutNutrition.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Calculator size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {recipesWithoutNutrition.length} recipe{recipesWithoutNutrition.length > 1 ? 's' : ''} missing nutrition data
                    </p>
                    <p className="text-xs text-amber-600">
                      Calculate estimated nutrition values
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRecalculateAll}
                  disabled={isRecalculatingAll}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRecalculatingAll ? (
                    <>
                      <Shuffle size={16} className="animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator size={16} />
                      Calculate All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Downloaded Recipes Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <ChefHat size={20} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">Saved Recipes</h2>
                <Badge variant="default" size="sm">
                  {filteredRecipes.length}
                </Badge>
              </div>
              <button
                onClick={() => router.push("/recipes/create")}
                className="text-sm text-emerald-600 font-medium flex items-center gap-1"
              >
                <Plus size={16} /> Create
              </button>
            </div>

            {filteredRecipes.length === 0 ? (
              <Card
                className="border-2 border-dashed border-gray-200 bg-gray-50/50"
                onClick={() => router.push("/recipes/create")}
              >
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ChefHat size={40} className="mb-3" />
                  <p className="text-sm font-medium">No recipes yet</p>
                  <p className="text-xs mt-1">Create or download your first recipe</p>
                </div>
              </Card>
            ) : (
              <div className="relative">
                {/* Navigation Arrows */}
                {filteredRecipes.length > 1 && (
                  <>
                    <button
                      onClick={prevRecipe}
                      disabled={currentIndex === 0}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${currentIndex === 0 ? "opacity-30" : "hover:bg-gray-50"}`}
                    >
                      <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <button
                      onClick={nextRecipe}
                      disabled={currentIndex === filteredRecipes.length - 1}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${currentIndex === filteredRecipes.length - 1 ? "opacity-30" : "hover:bg-gray-50"}`}
                    >
                      <ChevronRight size={24} className="text-gray-600" />
                    </button>
                  </>
                )}

                {/* Swipeable Recipe Cards */}
                <div className="overflow-hidden px-6" ref={carouselRef}>
                  <AnimatePresence mode="wait">
                    {filteredRecipes.map((recipe, index) => {
                      if (index !== currentIndex) return null;
                      const nutrition = getTotalNutrition(recipe);
                      const perServing = {
                        calories: Math.round(nutrition.calories / recipe.servings),
                        protein: Math.round(nutrition.protein / recipe.servings),
                        carbs: Math.round(nutrition.carbs / recipe.servings),
                        fat: Math.round(nutrition.fat / recipe.servings),
                      };

                      return (
                        <motion.div
                          key={recipe.id}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.2}
                          onDragEnd={handleDragEnd}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <Card
                            className="overflow-hidden"
                            onClick={() => router.push(`/recipes/${recipe.id}`)}
                          >
                            {/* Recipe Image */}
                            <div className="relative h-48 -mx-4 -mt-4 mb-4">
                              {recipe.imageUrl ? (
                                <img
                                  src={recipe.imageUrl}
                                  alt={recipe.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                  <ChefHat size={48} className="text-emerald-500" />
                                </div>
                              )}
                              {/* Rating Badge */}
                              {recipe.rating && (
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-white text-sm font-medium">{recipe.rating}</span>
                                </div>
                              )}
                              {/* Source Badge */}
                              {recipe.source && (
                                <div className="absolute top-3 left-3">
                                  <Badge variant={recipe.source === "manual" ? "success" : "info"} size="sm">
                                    {recipe.source === "manual" ? "Homemade" : "Imported"}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Recipe Info */}
                            <div className="space-y-3">
                              <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                                {recipe.name}
                              </h3>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users size={16} />
                                  {recipe.servings} servings
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame size={16} />
                                  {perServing.calories} cal
                                </span>
                                <span className="text-xs text-gray-400">
                                  Pro: {perServing.protein}g  Carb: {perServing.carbs}g  Fat: {perServing.fat}g
                                </span>
                              </div>

                              {/* Rating Display */}
                              <div className="flex items-center gap-2">
                                {renderStars(recipe.rating || 0)}
                                <span className="text-sm text-gray-400">
                                  {recipe.rating ? `${recipe.rating}/5` : "Not rated"}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRatingModal(recipe.id);
                                  }}
                                  className="flex-1 py-2.5 px-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl text-yellow-600 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                  <Star size={18} />
                                  Rate
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(recipe);
                                  }}
                                  className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                  <Share2 size={18} />
                                  Share
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(recipe.id);
                                  }}
                                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination Dots */}
                {filteredRecipes.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {filteredRecipes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "w-6 bg-emerald-500" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                )}

                {/* Swipe Hint */}
                {filteredRecipes.length > 1 && currentIndex === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-gray-400 mt-2"
                  >
                    ← Swipe to see more recipes →
                  </motion.p>
                )}
              </div>
            )}
          </div>

          {/* Online Search Section */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowOnlineSearch(!showOnlineSearch)}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Globe size={20} />
              {showOnlineSearch ? "Hide Online Search" : "Browse & Download Recipes Online"}
            </button>

            <AnimatePresence>
              {showOnlineSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  {/* Tab Selector */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setOnlineTab("mealdb")}
                      className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${onlineTab === "mealdb" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                    >
                      <UtensilsCrossed size={18} />
                      TheMealDB
                      <Badge variant="success" size="sm">Free</Badge>
                    </button>
                    <button
                      onClick={() => setOnlineTab("spoonacular")}
                      className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${onlineTab === "spoonacular" ? "bg-white shadow text-emerald-600" : "text-gray-500"}`}
                    >
                      <Sparkles size={18} />
                      Spoonacular
                    </button>
                  </div>

                  {/* MealDB Tab */}
                  {onlineTab === "mealdb" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {!selectedMeal ? (
                        <>
                          {/* Search */}
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                value={mealSearch}
                                onChange={(e) => setMealSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchMealDB()}
                                placeholder="Search recipes..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                              />
                            </div>
                            <button
                              onClick={searchMealDB}
                              className="px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                            <button
                              onClick={getRandomMealDB}
                              className="px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                              title="Random recipes"
                            >
                              <Shuffle className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Categories */}
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {mealCategories.slice(0, 8).map((cat) => (
                                <button
                                  key={cat.strCategory}
                                  onClick={() => loadByCategory(cat.strCategory)}
                                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === cat.strCategory ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                  {cat.strCategory}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cuisines */}
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Cuisines</p>
                            <div className="flex flex-wrap gap-2">
                              {mealAreas.slice(0, 8).map((area) => (
                                <button
                                  key={area}
                                  onClick={() => loadByArea(area)}
                                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedArea === area ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                  {area}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Results */}
                          {mealLoading ? (
                            <div className="flex justify-center py-8">
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : mealResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {mealResults.map((meal) => (
                                <motion.button
                                  key={meal.idMeal}
                                  onClick={() => selectMeal(meal)}
                                  className="text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {meal.strMealThumb && (
                                    <img
                                      src={meal.strMealThumb}
                                      alt={meal.strMeal}
                                      className="w-full h-28 object-cover"
                                    />
                                  )}
                                  <div className="p-3">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                      {meal.strMeal}
                                    </h4>
                                    {isFullMeal(meal) && (
                                      <div className="flex items-center gap-2 mt-1">
                                        {meal.strCategory && (
                                          <span className="text-xs text-blue-500">{meal.strCategory}</span>
                                        )}
                                        {meal.strArea && (
                                          <span className="text-xs text-purple-500">{meal.strArea}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>Search or browse categories to find recipes</p>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Selected Meal Detail */
                        <div className="space-y-4">
                          <button
                            onClick={() => setSelectedMeal(null)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to results
                          </button>

                          {selectedMeal.strMealThumb && (
                            <img
                              src={selectedMeal.strMealThumb}
                              alt={selectedMeal.strMeal}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                          )}

                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedMeal.strMeal}</h2>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="info" size="sm">{selectedMeal.strCategory}</Badge>
                              <Badge variant="default" size="sm">{selectedMeal.strArea}</Badge>
                            </div>
                          </div>

                          {selectedMeal.strYoutube && (
                            <a
                              href={selectedMeal.strYoutube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <Play className="w-5 h-5" />
                              Watch Video Tutorial
                              <ExternalLink className="w-4 h-4 ml-auto" />
                            </a>
                          )}

                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedMeal.ingredients.map((ing, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                                  <span className="text-gray-400">{ing.measure}</span> {ing.name}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-line">
                              {selectedMeal.strInstructions}
                            </div>
                          </div>

                          <button
                            onClick={importMealDBRecipe}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Import Recipe
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Spoonacular Tab */}
                  {onlineTab === "spoonacular" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {!aiSettings.spoonacularApiKey ? (
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                          <h3 className="font-semibold text-gray-900 mb-2">API Key Required</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Add your Spoonacular API key in Settings → API Settings to browse recipes.
                          </p>
                          <button
                            onClick={() => router.push("/settings/api")}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium"
                          >
                            Go to API Settings
                          </button>
                        </div>
                      ) : !selectedSpoonRecipe ? (
                        <>
                          {/* Search */}
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                value={spoonSearch}
                                onChange={(e) => setSpoonSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchSpoonacular()}
                                placeholder="Search recipes..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                              />
                            </div>
                            <button
                              onClick={searchSpoonacular}
                              className="px-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                            <button
                              onClick={getRandomSpoonacular}
                              className="px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                              title="Random recipes"
                            >
                              <Shuffle className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Results */}
                          {spoonLoading ? (
                            <div className="flex justify-center py-8">
                              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : spoonResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {spoonResults.map((recipe) => (
                                <motion.button
                                  key={recipe.id}
                                  onClick={() => selectSpoonRecipe(recipe)}
                                  className="text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {recipe.image && (
                                    <img
                                      src={recipe.image}
                                      alt={recipe.title}
                                      className="w-full h-28 object-cover"
                                    />
                                  )}
                                  <div className="p-3">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                      {recipe.title}
                                    </h4>
                                    {"readyInMinutes" in recipe && recipe.readyInMinutes && (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {recipe.readyInMinutes} min
                                      </div>
                                    )}
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>Search for recipes or discover random ones</p>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Selected Recipe Detail */
                        <div className="space-y-4">
                          <button
                            onClick={() => setSelectedSpoonRecipe(null)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to results
                          </button>

                          {selectedSpoonRecipe.image && (
                            <img
                              src={selectedSpoonRecipe.image}
                              alt={selectedSpoonRecipe.title}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                          )}

                          <h2 className="text-xl font-bold text-gray-900">{selectedSpoonRecipe.title}</h2>

                          <div className="flex flex-wrap gap-3">
                            {selectedSpoonRecipe.readyInMinutes && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {selectedSpoonRecipe.readyInMinutes} min
                              </div>
                            )}
                            {selectedSpoonRecipe.servings && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                {selectedSpoonRecipe.servings} servings
                              </div>
                            )}
                            {selectedSpoonRecipe.nutrition?.nutrients?.[0] && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Flame className="w-4 h-4" />
                                {Math.round(selectedSpoonRecipe.nutrition.nutrients[0].amount)} cal
                              </div>
                            )}
                          </div>

                          {selectedSpoonRecipe.extendedIngredients && (
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                              <div className="space-y-1">
                                {selectedSpoonRecipe.extendedIngredients.map((ing, idx) => (
                                  <div key={idx} className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                                    {ing.original}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedSpoonRecipe.instructions && (
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                              <div
                                className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700"
                                dangerouslySetInnerHTML={{ __html: selectedSpoonRecipe.instructions }}
                              />
                            </div>
                          )}

                          <button
                            onClick={importSpoonRecipe}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Import Recipe
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </PageContent>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRatingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Rate this Recipe</h3>
                <button
                  onClick={() => setShowRatingModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="flex justify-center py-4">
                {renderStars(
                  recipes.find((r) => r.id === showRatingModal)?.rating || 0,
                  true,
                  showRatingModal
                )}
              </div>
              <p className="text-center text-sm text-gray-500">Tap a star to rate</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Recipe?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The recipe will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Add Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg flex items-center justify-center text-white"
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/recipes/create")}
      >
        <Plus size={28} />
      </motion.button>

      <BottomNav />
    </PageContainer>
  );
}
