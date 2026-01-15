"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, BookmarkPlus, AlertCircle, Barcode } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analyzeFood, getHealthierAlternatives } from "@/lib/ai-vision";
import { getNutritionByName, getOpenFoodFactsNutrition, NutritionData } from "@/lib/nutrition-api";
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
  nutriScore?: string;
}): number {
  if (nutrition.nutriScore) {
    const nutriScoreMap: Record<string, number> = {
      'A': 90, 'B': 75, 'C': 55, 'D': 35, 'E': 20,
    };
    return nutriScoreMap[nutrition.nutriScore.toUpperCase()] || 50;
  }

  let score = 70;
  if (nutrition.protein > 20) score += 10;
  else if (nutrition.protein > 10) score += 5;
  if (nutrition.fiber > 5) score += 10;
  else if (nutrition.fiber > 2) score += 5;
  if (nutrition.calories > 500) score -= 15;
  else if (nutrition.calories > 300) score -= 5;
  if (nutrition.fat > 30) score -= 15;
  else if (nutrition.fat > 20) score -= 10;
  if (nutrition.sugar && nutrition.sugar > 20) score -= 15;
  else if (nutrition.sugar && nutrition.sugar > 10) score -= 5;
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
    scannedBarcode,
    setIsAnalyzing,
    setCurrentAnalysis,
    setScannedBarcode,
    setCurrentImage,
    addToHistory,
    aiSettings,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing...");
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
    barcode?: string;
    brandName?: string;
    source: "ai" | "barcode";
  } | null>(null);

  // Refs to capture initial values and prevent re-runs
  const hasAnalyzed = useRef(false);
  const initialImage = useRef<string | null>(null);
  const initialBarcode = useRef<string | null>(null);

  // Capture initial values on mount
  useEffect(() => {
    if (!hasAnalyzed.current) {
      initialImage.current = currentImage;
      initialBarcode.current = scannedBarcode;
    }
  }, []);

  useEffect(() => {
    async function analyzeBarcode(barcode: string) {
      setLoadingMessage("Looking up product...");
      console.log("Looking up barcode:", barcode);

      const nutrition = await getOpenFoodFactsNutrition(barcode);

      if (!nutrition) {
        throw new Error(`Product not found for barcode: ${barcode}. Try scanning a different product or use photo mode.`);
      }

      console.log("Barcode nutrition data:", nutrition);

      const healthScore = calculateHealthScore({
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        sugar: nutrition.sugar,
        sodium: nutrition.sodium,
        nutriScore: nutrition.nutriScore,
      });
      const verdict = getVerdict(healthScore);
      const alternatives = getHealthierAlternatives(nutrition.foodName);
      const category = nutrition.brandName ? "Packaged Food" : "Food Product";

      let description = `${nutrition.foodName}`;
      if (nutrition.brandName) {
        description = `${nutrition.brandName} ${nutrition.foodName}`;
      }
      if (nutrition.nutriScore) {
        description += `. Nutri-Score: ${nutrition.nutriScore}`;
      }
      if (nutrition.novaGroup) {
        const novaDescriptions: Record<number, string> = {
          1: "Unprocessed or minimally processed",
          2: "Processed culinary ingredients",
          3: "Processed foods",
          4: "Ultra-processed foods",
        };
        description += `. ${novaDescriptions[nutrition.novaGroup] || ""}`;
      }

      return {
        foodName: nutrition.foodName,
        category,
        description,
        confidence: 1.0,
        healthScore,
        verdict,
        nutrition,
        alternatives,
        barcode,
        brandName: nutrition.brandName,
        source: "barcode" as const,
      };
    }

    async function analyzeImage(imageData: string) {
      setLoadingMessage(`Analyzing with ${aiSettings.provider === 'demo' ? 'Demo Mode' : aiSettings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4o'}...`);

      console.log("Starting AI analysis...");
      const aiResult = await analyzeFood(imageData, {
        provider: aiSettings.provider,
        geminiApiKey: aiSettings.geminiApiKey,
        openaiApiKey: aiSettings.openaiApiKey,
      });
      console.log("AI analysis complete:", aiResult);

      if (!aiResult.foods || aiResult.foods.length === 0) {
        throw new Error("Could not identify food in image");
      }

      const food = aiResult.foods[0];

      setLoadingMessage("Fetching nutrition data...");
      console.log("Fetching nutrition data for:", food.name);
      const nutrition = await getNutritionByName(food.name);
      console.log("Nutrition data:", nutrition);

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
      const alternatives = getHealthierAlternatives(food.name);

      return {
        foodName: food.name,
        category: food.category,
        description: food.description || aiResult.overallDescription,
        confidence: food.confidence,
        healthScore,
        verdict,
        nutrition,
        alternatives,
        source: "ai" as const,
      };
    }

    async function analyze() {
      if (hasAnalyzed.current) return;
      hasAnalyzed.current = true;

      // Use captured initial values
      const imageToAnalyze = initialImage.current || currentImage;
      const barcodeToAnalyze = initialBarcode.current || scannedBarcode;

      if (!imageToAnalyze && !barcodeToAnalyze) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let analysisResult;

        if (barcodeToAnalyze) {
          analysisResult = await analyzeBarcode(barcodeToAnalyze);
        } else if (imageToAnalyze) {
          analysisResult = await analyzeImage(imageToAnalyze);
        } else {
          throw new Error("No image or barcode to analyze");
        }

        setResult(analysisResult);

        const historyEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          imageData: imageToAnalyze || "",
          foodName: analysisResult.foodName,
          category: analysisResult.category,
          healthScore: analysisResult.healthScore,
          calories: analysisResult.nutrition.calories,
          protein: analysisResult.nutrition.protein,
          carbs: analysisResult.nutrition.carbs,
          fat: analysisResult.nutrition.fat,
          fiber: analysisResult.nutrition.fiber,
          sugar: analysisResult.nutrition.sugar,
          sodium: analysisResult.nutrition.sodium,
          servingSize: analysisResult.nutrition.servingSize,
          verdict: analysisResult.verdict,
          description: analysisResult.description || "",
          alternatives: analysisResult.alternatives,
          barcode: "barcode" in analysisResult ? analysisResult.barcode : undefined,
          brandName: "brandName" in analysisResult ? analysisResult.brandName : undefined,
          nutriScore: analysisResult.nutrition.nutriScore,
          novaGroup: analysisResult.nutrition.novaGroup,
          source: analysisResult.source,
        };

        setCurrentAnalysis(historyEntry);
        addToHistory(historyEntry);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
        setIsAnalyzing(false);
        // Clear after analysis is complete
        setScannedBarcode(null);
        setCurrentImage(null);
      }
    }

    // Only run once on mount
    const imageToAnalyze = initialImage.current || currentImage;
    const barcodeToAnalyze = initialBarcode.current || scannedBarcode;
    
    if ((imageToAnalyze || barcodeToAnalyze) && !hasAnalyzed.current) {
      analyze();
    } else if (!imageToAnalyze && !barcodeToAnalyze && !hasAnalyzed.current) {
      setLoading(false);
      router.push("/");
    }
  }, []); // Empty dependency array - run only once

  if (loading) {
    return <Loading message={loadingMessage} />;
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

  // Keep image for display even after clearing from store
  const displayImage = initialImage.current;

  return (
    <div className="app-container">
      <div className="main-content hide-scrollbar">
        <div className="relative h-64">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Food"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center">
              <Barcode className="w-20 h-20 text-white/80 mb-4" />
              <p className="text-white/80 text-sm">Scanned via barcode</p>
              {result.barcode && (
                <p className="text-white/60 text-xs mt-1 font-mono">{result.barcode}</p>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <button
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white safe-top"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="absolute top-4 right-4 flex gap-2 safe-top">
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <BookmarkPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                  {result.category}
                </span>
                {result.source === "barcode" && (
                  <span className="px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mt-2">
                {result.foodName}
              </h1>
              {result.brandName && (
                <p className="text-white/90 text-sm mt-1">
                  {result.brandName}
                </p>
              )}
              <p className="text-white/80 text-sm mt-1">
                {result.source === "barcode"
                  ? "Product data from Open Food Facts"
                  : `${Math.round(result.confidence * 100)}% confidence`}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="p-4 space-y-4 -mt-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HealthScore score={result.healthScore} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <p className="text-gray-600">{result.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NutritionCard nutrition={result.nutrition} />
          </motion.div>

          {result.alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AlternativesCard currentFood={result.foodName} alternatives={result.alternatives} />
            </motion.div>
          )}

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
