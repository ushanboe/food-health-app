// TheMealDB API Integration
// Free API - No key required
// Docs: https://www.themealdb.com/api.php

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube?: string;
  strSource?: string;
  ingredients: { name: string; measure: string }[];
}

export interface MealDBCategory {
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

// Parse meal data and extract ingredients
function parseMeal(meal: any): MealDBMeal {
  const ingredients: { name: string; measure: string }[] = [];
  
  // TheMealDB stores ingredients as strIngredient1-20 and strMeasure1-20
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure?.trim() || ''
      });
    }
  }
  
  return {
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strCategory: meal.strCategory || '',
    strArea: meal.strArea || '',
    strInstructions: meal.strInstructions || '',
    strMealThumb: meal.strMealThumb || '',
    strYoutube: meal.strYoutube,
    strSource: meal.strSource,
    ingredients
  };
}

// Search meals by name
export async function searchMeals(query: string): Promise<MealDBMeal[]> {
  try {
    const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.meals) return [];
    
    return data.meals.map(parseMeal);
  } catch (error) {
    console.error('MealDB search error:', error);
    return [];
  }
}

// Get meal by ID
export async function getMealById(id: string): Promise<MealDBMeal | null> {
  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.meals || !data.meals[0]) return null;
    
    return parseMeal(data.meals[0]);
  } catch (error) {
    console.error('MealDB lookup error:', error);
    return null;
  }
}

// Get random meal
export async function getRandomMeal(): Promise<MealDBMeal | null> {
  try {
    const response = await fetch(`${BASE_URL}/random.php`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.meals || !data.meals[0]) return null;
    
    return parseMeal(data.meals[0]);
  } catch (error) {
    console.error('MealDB random error:', error);
    return null;
  }
}

// List all categories
export async function getCategories(): Promise<MealDBCategory[]> {
  try {
    const response = await fetch(`${BASE_URL}/categories.php`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('MealDB categories error:', error);
    return [];
  }
}

// Filter meals by category
export async function getMealsByCategory(category: string): Promise<{ idMeal: string; strMeal: string; strMealThumb: string }[]> {
  try {
    const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('MealDB filter error:', error);
    return [];
  }
}

// List all areas/cuisines
export async function getAreas(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/list.php?a=list`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.meals || []).map((m: any) => m.strArea);
  } catch (error) {
    console.error('MealDB areas error:', error);
    return [];
  }
}

// Filter meals by area/cuisine
export async function getMealsByArea(area: string): Promise<{ idMeal: string; strMeal: string; strMealThumb: string }[]> {
  try {
    const response = await fetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('MealDB area filter error:', error);
    return [];
  }
}

// Get first letter meals (for browsing)
export async function getMealsByFirstLetter(letter: string): Promise<MealDBMeal[]> {
  try {
    const response = await fetch(`${BASE_URL}/search.php?f=${letter.charAt(0).toLowerCase()}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.meals) return [];
    
    return data.meals.map(parseMeal);
  } catch (error) {
    console.error('MealDB letter search error:', error);
    return [];
  }
}
