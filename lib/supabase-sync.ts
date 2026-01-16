import { getSupabase } from './supabase';
import type { FoodAnalysis, WeightEntry, Recipe, DailyGoals, UserStats, MealEntry } from './store';

interface MealWithDate extends MealEntry {
  date: string;
}

interface SyncData {
  history: FoodAnalysis[];
  meals: MealWithDate[];
  weights: WeightEntry[];
  recipes: Recipe[];
  dailyGoals: DailyGoals;
  userStats: UserStats;
  preferences: string[];
  allergies: string[];
  goals: string[];
}

export async function performFullSync(userId: string, data: SyncData): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not initialized');

  // Sync food history
  if (data.history.length > 0) {
    const historyRows = data.history.map(item => ({
      id: item.id,
      user_id: userId,
      timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
      image_data: item.imageData,
      food_name: item.foodName,
      category: item.category,
      health_score: item.healthScore,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar || 0,
      sodium: item.sodium || 0,
      verdict: item.verdict,
      description: item.description,
      alternatives: item.alternatives,
      serving_size: item.servingSize,
      barcode: item.barcode,
      brand_name: item.brandName,
      nutri_score: item.nutriScore,
    }));

    const { error: historyError } = await supabase
      .from('food_history')
      .upsert(historyRows, { onConflict: 'id' });
    if (historyError) throw historyError;
  }

  // Sync meals
  if (data.meals.length > 0) {
    const mealRows = data.meals.map(meal => ({
      id: meal.id,
      user_id: userId,
      meal_type: meal.mealType,
      food_name: meal.foodName,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber || 0,
      sugar: meal.sugar || 0,
      serving_size: meal.servingSize,
      image_data: meal.imageData,
      timestamp: meal.timestamp instanceof Date ? meal.timestamp.toISOString() : meal.timestamp,
      source_analysis_id: meal.sourceAnalysisId,
      date: meal.date,
    }));

    const { error: mealsError } = await supabase
      .from('meals')
      .upsert(mealRows, { onConflict: 'id' });
    if (mealsError) throw mealsError;
  }

  // Sync weight history
  if (data.weights.length > 0) {
    const weightRows = data.weights.map(w => ({
      id: w.id,
      user_id: userId,
      date: w.date,
      weight: w.weight,
      note: w.note || '',
    }));

    const { error: weightsError } = await supabase
      .from('weight_history')
      .upsert(weightRows, { onConflict: 'id' });
    if (weightsError) throw weightsError;
  }

  // Sync recipes
  if (data.recipes.length > 0) {
    const recipeRows = data.recipes.map(r => ({
      id: r.id,
      user_id: userId,
      name: r.name,
      servings: r.servings,
      ingredients: r.ingredients,
      created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      image_url: r.imageUrl,
      instructions: r.instructions,
      
    }));

    const { error: recipesError } = await supabase
      .from('recipes')
      .upsert(recipeRows, { onConflict: 'id' });
    if (recipesError) throw recipesError;
  }

  // Sync user profile & settings
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      daily_goals: data.dailyGoals,
      user_stats: data.userStats,
      dietary_preferences: data.preferences,
      allergies: data.allergies,
      health_goals: data.goals,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (profileError) throw profileError;
}

export async function fetchUserData(userId: string): Promise<Partial<SyncData>> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not initialized');

  const [historyRes, mealsRes, weightsRes, recipesRes, profileRes] = await Promise.all([
    supabase.from('food_history').select('*').eq('user_id', userId),
    supabase.from('meals').select('*').eq('user_id', userId),
    supabase.from('weight_history').select('*').eq('user_id', userId),
    supabase.from('recipes').select('*').eq('user_id', userId),
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
  ]);

  return {
    history: (historyRes.data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      imageData: row.image_data,
      foodName: row.food_name,
      category: row.category,
      healthScore: row.health_score,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      sodium: row.sodium,
      verdict: row.verdict,
      description: row.description,
      alternatives: row.alternatives,
      servingSize: row.serving_size,
      barcode: row.barcode,
      brandName: row.brand_name,
      nutriScore: row.nutri_score,
    })),
    meals: (mealsRes.data || []).map(row => ({
      id: row.id,
      mealType: row.meal_type,
      foodName: row.food_name,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      servingSize: row.serving_size,
      imageData: row.image_data,
      timestamp: new Date(row.timestamp),
      sourceAnalysisId: row.source_analysis_id,
      date: row.date,
    })),
    weights: (weightsRes.data || []).map(row => ({
      id: row.id,
      date: row.date,
      weight: row.weight,
      note: row.note,
    })),
    recipes: (recipesRes.data || []).map(row => ({
      id: row.id,
      name: row.name,
      servings: row.servings,
      ingredients: row.ingredients,
      createdAt: new Date(row.created_at),
      imageUrl: row.thumbnail || row.image_url,
      instructions: row.instructions,
      imageData: row.image_data,
    })),
    dailyGoals: profileRes.data?.daily_goals,
    userStats: profileRes.data?.user_stats,
    preferences: profileRes.data?.dietary_preferences || [],
    allergies: profileRes.data?.allergies || [],
    goals: profileRes.data?.health_goals || [],
  };
}
