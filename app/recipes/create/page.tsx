'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Shuffle,
  ChefHat,
  Clock,
  Users,
  Flame,
  Download,
  ExternalLink,
  BookOpen,
  Sparkles,
  Globe,
  UtensilsCrossed,
  Play,
  MapPin
} from 'lucide-react';
import { useAppStore, Recipe, RecipeIngredient } from '@/lib/store';
import {
  searchSpoonacularRecipes,
  getSpoonacularRecipe,
  getRandomSpoonacularRecipes,
  SpoonacularRecipe,
  SpoonacularSearchResult
} from '@/lib/spoonacular-api';
import {
  searchMeals,
  getRandomMeal,
  getCategories,
  getMealsByCategory,
  getAreas,
  getMealsByArea,
  getMealById,
  MealDBMeal,
  MealDBCategory
} from '@/lib/mealdb-api';

type TabType = 'manual' | 'spoonacular' | 'mealdb';

export default function CreateRecipePage() {
  const router = useRouter();
  const { recipes, addRecipe, aiSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  
  // Manual recipe state
  const [name, setName] = useState('');
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [newIngredient, setNewIngredient] = useState({ name: '', amount: 0, unit: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  // Spoonacular state
  const [spoonSearch, setSpoonSearch] = useState('');
  const [spoonResults, setSpoonResults] = useState<(SpoonacularSearchResult | SpoonacularRecipe)[]>([]);
  const [spoonLoading, setSpoonLoading] = useState(false);
  const [selectedSpoonRecipe, setSelectedSpoonRecipe] = useState<SpoonacularRecipe | null>(null);
  
  // MealDB state
  const [mealSearch, setMealSearch] = useState('');
  const [mealResults, setMealResults] = useState<MealDBMeal[]>([]);
  const [mealLoading, setMealLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealDBMeal | null>(null);
  const [mealCategories, setMealCategories] = useState<MealDBCategory[]>([]);
  const [mealAreas, setMealAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Load MealDB categories and areas on mount
  useEffect(() => {
    const loadMealDBData = async () => {
      const [cats, areas] = await Promise.all([getCategories(), getAreas()]);
      setMealCategories(cats);
      setMealAreas(areas);
    };
    loadMealDBData();
  }, []);

  const addIngredient = () => {
    if (newIngredient.name) {
      setIngredients([...ingredients, { ...newIngredient, id: Date.now().toString() }]);
      setNewIngredient({ name: '', amount: 0, unit: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const saveManualRecipe = () => {
    if (!name || ingredients.length === 0) return;
    
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name,
      servings,
      ingredients,
      instructions: instructions.filter(i => i.trim()).join('\n'),
      imageUrl: imageUrl || undefined,
      source: 'manual',
      createdAt: new Date()
    };

    addRecipe(newRecipe);
    router.push('/recipes');
  };

  // Spoonacular functions
  const searchSpoonacular = async () => {
    if (!spoonSearch || !aiSettings.spoonacularApiKey) return;
    setSpoonLoading(true);
    try {
      const results = await searchSpoonacularRecipes(spoonSearch, aiSettings.spoonacularApiKey);
      setSpoonResults(results);
    } catch (error) {
      console.error('Spoonacular search error:', error);
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
      console.error('Spoonacular random error:', error);
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
      console.error('Spoonacular detail error:', error);
    }
    setSpoonLoading(false);
  };

  const importSpoonRecipe = () => {
    if (!selectedSpoonRecipe) return;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: selectedSpoonRecipe.title,
      servings: selectedSpoonRecipe.servings || 4,
      ingredients: (selectedSpoonRecipe.extendedIngredients || []).map((ing, idx) => ({
        id: idx.toString(),
        name: ing.name || ing.original,
        amount: ing.amount || 0,
        unit: ing.unit || '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })),
      instructions: selectedSpoonRecipe.instructions
        ? selectedSpoonRecipe.instructions.replace(/<[^>]*>/g, '')
        : '',
      imageUrl: selectedSpoonRecipe.image,
      source: 'imported',
      // sourceUrl not available from Spoonacular
      createdAt: new Date()
    };

    addRecipe(newRecipe);
    router.push('/recipes');
  };

  // MealDB functions
  const searchMealDB = async () => {
    if (!mealSearch) return;
    setMealLoading(true);
    try {
      const results = await searchMeals(mealSearch);
      setMealResults(results);
    } catch (error) {
      console.error('MealDB search error:', error);
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
      console.error('MealDB random error:', error);
    }
    setMealLoading(false);
  };

  const browseMealsByCategory = async (category: string) => {
    setSelectedCategory(category);
    setSelectedArea('');
    setMealLoading(true);
    try {
      const results = await getMealsByCategory(category);
      const detailed = await Promise.all(
        results.slice(0, 12).map(m => getMealById(m.idMeal))
      );
      setMealResults(detailed.filter((m): m is MealDBMeal => m !== null));
    } catch (error) {
      console.error('MealDB category error:', error);
    }
    setMealLoading(false);
  };

  const browseMealsByArea = async (area: string) => {
    setSelectedArea(area);
    setSelectedCategory('');
    setMealLoading(true);
    try {
      const results = await getMealsByArea(area);
      const detailed = await Promise.all(
        results.slice(0, 12).map(m => getMealById(m.idMeal))
      );
      setMealResults(detailed.filter((m): m is MealDBMeal => m !== null));
    } catch (error) {
      console.error('MealDB area error:', error);
    }
    setMealLoading(false);
  };

  const importMealDBRecipe = () => {
    if (!selectedMeal) return;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: selectedMeal.strMeal,
      servings: 4,
      ingredients: selectedMeal.ingredients.map((ing, idx) => ({
        id: idx.toString(),
        name: ing.name,
        amount: parseFloat(ing.measure) || 1,
        unit: ing.measure.replace(/[0-9.]/g, '').trim() || 'unit',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })),
      instructions: selectedMeal.strInstructions,
      imageUrl: selectedMeal.strMealThumb,
      source: 'imported',
      sourceUrl: selectedMeal.strSource,
      createdAt: new Date()
    };

    addRecipe(newRecipe);
    router.push('/recipes');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Create Recipe</h1>
          <div className="w-9" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          {[
            { id: 'manual' as TabType, label: 'Manual', icon: ChefHat },
            { id: 'mealdb' as TabType, label: 'MealDB', icon: Globe },
            { id: 'spoonacular' as TabType, label: 'Spoonacular', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Manual Tab */}
          {activeTab === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recipe Name */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Recipe Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter recipe name..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Servings */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Servings</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Ingredients</label>
                <div className="space-y-2 mb-4">
                  {ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                    >
                      <span>
                        {ing.amount} {ing.unit} {ing.name}
                        {ing.calories > 0 && (
                          <span className="text-white/40 ml-2">({ing.calories} cal)</span>
                        )}
                      </span>
                      <button
                        onClick={() => removeIngredient(ing.id)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={newIngredient.amount || ''}
                    onChange={(e) => setNewIngredient({ ...newIngredient, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Amt"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    placeholder="Unit"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    placeholder="Ingredient"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={newIngredient.calories || ''}
                    onChange={(e) => setNewIngredient({ ...newIngredient, calories: parseInt(e.target.value) || 0 })}
                    placeholder="Calories (optional)"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                  <button
                    onClick={addIngredient}
                    className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Instructions</label>
                <div className="space-y-2">
                  {instructions.map((inst, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-white/40 mt-3">{idx + 1}.</span>
                      <textarea
                        value={inst}
                        onChange={(e) => updateInstruction(idx, e.target.value)}
                        placeholder={`Step ${idx + 1}...`}
                        rows={2}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none"
                      />
                      {instructions.length > 1 && (
                        <button
                          onClick={() => removeInstruction(idx)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addInstruction}
                  className="mt-2 flex items-center gap-2 text-emerald-400 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={saveManualRecipe}
                disabled={!name || ingredients.length === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Recipe
              </button>
            </motion.div>
          )}

          {/* MealDB Tab */}
          {activeTab === 'mealdb' && (
            <motion.div
              key="mealdb"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Info Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-medium">TheMealDB - Free Recipe Database</p>
                    <p className="text-sm text-white/60">No API key required! Browse thousands of recipes.</p>
                  </div>
                </div>
              </div>

              {!selectedMeal ? (
                <>
                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={mealSearch}
                        onChange={(e) => setMealSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchMealDB()}
                        placeholder="Search recipes..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl"
                      />
                    </div>
                    <button
                      onClick={searchMealDB}
                      className="px-4 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <button
                      onClick={getRandomMealDB}
                      className="px-4 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                      title="Random recipes"
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Browse by Category */}
                  <div>
                    <h3 className="text-sm text-white/60 mb-3 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" /> Browse by Category
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mealCategories.slice(0, 10).map(cat => (
                        <button
                          key={cat.strCategory}
                          onClick={() => browseMealsByCategory(cat.strCategory)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedCategory === cat.strCategory
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {cat.strCategory}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browse by Cuisine */}
                  <div>
                    <h3 className="text-sm text-white/60 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Browse by Cuisine
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mealAreas.slice(0, 12).map(area => (
                        <button
                          key={area}
                          onClick={() => browseMealsByArea(area)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedArea === area
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  {mealLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : mealResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {mealResults.map(meal => (
                        <motion.button
                          key={meal.idMeal}
                          onClick={() => setSelectedMeal(meal)}
                          className="text-left bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
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
                            <h4 className="font-medium text-sm line-clamp-2">{meal.strMeal}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-blue-400">{meal.strCategory}</span>
                              <span className="text-xs text-purple-400">{meal.strArea}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40">
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
                    className="flex items-center gap-2 text-white/60 hover:text-white"
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
                    <h2 className="text-xl font-bold">{selectedMeal.strMeal}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                        {selectedMeal.strCategory}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                        {selectedMeal.strArea}
                      </span>
                    </div>
                  </div>

                  {/* YouTube Link */}
                  {selectedMeal.strYoutube && (
                    <a
                      href={selectedMeal.strYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Watch Video Tutorial
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  )}

                  {/* Ingredients */}
                  <div>
                    <h3 className="font-semibold mb-2">Ingredients</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMeal.ingredients.map((ing, idx) => (
                        <div key={idx} className="p-2 bg-white/5 rounded-lg text-sm">
                          <span className="text-white/60">{ing.measure}</span> {ing.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <div className="p-4 bg-white/5 rounded-xl text-sm text-white/80 whitespace-pre-line">
                      {selectedMeal.strInstructions}
                    </div>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={importMealDBRecipe}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Import Recipe
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Spoonacular Tab */}
          {activeTab === 'spoonacular' && (
            <motion.div
              key="spoonacular"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {!aiSettings.spoonacularApiKey ? (
                <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                  <h3 className="font-semibold mb-2">API Key Required</h3>
                  <p className="text-sm text-white/60 mb-4">
                    Add your Spoonacular API key in Settings → API Settings to browse online recipes.
                  </p>
                  <button
                    onClick={() => router.push('/settings/api')}
                    className="px-4 py-2 bg-amber-500 rounded-lg text-sm font-medium"
                  >
                    Go to API Settings
                  </button>
                </div>
              ) : !selectedSpoonRecipe ? (
                <>
                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={spoonSearch}
                        onChange={(e) => setSpoonSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchSpoonacular()}
                        placeholder="Search recipes..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl"
                      />
                    </div>
                    <button
                      onClick={searchSpoonacular}
                      className="px-4 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <button
                      onClick={getRandomSpoonacular}
                      className="px-4 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                      title="Random recipes"
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Results */}
                  {spoonLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : spoonResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {spoonResults.map(recipe => (
                        <motion.button
                          key={recipe.id}
                          onClick={() => selectSpoonRecipe(recipe)}
                          className="text-left bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
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
                            <h4 className="font-medium text-sm line-clamp-2">{recipe.title}</h4>
                            {'readyInMinutes' in recipe && recipe.readyInMinutes && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                                <Clock className="w-3 h-3" />
                                {recipe.readyInMinutes} min
                              </div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40">
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
                    className="flex items-center gap-2 text-white/60 hover:text-white"
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

                  <h2 className="text-xl font-bold">{selectedSpoonRecipe.title}</h2>

                  <div className="flex flex-wrap gap-3">
                    {selectedSpoonRecipe.readyInMinutes && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        {selectedSpoonRecipe.readyInMinutes} min
                      </div>
                    )}
                    {selectedSpoonRecipe.servings && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Users className="w-4 h-4" />
                        {selectedSpoonRecipe.servings} servings
                      </div>
                    )}
                    {selectedSpoonRecipe.nutrition?.nutrients?.[0] && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Flame className="w-4 h-4" />
                        {Math.round(selectedSpoonRecipe.nutrition.nutrients[0].amount)} cal
                      </div>
                    )}
                  </div>

                  {/* Ingredients */}
                  {selectedSpoonRecipe.extendedIngredients && (
                    <div>
                      <h3 className="font-semibold mb-2">Ingredients</h3>
                      <div className="space-y-1">
                        {selectedSpoonRecipe.extendedIngredients.map((ing, idx) => (
                          <div key={idx} className="p-2 bg-white/5 rounded-lg text-sm">
                            {ing.original}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {selectedSpoonRecipe.instructions && (
                    <div>
                      <h3 className="font-semibold mb-2">Instructions</h3>
                      <div
                        className="p-4 bg-white/5 rounded-xl text-sm text-white/80"
                        dangerouslySetInnerHTML={{ __html: selectedSpoonRecipe.instructions }}
                      />
                    </div>
                  )}

                  {/* Source info not available from Spoonacular API */}

                  {/* Import Button */}
                  <button
                    onClick={importSpoonRecipe}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Import Recipe
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
