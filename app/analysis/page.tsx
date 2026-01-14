"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, BookmarkPlus, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analyzeFood, getHealthierAlternatives } from "@/lib/ai-vision";
import { getNutritionByName, NutritionData } from "@/lib/nutrition-api";
import { HealthScore } from "@/components/HealthScore";
import { NutritionCard } from "@/components/NutritionCard";
import { AlternativesCard } from "@/components/AlternativesCard";
import { Loading } from "@/components/Loading";

function calculateHealthScore(nutrition: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
}): number {
  let score = 70; // Base score

  // Protein bonus (high protein is good)
  if (nutrition.protein > 20) score += 10;
  else if (nutrition.protein > 10) score += 5;

  // Fiber bonus
  if (nutrition.fiber > 5) score += 10;
  else if (nutrition.fiber > 2) score += 5;

  // High calorie penalty
  if (nutrition.calories > 500) score -= 15;
  else if (nutrition.calories > 300) score -= 5;

  // High fat penalty
  if (nutrition.fat > 30) score -= 15;
  else if (nutrition.fat > 20) score -= 10;

  // Sugar penalty
  if (nutrition.sugar && nutrition.sugar > 20) score -= 15;
  else if (nutrition.sugar && nutrition.sugar > 10) score -= 5;

  // Sodium penalty
  if (nutrition.sodium && nutrition.sodium > 1000) score -= 10;
  else if (nutrition.sodium && nutrition.sodium > 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getVerdict(score: number): "healthy" | "moderate" | "unhealthy" {
  if (score >= 70) return "healthy";
  if (score >= 40) return "moderate";
  return "unhealthy";
}

export default function AnalysisPage() {
  const router = useRouter();
  const {
    currentImage,
    setIsAnalyzing,
    setCurrentAnalysis,
    addToHistory,
    aiSettings,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    foodName: string;
    category: string;
    description: string;
    confidence: number;
    healthScore: number;
    verdict: "healthy" | "moderate" | "unhealthy";
    nutrition: NutritionData;
    alternatives: string[];
  } | null>(null);
  
  // Use ref to prevent double execution in strict mode
  const hasAnalyzed = useRef(false);

  useEffect(() => {
    async function analyze() {
      // Prevent double execution
      if (hasAnalyzed.current) return;
      hasAnalyzed.current = true;
      
      if (!currentImage) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Step 1: Analyze image with AI
        console.log("Starting AI analysis...");
        const aiResult = await analyzeFood(currentImage, {
          provider: aiSettings.provider,
          geminiApiKey: aiSettings.geminiApiKey,
          openaiApiKey: aiSettings.openaiApiKey,
        });
        console.log("AI analysis complete:", aiResult);

        if (!aiResult.foods || aiResult.foods.length === 0) {
          throw new Error("Could not identify food in image");
        }

        const food = aiResult.foods[0];

        // Step 2: Get nutrition data from API (with fallback)
        console.log("Fetching nutrition data for:", food.name);
        const nutrition = await getNutritionByName(food.name);
        console.log("Nutrition data:", nutrition);

        // Step 3: Calculate health score
        const healthScore = calculateHealthScore({
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sugar: nutrition.sugar,
          sodium: nutrition.sodium,
        });
        const verdict = getVerdict(healthScore);

        // Step 4: Get healthier alternatives
        const alternatives = getHealthierAlternatives(food.name);

        const analysisResult = {
          foodName: food.name,
          category: food.category,
          description: food.description || aiResult.overallDescription,
          confidence: food.confidence,
          healthScore,
          verdict,
          nutrition,
          alternatives,
        };

        setResult(analysisResult);

        // Save to history
        const historyEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          imageData: currentImage,
          foodName: food.name,
          category: food.category,
          healthScore,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          verdict,
          description: food.description || "",
          alternatives,
        };

        setCurrentAnalysis(historyEntry);
        addToHistory(historyEntry);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
        setIsAnalyzing(false);
      }
    }

    // Run analysis when we have an image
    if (currentImage) {
      analyze();
    } else {
      // No image, redirect to home
      setLoading(false);
      router.push("/");
    }
  }, [currentImage, aiSettings, router, setIsAnalyzing, setCurrentAnalysis, addToHistory]);

  if (loading) {
    return <Loading message={`Analyzing with ${aiSettings.provider === 'demo' ? 'Demo Mode' : aiSettings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4o'}...`} />;
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="main-content flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analysis Failed</h2>
          <p className="text-gray-500 text-center mb-6">{error}</p>
          <button
            onClick={() => router.push("/camera")}
            className="px-6 py-3 bg-green-500 text-white rounded-full font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="app-container">
      <div className="main-content hide-scrollbar">
        {/* Header with image */}
        <div className="relative h-64">
          {currentImage && (
            <img
              src={currentImage}
              alt="Food"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white safe-top"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 safe-top">
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <BookmarkPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Food name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                {result.category}
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">
                {result.foodName}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {Math.round(result.confidence * 100)}% confidence
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
            <HealthScore score={result.healthScore} />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <p className="text-gray-600">{result.description}</p>
          </motion.div>

          {/* Nutrition Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NutritionCard nutrition={result.nutrition} />
          </motion.div>

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AlternativesCard currentFood={result.foodName} alternatives={result.alternatives} />
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
