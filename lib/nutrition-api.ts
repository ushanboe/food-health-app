// Nutrition API Integration
// USDA FoodData Central & Open Food Facts

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || "DEMO_KEY";
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
  carbs: number;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${USDA_BASE}/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}&pageSize=10`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`USDA API returned ${response.status}, falling back to alternatives`);
      return [];
    }

    const data = await response.json();

    return (data.foods || []).map((food: any) => ({
      id: food.fdcId.toString(),
      name: food.description,
      brandName: food.brandName || food.brandOwner,
      source: "usda" as const,
    }));
  } catch (error) {
    console.warn("USDA search error (will use fallback):", error instanceof Error ? error.message : error);
    return [];
  }
}

// Get detailed nutrition from USDA
export async function getUSDANutrition(fdcId: string): Promise<NutritionData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${USDA_BASE}/food/${fdcId}?api_key=${USDA_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`USDA nutrition API returned ${response.status}`);
      return null;
    }

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

    const carbs = getNutrient(NUTRIENT_IDS.carbs);

    return {
      foodName: food.description,
      brandName: food.brandName || food.brandOwner,
      servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || "g"}` : "100g",
      calories: getNutrient(NUTRIENT_IDS.calories),
      protein: getNutrient(NUTRIENT_IDS.protein),
      carbohydrates: carbs,
      carbs: carbs,
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
    console.warn("USDA nutrition error:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Search Open Food Facts
export async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Open Food Facts API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.products || []).map((product: any) => ({
      id: product.code,
      name: product.product_name || "Unknown Product",
      brandName: product.brands,
      source: "openfoodfacts" as const,
    }));
  } catch (error) {
    console.warn("Open Food Facts search error:", error instanceof Error ? error.message : error);
    return [];
  }
}

// Get detailed nutrition from Open Food Facts
export async function getOpenFoodFactsNutrition(barcode: string): Promise<NutritionData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${OFF_BASE}/api/v0/product/${barcode}.json`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Open Food Facts product API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 1) return null;

    const product = data.product;
    const nutrients = product.nutriments || {};

    const carbs = nutrients.carbohydrates_100g || 0;

    return {
      foodName: product.product_name || "Unknown Product",
      brandName: product.brands,
      servingSize: product.serving_size || "100g",
      calories: nutrients["energy-kcal_100g"] || nutrients.energy_100g / 4.184 || 0,
      protein: nutrients.proteins_100g || 0,
      carbohydrates: carbs,
      carbs: carbs,
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
    console.warn("Open Food Facts nutrition error:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Combined search function
export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const [usdaResults, offResults] = await Promise.allSettled([
    searchUSDA(query),
    searchOpenFoodFacts(query),
  ]);

  const usda = usdaResults.status === 'fulfilled' ? usdaResults.value : [];
  const off = offResults.status === 'fulfilled' ? offResults.value : [];

  // Combine and deduplicate
  return [...usda, ...off].slice(0, 15);
}

// Get nutrition by food name (searches and gets first result)
export async function getNutritionByName(foodName: string): Promise<NutritionData> {
  try {
    // Try USDA first (better for whole foods)
    const usdaResults = await searchUSDA(foodName);
    if (usdaResults.length > 0) {
      const nutrition = await getUSDANutrition(usdaResults[0].id);
      if (nutrition) {
        console.log(`✓ Got nutrition from USDA for: ${foodName}`);
        return nutrition;
      }
    }

    // Fallback to Open Food Facts
    const offResults = await searchOpenFoodFacts(foodName);
    if (offResults.length > 0) {
      const nutrition = await getOpenFoodFactsNutrition(offResults[0].id);
      if (nutrition) {
        console.log(`✓ Got nutrition from Open Food Facts for: ${foodName}`);
        return nutrition;
      }
    }
  } catch (error) {
    console.warn("Nutrition API error, using mock data:", error);
  }

  // Return mock data as final fallback
  console.log(`ℹ Using mock nutrition data for: ${foodName}`);
  return getMockNutrition(foodName);
}

// Mock nutrition data for when APIs fail
function getMockNutrition(foodName: string): NutritionData {
  const lowerName = foodName.toLowerCase();
  
  // Common food estimates (per serving)
  const mockData: Record<string, Partial<NutritionData>> = {
    apple: { calories: 95, protein: 0.5, carbohydrates: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2 },
    banana: { calories: 105, protein: 1.3, carbohydrates: 27, fat: 0.4, fiber: 3.1, sugar: 14, sodium: 1 },
    orange: { calories: 62, protein: 1.2, carbohydrates: 15, fat: 0.2, fiber: 3.1, sugar: 12, sodium: 0 },
    pizza: { calories: 285, protein: 12, carbohydrates: 36, fat: 10, fiber: 2.5, sugar: 4, sodium: 640 },
    burger: { calories: 354, protein: 20, carbohydrates: 29, fat: 17, fiber: 1.3, sugar: 5, sodium: 497 },
    hamburger: { calories: 354, protein: 20, carbohydrates: 29, fat: 17, fiber: 1.3, sugar: 5, sodium: 497 },
    salad: { calories: 20, protein: 1.5, carbohydrates: 3.5, fat: 0.2, fiber: 2, sugar: 1.3, sodium: 10 },
    chicken: { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
    rice: { calories: 206, protein: 4.3, carbohydrates: 45, fat: 0.4, fiber: 0.6, sugar: 0, sodium: 1 },
    bread: { calories: 79, protein: 2.7, carbohydrates: 15, fat: 1, fiber: 0.6, sugar: 1.5, sodium: 147 },
    egg: { calories: 78, protein: 6, carbohydrates: 0.6, fat: 5, fiber: 0, sugar: 0.6, sodium: 62 },
    eggs: { calories: 156, protein: 12, carbohydrates: 1.2, fat: 10, fiber: 0, sugar: 1.2, sodium: 124 },
    coffee: { calories: 2, protein: 0.3, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5 },
    pasta: { calories: 220, protein: 8, carbohydrates: 43, fat: 1.3, fiber: 2.5, sugar: 1, sodium: 1 },
    sandwich: { calories: 250, protein: 12, carbohydrates: 30, fat: 8, fiber: 2, sugar: 4, sodium: 500 },
    soup: { calories: 100, protein: 5, carbohydrates: 15, fat: 2, fiber: 2, sugar: 3, sodium: 800 },
    steak: { calories: 271, protein: 26, carbohydrates: 0, fat: 18, fiber: 0, sugar: 0, sodium: 58 },
    fish: { calories: 136, protein: 20, carbohydrates: 0, fat: 6, fiber: 0, sugar: 0, sodium: 50 },
    salmon: { calories: 208, protein: 20, carbohydrates: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59 },
    sushi: { calories: 200, protein: 9, carbohydrates: 38, fat: 1, fiber: 1, sugar: 8, sodium: 500 },
    taco: { calories: 226, protein: 9, carbohydrates: 20, fat: 12, fiber: 3, sugar: 2, sodium: 400 },
    burrito: { calories: 430, protein: 18, carbohydrates: 50, fat: 18, fiber: 6, sugar: 3, sodium: 900 },
    fries: { calories: 312, protein: 3.4, carbohydrates: 41, fat: 15, fiber: 3.8, sugar: 0.3, sodium: 210 },
    "french fries": { calories: 312, protein: 3.4, carbohydrates: 41, fat: 15, fiber: 3.8, sugar: 0.3, sodium: 210 },
    ice: { calories: 207, protein: 3.5, carbohydrates: 24, fat: 11, fiber: 0.7, sugar: 21, sodium: 80 },
    "ice cream": { calories: 207, protein: 3.5, carbohydrates: 24, fat: 11, fiber: 0.7, sugar: 21, sodium: 80 },
    cake: { calories: 257, protein: 3, carbohydrates: 38, fat: 11, fiber: 0.5, sugar: 25, sodium: 220 },
    cookie: { calories: 148, protein: 1.5, carbohydrates: 20, fat: 7, fiber: 0.5, sugar: 10, sodium: 90 },
    donut: { calories: 253, protein: 4, carbohydrates: 30, fat: 14, fiber: 1, sugar: 12, sodium: 263 },
    chocolate: { calories: 546, protein: 5, carbohydrates: 60, fat: 31, fiber: 7, sugar: 48, sodium: 24 },
    yogurt: { calories: 100, protein: 17, carbohydrates: 6, fat: 0.7, fiber: 0, sugar: 4, sodium: 65 },
    milk: { calories: 103, protein: 8, carbohydrates: 12, fat: 2.4, fiber: 0, sugar: 12, sodium: 107 },
    cheese: { calories: 113, protein: 7, carbohydrates: 0.4, fat: 9, fiber: 0, sugar: 0.1, sodium: 174 },
    cereal: { calories: 150, protein: 3, carbohydrates: 33, fat: 1, fiber: 3, sugar: 10, sodium: 200 },
    oatmeal: { calories: 158, protein: 6, carbohydrates: 27, fat: 3, fiber: 4, sugar: 1, sodium: 115 },
    pancake: { calories: 227, protein: 6, carbohydrates: 28, fat: 10, fiber: 1, sugar: 6, sodium: 435 },
    waffle: { calories: 291, protein: 8, carbohydrates: 33, fat: 14, fiber: 2, sugar: 3, sodium: 511 },
    toast: { calories: 79, protein: 2.7, carbohydrates: 15, fat: 1, fiber: 0.6, sugar: 1.5, sodium: 147 },
    avocado: { calories: 234, protein: 3, carbohydrates: 12, fat: 21, fiber: 10, sugar: 1, sodium: 10 },
    broccoli: { calories: 55, protein: 3.7, carbohydrates: 11, fat: 0.6, fiber: 5.1, sugar: 2.2, sodium: 50 },
    carrot: { calories: 52, protein: 1.2, carbohydrates: 12, fat: 0.3, fiber: 3.6, sugar: 6, sodium: 88 },
    potato: { calories: 161, protein: 4.3, carbohydrates: 37, fat: 0.2, fiber: 3.8, sugar: 1.7, sodium: 17 },
    tomato: { calories: 22, protein: 1.1, carbohydrates: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2, sodium: 6 },
  };

  // Find matching food or use default
  let baseData = { calories: 150, protein: 5, carbohydrates: 20, fat: 5, fiber: 2, sugar: 5, sodium: 200 };
  for (const [key, data] of Object.entries(mockData)) {
    if (lowerName.includes(key)) {
      baseData = { ...baseData, ...data };
      break;
    }
  }

  return {
    foodName: foodName,
    servingSize: "1 serving (estimated)",
    calories: baseData.calories,
    protein: baseData.protein,
    carbohydrates: baseData.carbohydrates,
    carbs: baseData.carbohydrates,
    fat: baseData.fat,
    fiber: baseData.fiber,
    sugar: baseData.sugar,
    sodium: baseData.sodium,
    saturatedFat: baseData.fat * 0.3,
    vitamins: [],
    minerals: [],
    source: "mock" as const,
  };
}
