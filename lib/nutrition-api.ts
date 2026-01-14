// Nutrition API Integration
// USDA FoodData Central & Open Food Facts

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_KEY = "DEMO_KEY"; // Works for testing, get real key for production
const OFF_BASE = "https://world.openfoodfacts.org";

export interface NutrientInfo {
  name: string;
  amount: number;
  unit: string;
  dailyValue?: number;
}

export interface NutritionData {
  foodName: string;
  brandName?: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  cholesterol?: number;
  potassium?: number;
  vitamins: NutrientInfo[];
  minerals: NutrientInfo[];
  source: "usda" | "openfoodfacts" | "mock";
  nutriScore?: string;
  novaGroup?: number;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  brandName?: string;
  source: "usda" | "openfoodfacts";
}

// Search USDA FoodData Central
export async function searchUSDA(query: string): Promise<FoodSearchResult[]> {
  try {
    const response = await fetch(
      `${USDA_BASE}/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}&pageSize=10`
    );

    if (!response.ok) throw new Error("USDA API error");

    const data = await response.json();

    return (data.foods || []).map((food: any) => ({
      id: food.fdcId.toString(),
      name: food.description,
      brandName: food.brandName || food.brandOwner,
      source: "usda" as const,
    }));
  } catch (error) {
    console.error("USDA search error:", error);
    return [];
  }
}

// Get detailed nutrition from USDA
export async function getUSDANutrition(fdcId: string): Promise<NutritionData | null> {
  try {
    const response = await fetch(
      `${USDA_BASE}/food/${fdcId}?api_key=${USDA_KEY}`
    );

    if (!response.ok) throw new Error("USDA API error");

    const food = await response.json();
    const nutrients = food.foodNutrients || [];

    const getNutrient = (id: number): number => {
      const nutrient = nutrients.find((n: any) => n.nutrient?.id === id);
      return nutrient?.amount || 0;
    };

    // USDA nutrient IDs
    const NUTRIENT_IDS = {
      calories: 1008,
      protein: 1003,
      carbs: 1005,
      fat: 1004,
      fiber: 1079,
      sugar: 2000,
      sodium: 1093,
      saturatedFat: 1258,
      cholesterol: 1253,
      potassium: 1092,
      vitaminA: 1106,
      vitaminC: 1162,
      vitaminD: 1114,
      vitaminE: 1109,
      vitaminK: 1185,
      calcium: 1087,
      iron: 1089,
      magnesium: 1090,
      zinc: 1095,
    };

    return {
      foodName: food.description,
      brandName: food.brandName || food.brandOwner,
      servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || "g"}` : "100g",
      calories: getNutrient(NUTRIENT_IDS.calories),
      protein: getNutrient(NUTRIENT_IDS.protein),
      carbohydrates: getNutrient(NUTRIENT_IDS.carbs),
      fat: getNutrient(NUTRIENT_IDS.fat),
      fiber: getNutrient(NUTRIENT_IDS.fiber),
      sugar: getNutrient(NUTRIENT_IDS.sugar),
      sodium: getNutrient(NUTRIENT_IDS.sodium),
      saturatedFat: getNutrient(NUTRIENT_IDS.saturatedFat),
      cholesterol: getNutrient(NUTRIENT_IDS.cholesterol),
      potassium: getNutrient(NUTRIENT_IDS.potassium),
      vitamins: [
        { name: "Vitamin A", amount: getNutrient(NUTRIENT_IDS.vitaminA), unit: "mcg", dailyValue: 900 },
        { name: "Vitamin C", amount: getNutrient(NUTRIENT_IDS.vitaminC), unit: "mg", dailyValue: 90 },
        { name: "Vitamin D", amount: getNutrient(NUTRIENT_IDS.vitaminD), unit: "mcg", dailyValue: 20 },
        { name: "Vitamin E", amount: getNutrient(NUTRIENT_IDS.vitaminE), unit: "mg", dailyValue: 15 },
        { name: "Vitamin K", amount: getNutrient(NUTRIENT_IDS.vitaminK), unit: "mcg", dailyValue: 120 },
      ].filter(v => v.amount > 0),
      minerals: [
        { name: "Calcium", amount: getNutrient(NUTRIENT_IDS.calcium), unit: "mg", dailyValue: 1300 },
        { name: "Iron", amount: getNutrient(NUTRIENT_IDS.iron), unit: "mg", dailyValue: 18 },
        { name: "Magnesium", amount: getNutrient(NUTRIENT_IDS.magnesium), unit: "mg", dailyValue: 420 },
        { name: "Zinc", amount: getNutrient(NUTRIENT_IDS.zinc), unit: "mg", dailyValue: 11 },
        { name: "Potassium", amount: getNutrient(NUTRIENT_IDS.potassium), unit: "mg", dailyValue: 4700 },
      ].filter(m => m.amount > 0),
      source: "usda",
    };
  } catch (error) {
    console.error("USDA nutrition error:", error);
    return null;
  }
}

// Search Open Food Facts
export async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  try {
    const response = await fetch(
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`
    );

    if (!response.ok) throw new Error("Open Food Facts API error");

    const data = await response.json();

    return (data.products || []).map((product: any) => ({
      id: product.code,
      name: product.product_name || "Unknown Product",
      brandName: product.brands,
      source: "openfoodfacts" as const,
    }));
  } catch (error) {
    console.error("Open Food Facts search error:", error);
    return [];
  }
}

// Get detailed nutrition from Open Food Facts
export async function getOpenFoodFactsNutrition(barcode: string): Promise<NutritionData | null> {
  try {
    const response = await fetch(`${OFF_BASE}/api/v0/product/${barcode}.json`);

    if (!response.ok) throw new Error("Open Food Facts API error");

    const data = await response.json();

    if (data.status !== 1) return null;

    const product = data.product;
    const nutrients = product.nutriments || {};

    return {
      foodName: product.product_name || "Unknown Product",
      brandName: product.brands,
      servingSize: product.serving_size || "100g",
      calories: nutrients["energy-kcal_100g"] || nutrients.energy_100g / 4.184 || 0,
      protein: nutrients.proteins_100g || 0,
      carbohydrates: nutrients.carbohydrates_100g || 0,
      fat: nutrients.fat_100g || 0,
      fiber: nutrients.fiber_100g || 0,
      sugar: nutrients.sugars_100g || 0,
      sodium: (nutrients.sodium_100g || 0) * 1000, // Convert to mg
      saturatedFat: nutrients["saturated-fat_100g"] || 0,
      cholesterol: nutrients.cholesterol_100g,
      potassium: nutrients.potassium_100g,
      vitamins: [],
      minerals: [],
      source: "openfoodfacts",
      nutriScore: product.nutriscore_grade?.toUpperCase(),
      novaGroup: product.nova_group,
    };
  } catch (error) {
    console.error("Open Food Facts nutrition error:", error);
    return null;
  }
}

// Combined search function
export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const [usdaResults, offResults] = await Promise.all([
    searchUSDA(query),
    searchOpenFoodFacts(query),
  ]);

  // Combine and deduplicate
  return [...usdaResults, ...offResults].slice(0, 15);
}

// Get nutrition by food name (searches and gets first result)
export async function getNutritionByName(foodName: string): Promise<NutritionData | null> {
  // Try USDA first (better for whole foods)
  const usdaResults = await searchUSDA(foodName);
  if (usdaResults.length > 0) {
    const nutrition = await getUSDANutrition(usdaResults[0].id);
    if (nutrition) return nutrition;
  }

  // Fallback to Open Food Facts
  const offResults = await searchOpenFoodFacts(foodName);
  if (offResults.length > 0) {
    const nutrition = await getOpenFoodFactsNutrition(offResults[0].id);
    if (nutrition) return nutrition;
  }

  return null;
}
