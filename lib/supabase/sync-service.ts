import { getSupabaseClient } from './client';
import { useAppStore, MealEntry, DailyLog, Recipe, WeightEntry } from '../store';

export interface SyncResult {
  success: boolean;
  message: string;
  uploaded?: number;
  downloaded?: number;
  errors?: string[];
}

// Get the current user
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Sign up with email/password
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });
  if (error) throw error;
  return data;
}

// Sign in with OAuth provider
export async function signInWithOAuth(provider: 'google' | 'apple' | 'github') {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Upload diary entries to Supabase
export async function uploadDiaryEntries(dailyLogs: DailyLog[]): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    let uploadCount = 0;
    const errors: string[] = [];

    // Flatten dailyLogs into individual entries
    for (const log of dailyLogs) {
      for (const meal of log.meals) {
        const entry = {
          id: meal.id,
          user_id: user.id,
          date: log.date,
          meal_type: meal.mealType === 'snacks' ? 'snack' : meal.mealType,
          food_name: meal.foodName,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
          sugar: meal.sugar,
          serving_size: meal.servingSize,
          created_at: meal.timestamp,
        };

        const { error } = await supabase
          .from('diary_entries')
          .upsert(entry, { onConflict: 'id' });

        if (error) {
          errors.push(`Failed to upload ${meal.foodName}: ${error.message}`);
        } else {
          uploadCount++;
        }
      }
    }

    return {
      success: errors.length === 0,
      message: `Uploaded ${uploadCount} diary entries`,
      uploaded: uploadCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Download diary entries from Supabase
export async function downloadDiaryEntries(): Promise<{ success: boolean; data?: DailyLog[]; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    // Group entries by date into DailyLog format
    const logsMap = new Map<string, MealEntry[]>();
    
    for (const entry of data || []) {
      const mealEntry: MealEntry = {
        id: entry.id,
        mealType: entry.meal_type === 'snack' ? 'snacks' : entry.meal_type,
        foodName: entry.food_name,
        calories: entry.calories || 0,
        protein: entry.protein || 0,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
        fiber: entry.fiber,
        sugar: entry.sugar,
        servingSize: entry.serving_size,
        timestamp: new Date(entry.created_at),
      };

      const existing = logsMap.get(entry.date) || [];
      existing.push(mealEntry);
      logsMap.set(entry.date, existing);
    }

    const dailyLogs: DailyLog[] = Array.from(logsMap.entries()).map(([date, meals]) => ({
      date,
      meals,
    }));

    return {
      success: true,
      data: dailyLogs,
      message: `Downloaded ${data?.length || 0} diary entries`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Upload recipes to Supabase
export async function uploadRecipes(recipes: Recipe[]): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    let uploadCount = 0;
    const errors: string[] = [];

    for (const recipe of recipes) {
      const entry = {
        id: recipe.id,
        user_id: user.id,
        name: recipe.name,
        servings: recipe.servings,
        imageUrl: recipe.imageUrl,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        created_at: recipe.createdAt,
      };

      const { error } = await supabase
        .from('recipes')
        .upsert(entry, { onConflict: 'id' });

      if (error) {
        errors.push(`Failed to upload ${recipe.name}: ${error.message}`);
      } else {
        uploadCount++;
      }
    }

    return {
      success: errors.length === 0,
      message: `Uploaded ${uploadCount} recipes`,
      uploaded: uploadCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Download recipes from Supabase
export async function downloadRecipes(): Promise<{ success: boolean; data?: Recipe[]; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const recipes: Recipe[] = (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      servings: r.servings,
      imageUrl: r.thumbnail || r.image_url,
      instructions: r.instructions,
      ingredients: r.ingredients || [],
      createdAt: new Date(r.created_at),
    }));

    return {
      success: true,
      data: recipes,
      message: `Downloaded ${recipes.length} recipes`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Upload weight entries to Supabase
export async function uploadWeightEntries(entries: WeightEntry[]): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    let uploadCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      const data = {
        id: entry.id,
        user_id: user.id,
        weight_kg: entry.weight,
        date: entry.date,
        notes: entry.note,
      };

      const { error } = await supabase
        .from('weight_entries')
        .upsert(data, { onConflict: 'id' });

      if (error) {
        errors.push(`Failed to upload weight entry: ${error.message}`);
      } else {
        uploadCount++;
      }
    }

    return {
      success: errors.length === 0,
      message: `Uploaded ${uploadCount} weight entries`,
      uploaded: uploadCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Download weight entries from Supabase
export async function downloadWeightEntries(): Promise<{ success: boolean; data?: WeightEntry[]; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    const entries: WeightEntry[] = (data || []).map((e) => ({
      id: e.id,
      date: e.date,
      weight: e.weight_kg,
      note: e.notes,
    }));

    return {
      success: true,
      data: entries,
      message: `Downloaded ${entries.length} weight entries`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Full sync - upload and download all data
export async function fullSync(): Promise<SyncResult> {
  const store = useAppStore.getState();
  const errors: string[] = [];
  let totalUploaded = 0;
  let totalDownloaded = 0;

  try {
    // Upload local data
    const diaryResult = await uploadDiaryEntries(store.dailyLogs);
    if (!diaryResult.success && diaryResult.errors) {
      errors.push(...diaryResult.errors);
    }
    totalUploaded += diaryResult.uploaded || 0;

    const recipesResult = await uploadRecipes(store.recipes);
    if (!recipesResult.success && recipesResult.errors) {
      errors.push(...recipesResult.errors);
    }
    totalUploaded += recipesResult.uploaded || 0;

    const weightResult = await uploadWeightEntries(store.weightHistory);
    if (!weightResult.success && weightResult.errors) {
      errors.push(...weightResult.errors);
    }
    totalUploaded += weightResult.uploaded || 0;

    // Download cloud data (for merging on other devices)
    const downloadedDiary = await downloadDiaryEntries();
    if (downloadedDiary.success && downloadedDiary.data) {
      totalDownloaded += downloadedDiary.data.reduce((acc, log) => acc + log.meals.length, 0);
    }

    const downloadedRecipes = await downloadRecipes();
    if (downloadedRecipes.success && downloadedRecipes.data) {
      totalDownloaded += downloadedRecipes.data.length;
    }

    const downloadedWeight = await downloadWeightEntries();
    if (downloadedWeight.success && downloadedWeight.data) {
      totalDownloaded += downloadedWeight.data.length;
    }

    // Update last sync time
    store.updateAISettings({
      supabaseLastSync: new Date().toISOString(),
    });

    return {
      success: errors.length === 0,
      message: `Synced ${totalUploaded} items up, ${totalDownloaded} items down`,
      uploaded: totalUploaded,
      downloaded: totalDownloaded,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Delete user account and all data
export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    // Delete all user data from tables
    await supabase.from('diary_entries').delete().eq('user_id', user.id);
    await supabase.from('recipes').delete().eq('user_id', user.id);
    await supabase.from('weight_entries').delete().eq('user_id', user.id);
    await supabase.from('water_entries').delete().eq('user_id', user.id);
    await supabase.from('exercise_entries').delete().eq('user_id', user.id);
    await supabase.from('meal_plans').delete().eq('user_id', user.id);
    await supabase.from('fitness_connections').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    // Sign out
    await signOut();

    return { success: true, message: 'Account deleted successfully' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Convenience object for importing all sync functions
export const syncService = {
  getCurrentUser,
  signIn: signInWithEmail,
  signUp: signUpWithEmail,
  signInWithOAuth,
  signOut,
  uploadToCloud: async () => {
    const store = useAppStore.getState();
    const diaryResult = await uploadDiaryEntries(store.dailyLogs);
    const recipesResult = await uploadRecipes(store.recipes);
    const weightResult = await uploadWeightEntries(store.weightHistory);

    const totalUploaded = (diaryResult.uploaded || 0) + (recipesResult.uploaded || 0) + (weightResult.uploaded || 0);
    const allErrors = [...(diaryResult.errors || []), ...(recipesResult.errors || []), ...(weightResult.errors || [])];

    return {
      success: allErrors.length === 0,
      message: `Uploaded ${totalUploaded} items`,
      uploaded: totalUploaded,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  },
  downloadFromCloud: async () => {
    const downloadedDiary = await downloadDiaryEntries();
    const downloadedRecipes = await downloadRecipes();
    const downloadedWeight = await downloadWeightEntries();

    let totalDownloaded = 0;
    if (downloadedDiary.success && downloadedDiary.data) {
      totalDownloaded += downloadedDiary.data.reduce((acc, log) => acc + log.meals.length, 0);
    }
    if (downloadedRecipes.success && downloadedRecipes.data) {
      totalDownloaded += downloadedRecipes.data.length;
    }
    if (downloadedWeight.success && downloadedWeight.data) {
      totalDownloaded += downloadedWeight.data.length;
    }

    return {
      success: true,
      message: `Downloaded ${totalDownloaded} items`,
      downloaded: totalDownloaded,
      diaryData: downloadedDiary.data,
      recipesData: downloadedRecipes.data,
      weightData: downloadedWeight.data,
    };
  },
  fullSync,
  deleteAccount,
};
