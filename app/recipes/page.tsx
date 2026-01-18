"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  PageWrapper,
  Card3D,
  Button3D,
  SectionHeader,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

const categories = [
  { id: "all", label: "All", icon: "🍽️" },
  { id: "breakfast", label: "Breakfast", icon: "🥞" },
  { id: "lunch", label: "Lunch", icon: "🥗" },
  { id: "dinner", label: "Dinner", icon: "🍝" },
  { id: "snacks", label: "Snacks", icon: "🍎" },
  { id: "desserts", label: "Desserts", icon: "🍰" },
];

const sampleRecipes = [
  {
    id: "1",
    name: "Avocado Toast",
    category: "breakfast",
    image: "🥑",
    calories: 320,
    protein: 12,
    time: "10 min",
    difficulty: "Easy",
    ingredients: ["Bread", "Avocado", "Eggs", "Salt", "Pepper"],
  },
  {
    id: "2",
    name: "Greek Salad",
    category: "lunch",
    image: "🥗",
    calories: 280,
    protein: 8,
    time: "15 min",
    difficulty: "Easy",
    ingredients: ["Cucumber", "Tomatoes", "Feta", "Olives", "Olive Oil"],
  },
  {
    id: "3",
    name: "Grilled Salmon",
    category: "dinner",
    image: "🐟",
    calories: 450,
    protein: 42,
    time: "25 min",
    difficulty: "Medium",
    ingredients: ["Salmon", "Lemon", "Garlic", "Herbs", "Olive Oil"],
  },
  {
    id: "4",
    name: "Protein Smoothie",
    category: "snacks",
    image: "🥤",
    calories: 220,
    protein: 25,
    time: "5 min",
    difficulty: "Easy",
    ingredients: ["Banana", "Protein Powder", "Milk", "Peanut Butter"],
  },
  {
    id: "5",
    name: "Chicken Stir Fry",
    category: "dinner",
    image: "🍗",
    calories: 380,
    protein: 35,
    time: "20 min",
    difficulty: "Medium",
    ingredients: ["Chicken", "Vegetables", "Soy Sauce", "Ginger", "Garlic"],
  },
  {
    id: "6",
    name: "Overnight Oats",
    category: "breakfast",
    image: "🥣",
    calories: 350,
    protein: 15,
    time: "5 min",
    difficulty: "Easy",
    ingredients: ["Oats", "Milk", "Chia Seeds", "Honey", "Berries"],
  },
];

export default function RecipesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<typeof sampleRecipes[0] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const filteredRecipes = sampleRecipes.filter((recipe) => {
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-400 bg-green-500/20";
      case "Medium": return "text-yellow-400 bg-yellow-500/20";
      case "Hard": return "text-red-400 bg-red-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            🍳 Recipes
          </h1>
          <p className="text-gray-400 mt-1">Discover healthy meals</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
              onClick={() => { hapticLight(); setSelectedCategory(category.id); }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.icon}</span>
              <span className="text-sm font-medium">{category.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.05 }}
            >
              <Card3D
                variant="glass"
                onClick={() => { hapticMedium(); setSelectedRecipe(recipe); }}
              >
                <div className="text-center">
                  <motion.span
                    className="text-5xl block mb-3"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {recipe.image}
                  </motion.span>
                  <h3 className="font-semibold text-white text-sm mb-1">{recipe.name}</h3>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-purple-400">{recipe.calories} kcal</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">{recipe.time}</span>
                  </div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <Card3D variant="glass">
            <div className="text-center py-8">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-gray-400">No recipes found</p>
              <p className="text-gray-500 text-sm mt-1">Try a different search or category</p>
            </div>
          </Card3D>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedRecipe(null)}
            />
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-3xl p-6 border-t border-white/10 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
              
              {/* Recipe Header */}
              <div className="text-center mb-6">
                <motion.span
                  className="text-7xl block mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  {selectedRecipe.image}
                </motion.span>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedRecipe.name}</h2>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="text-purple-400">🔥 {selectedRecipe.calories} kcal</span>
                  <span className="text-blue-400">🥩 {selectedRecipe.protein}g protein</span>
                  <span className="text-gray-400">⏱️ {selectedRecipe.time}</span>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">📝 Ingredients</h3>
                <div className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <motion.div
                      key={ingredient}
                      className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-300">{ingredient}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button3D
                  variant="ghost"
                  fullWidth
                  onClick={() => setSelectedRecipe(null)}
                >
                  Close
                </Button3D>
                <Button3D
                  variant="primary"
                  fullWidth
                  icon="+"
                  onClick={() => {
                    hapticSuccess();
                    setSelectedRecipe(null);
                    router.push("/diary");
                  }}
                >
                  Add to Diary
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavV2 />
    </PageWrapper>
  );
}
