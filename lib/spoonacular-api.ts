// Spoonacular API Integration
// Free tier: 150 calls/day
// Docs: https://spoonacular.com/food-api

const BASE_URL = 'https://api.spoonacular.com';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  instructions: string;
  extendedIngredients: {
    name: string;
    amount: number;
    unit: string;
    original: string;
  }[];
  nutrition?: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
    }[];
  };
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

// Search recipes by query
export async function searchSpoonacularRecipes(
  query: string,
  apiKey: string
): Promise<SpoonacularSearchResult[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=10&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('API quota exceeded - try again tomorrow');
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Spoonacular search error:', error);
    throw error;
  }
}

// Get recipe details with nutrition
export async function getSpoonacularRecipe(
  id: number,
  apiKey: string
): Promise<SpoonacularRecipe | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/recipes/${id}/information?includeNutrition=true&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Spoonacular recipe error:', error);
    return null;
  }
}

// Get random recipes
export async function getRandomSpoonacularRecipes(
  apiKey: string,
  count: number = 5
): Promise<SpoonacularRecipe[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/recipes/random?number=${count}&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.recipes || [];
  } catch (error) {
    console.error('Spoonacular random error:', error);
    return [];
  }
}

// Extract nutrition from Spoonacular recipe
export function extractNutrition(recipe: SpoonacularRecipe) {
  const nutrients = recipe.nutrition?.nutrients || [];
  
  const findNutrient = (name: string) => 
    nutrients.find(n => n.name.toLowerCase() === name.toLowerCase())?.amount || 0;
  
  return {
    calories: Math.round(findNutrient('Calories')),
    protein: Math.round(findNutrient('Protein')),
    carbs: Math.round(findNutrient('Carbohydrates')),
    fat: Math.round(findNutrient('Fat')),
  };
}
