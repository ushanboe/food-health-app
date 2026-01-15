"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Trash2, Barcode } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { HealthScore } from "@/components/HealthScore";
import { NutritionCard } from "@/components/NutritionCard";
import { AlternativesCard } from "@/components/AlternativesCard";

export default function DetailsPage() {
  const router = useRouter();
  const { currentAnalysis, removeFromHistory } = useAppStore();

  useEffect(() => {
    if (!currentAnalysis) {
      router.push("/");
    }
  }, [currentAnalysis, router]);

  if (!currentAnalysis) {
    return null;
  }

  const handleDelete = () => {
    if (confirm("Delete this scan from history?")) {
      removeFromHistory(currentAnalysis.id);
      router.push("/");
    }
  };

  // Build nutrition object for NutritionCard
  const nutrition = {
    foodName: currentAnalysis.foodName,
    calories: currentAnalysis.calories,
    protein: currentAnalysis.protein,
    carbs: currentAnalysis.carbs,
    fat: currentAnalysis.fat,
    fiber: currentAnalysis.fiber,
    sugar: currentAnalysis.sugar,
    sodium: currentAnalysis.sodium,
    servingSize: currentAnalysis.servingSize,
    brandName: currentAnalysis.brandName,
    nutriScore: currentAnalysis.nutriScore,
    novaGroup: currentAnalysis.novaGroup,
  };

  return (
    <div className="app-container">
      <div className="main-content hide-scrollbar">
        {/* Header with image or barcode indicator */}
        <div className="relative h-64">
          {currentAnalysis.imageData ? (
            <img
              src={currentAnalysis.imageData}
              alt={currentAnalysis.foodName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center">
              <Barcode className="w-20 h-20 text-white/80 mb-4" />
              <p className="text-white/80 text-sm">Scanned via barcode</p>
              {currentAnalysis.barcode && (
                <p className="text-white/60 text-xs mt-1 font-mono">{currentAnalysis.barcode}</p>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white safe-top"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 safe-top">
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDelete}
              className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Food name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                  {currentAnalysis.category}
                </span>
                {currentAnalysis.source === "barcode" && (
                  <span className="px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mt-2">
                {currentAnalysis.foodName}
              </h1>
              {currentAnalysis.brandName && (
                <p className="text-white/90 text-sm mt-1">
                  {currentAnalysis.brandName}
                </p>
              )}
              <p className="text-white/70 text-xs mt-1">
                Scanned on {new Date(currentAnalysis.timestamp).toLocaleDateString()}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 -mt-6 relative">
          {/* Health Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HealthScore score={currentAnalysis.healthScore} />
          </motion.div>

          {/* Description */}
          {currentAnalysis.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <p className="text-gray-600">{currentAnalysis.description}</p>
            </motion.div>
          )}

          {/* Nutrition Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NutritionCard nutrition={nutrition} />
          </motion.div>

          {/* Alternatives */}
          {currentAnalysis.alternatives && currentAnalysis.alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AlternativesCard currentFood={currentAnalysis.foodName} alternatives={currentAnalysis.alternatives} />
            </motion.div>
          )}

          {/* Scan Another Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4 pb-8"
          >
            <button
              onClick={() => router.push("/camera")}
              className="w-full py-4 bg-green-500 text-white font-semibold rounded-2xl btn-press"
            >
              Scan Another Food
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
