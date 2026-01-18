"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
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
  Trash2,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function RecipesPage() {
  const router = useRouter();
  const { recipes, removeRecipe } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalNutrition = (recipe: typeof recipes[0]) => {
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

  return (
    <PageContainer>
      <Header title="Recipes" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Search Bar */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </motion.div>

          {/* Recipe List */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">
                {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? "s" : ""}
              </p>
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
                  <p className="text-xs mt-1">Create your first recipe</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRecipes.map((recipe) => {
                  const nutrition = getTotalNutrition(recipe);
                  const perServing = {
                    calories: Math.round(nutrition.calories / recipe.servings),
                    protein: Math.round(nutrition.protein / recipe.servings),
                  };

                  return (
                    <Card
                      key={recipe.id}
                      onClick={() => router.push(`/recipes/${recipe.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex gap-4">
                        {/* Recipe Image or Placeholder */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <ChefHat size={28} className="text-emerald-500" />
                          )}
                        </div>

                        {/* Recipe Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {recipe.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {recipe.servings}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame size={14} />
                              {perServing.calories} cal
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" size="sm">
                              {recipe.ingredients.length} ingredients
                            </Badge>
                            {recipe.source && (
                              <Badge variant="info" size="sm">
                                {recipe.source}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end justify-between">
                          <ChevronRight size={18} className="text-gray-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecipe(recipe.id);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageContent>

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
