// Nutrition API Integration
// Uses USDA FoodData Central (free) and Spoonacular (if API key available)

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientNutrition {
  name: string;
  amount: number;
  unit: string;
  nutrition: NutritionData;
}

// USDA FoodData Central - Free API (no key required for basic search)
export async function searchUSDAFood(query: string): Promise<NutritionData | null> {
  try {
    // Using the free search endpoint
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=1&dataType=Survey%20%28FNDDS%29`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const food = data.foods?.[0];
    
    if (!food) return null;
    
    // Extract nutrients (per 100g serving)
    const nutrients = food.foodNutrients || [];
    
    const findNutrient = (names: string[]) => {
      const nutrient = nutrients.find((n: any) => 
        names.some(name => n.nutrientName?.toLowerCase().includes(name.toLowerCase()))
      );
      return nutrient?.value || 0;
    };
    
    return {
      calories: Math.round(findNutrient(['energy', 'calories'])),
      protein: Math.round(findNutrient(['protein']) * 10) / 10,
      carbs: Math.round(findNutrient(['carbohydrate']) * 10) / 10,
      fat: Math.round(findNutrient(['total lipid', 'fat']) * 10) / 10,
    };
  } catch (error) {
    console.error('USDA search error:', error);
    return null;
  }
}

// Spoonacular Ingredient Nutrition (requires API key)
export async function getSpoonacularIngredientNutrition(
  ingredientName: string,
  amount: number,
  unit: string,
  apiKey: string
): Promise<NutritionData | null> {
  try {
    // Parse ingredient to get nutrition
    const response = await fetch(
      `${SPOONACULAR_BASE_URL}/recipes/parseIngredients?includeNutrition=true&apiKey=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `ingredientList=${encodeURIComponent(`${amount} ${unit} ${ingredientName}`)}`,
        signal: AbortSignal.timeout(10000),
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const ingredient = data[0];
    
    if (!ingredient?.nutrition?.nutrients) return null;
    
    const nutrients = ingredient.nutrition.nutrients;
    const findNutrient = (name: string) =>
      nutrients.find((n: any) => n.name.toLowerCase() === name.toLowerCase())?.amount || 0;
    
    return {
      calories: Math.round(findNutrient('Calories')),
      protein: Math.round(findNutrient('Protein') * 10) / 10,
      carbs: Math.round(findNutrient('Carbohydrates') * 10) / 10,
      fat: Math.round(findNutrient('Fat') * 10) / 10,
    };
  } catch (error) {
    console.error('Spoonacular ingredient error:', error);
    return null;
  }
}

// Calculate nutrition for a list of ingredients
export async function calculateIngredientsNutrition(
  ingredients: { name: string; amount: number; unit: string }[],
  spoonacularApiKey?: string
): Promise<IngredientNutrition[]> {
  const results: IngredientNutrition[] = [];
  
  for (const ing of ingredients) {
    let nutrition: NutritionData | null = null;
    
    // Try Spoonacular first if API key available (more accurate)
    if (spoonacularApiKey) {
      nutrition = await getSpoonacularIngredientNutrition(
        ing.name,
        ing.amount,
        ing.unit,
        spoonacularApiKey
      );
    }
    
    // Fallback to USDA
    if (!nutrition) {
      nutrition = await searchUSDAFood(ing.name);
    }
    
    results.push({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      nutrition: nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Estimate nutrition from ingredient name using common food database
// This is a simple fallback with common foods
export function estimateNutritionFromName(ingredientName: string): NutritionData {
  const name = ingredientName.toLowerCase();
  
  // Common food estimates per typical serving
  const estimates: Record<string, NutritionData> = {
    // Proteins
    'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    'beef': { calories: 250, protein: 26, carbs: 0, fat: 15 },
    'pork': { calories: 242, protein: 27, carbs: 0, fat: 14 },
    'fish': { calories: 136, protein: 20, carbs: 0, fat: 5 },
    'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13 },
    'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1 },
    'shrimp': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
    'egg': { calories: 78, protein: 6, carbs: 0.6, fat: 5 },
    'tofu': { calories: 76, protein: 8, carbs: 2, fat: 4.5 },
    
    // Carbs
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
    'bread': { calories: 79, protein: 2.7, carbs: 15, fat: 1 },
    'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
    'noodle': { calories: 138, protein: 4.5, carbs: 25, fat: 2 },
    
    // Vegetables
    'onion': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
    'garlic': { calories: 4, protein: 0.2, carbs: 1, fat: 0 },
    'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
    'broccoli': { calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    'pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
    'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
    'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    'cucumber': { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
    'zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    
    // Dairy
    'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
    'cheese': { calories: 113, protein: 7, carbs: 0.4, fat: 9 },
    'butter': { calories: 102, protein: 0.1, carbs: 0, fat: 11.5 },
    'cream': { calories: 52, protein: 0.4, carbs: 0.5, fat: 5.5 },
    'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.7 },
    
    // Oils & Fats
    'oil': { calories: 120, protein: 0, carbs: 0, fat: 14 },
    'olive oil': { calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    
    // Fruits
    'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
    'lemon': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
    
    // Legumes
    'beans': { calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
    'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
    'chickpea': { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
    
    // Nuts & Seeds
    'almond': { calories: 164, protein: 6, carbs: 6, fat: 14 },
    'peanut': { calories: 161, protein: 7, carbs: 4.6, fat: 14 },
    'walnut': { calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5 },
    
    // Condiments & Sauces
    'sugar': { calories: 49, protein: 0, carbs: 12.6, fat: 0 },
    'honey': { calories: 64, protein: 0.1, carbs: 17, fat: 0 },
    'soy sauce': { calories: 8, protein: 1.3, carbs: 0.8, fat: 0 },
    'vinegar': { calories: 3, protein: 0, carbs: 0.1, fat: 0 },
    'salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
    'pepper': { calories: 6, protein: 0.2, carbs: 1.5, fat: 0.1 },
  };
  
  // Find matching estimate
  for (const [key, value] of Object.entries(estimates)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  // Default estimate for unknown ingredients
  return { calories: 50, protein: 2, carbs: 5, fat: 2 };
}

// Quick estimate without API calls
export function quickEstimateIngredients(
  ingredients: { name: string; amount: number; unit: string }[]
): IngredientNutrition[] {
  return ingredients.map(ing => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    nutrition: estimateNutritionFromName(ing.name),
  }));
}
