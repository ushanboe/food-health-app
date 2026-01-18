'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Flame,
  ChefHat,
  Share2,
  Heart,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAppStore, Recipe } from '@/lib/store';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { recipes, removeRecipe } = useAppStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const found = recipes.find(r => r.id === id);
    if (found) {
      setRecipe(found);
    }
  }, [params.id, recipes]);

  const handleDelete = () => {
    if (recipe) {
      removeRecipe(recipe.id);
      router.push('/recipes');
    }
  };

  const handleShare = async () => {
    if (recipe && navigator.share) {
      try {
        await navigator.share({
          title: recipe.name,
          text: `Check out this recipe: ${recipe.name}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Recipe not found</p>
          <button
            onClick={() => router.push('/recipes')}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  // Calculate nutrition from ingredients
  const totalCalories = recipe.ingredients?.reduce((sum, ing) => sum + (ing.calories || 0), 0) || 0;
  const totalProtein = recipe.ingredients?.reduce((sum, ing) => sum + (ing.protein || 0), 0) || 0;
  const totalCarbs = recipe.ingredients?.reduce((sum, ing) => sum + (ing.carbs || 0), 0) || 0;
  const totalFat = recipe.ingredients?.reduce((sum, ing) => sum + (ing.fat || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-emerald-900/50 to-gray-900">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-24 h-24 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-full"
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-full"
          >
            <Share2 className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Source Badge */}
        {recipe.source && recipe.source !== 'manual' && (
          <div className="absolute bottom-4 right-4">
            <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-sm text-white text-xs rounded-full">
              {recipe.source === 'api' ? '🌐 Imported' : '📥 Imported'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10">
        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
        >
          <h1 className="text-2xl font-bold text-white mb-2">{recipe.name}</h1>
          
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings || 1} servings</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{Math.round(totalCalories)} cal</span>
            </div>
          </div>
        </motion.div>

        {/* Nutrition Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-3">Nutrition per serving</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 bg-orange-500/20 rounded-xl">
              <p className="text-2xl font-bold text-orange-400">{Math.round(totalCalories / (recipe.servings || 1))}</p>
              <p className="text-xs text-gray-400">Calories</p>
            </div>
            <div className="text-center p-3 bg-blue-500/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-400">{Math.round(totalProtein / (recipe.servings || 1))}g</p>
              <p className="text-xs text-gray-400">Protein</p>
            </div>
            <div className="text-center p-3 bg-amber-500/20 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{Math.round(totalCarbs / (recipe.servings || 1))}g</p>
              <p className="text-xs text-gray-400">Carbs</p>
            </div>
            <div className="text-center p-3 bg-pink-500/20 rounded-xl">
              <p className="text-2xl font-bold text-pink-400">{Math.round(totalFat / (recipe.servings || 1))}g</p>
              <p className="text-xs text-gray-400">Fat</p>
            </div>
          </div>
        </motion.div>

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
          >
            <h2 className="text-lg font-semibold text-white mb-3">
              🥗 Ingredients ({recipe.ingredients.length})
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-300">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="flex-1">
                    <span className="font-medium">{ing.name}</span>
                    {ing.amount && (
                      <span className="text-gray-500 ml-2">
                        {ing.amount} {ing.unit || ''}
                      </span>
                    )}
                  </span>
                  {ing.calories > 0 && (
                    <span className="text-xs text-gray-500">{ing.calories} cal</span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
          >
            <h2 className="text-lg font-semibold text-white mb-3">📝 Instructions</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{recipe.instructions}</p>
          </motion.div>
        )}

        {/* Source Link */}
        {recipe.sourceUrl && (
          <motion.a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex items-center justify-center gap-2 p-4 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl border border-white/10 text-emerald-400"
          >
            <ExternalLink className="w-5 h-5" />
            <span>View Original Recipe</span>
          </motion.a>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex gap-3"
        >
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-500/20 text-red-400 rounded-xl"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Recipe</span>
          </button>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-2">Delete Recipe?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 p-3 bg-gray-700 text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 p-3 bg-red-500 text-white rounded-xl"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
