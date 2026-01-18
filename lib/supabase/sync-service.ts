import { getSupabaseClient } from '@/lib/supabase-client';
import { useAppStore, MealEntry, DailyLog, Recipe, WeightEntry } from '@/lib/store';

// Get current authenticated user
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
export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Sign in with OAuth provider
export async function signInWithOAuth(provider: 'google' | 'github' | 'apple') {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : undefined,
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
export async function uploadDiaryEntries(dailyLogs: DailyLog[]) {
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
          fiber: meal.fiber || 0,
          sugar: meal.sugar || 0,
          serving_size: meal.servingSize || '',
          image_data: meal.imageData || null,
          timestamp: meal.timestamp instanceof Date ? meal.timestamp.toISOString() : meal.timestamp,
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
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Download diary entries from Supabase
export async function downloadDiaryEntries() {
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
        foodName: entry.food_name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        fiber: entry.fiber,
        sugar: entry.sugar,
        servingSize: entry.serving_size,
        mealType: entry.meal_type === 'snack' ? 'snacks' : entry.meal_type,
        imageData: entry.image_data,
        timestamp: new Date(entry.timestamp || entry.created_at),
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
      message: `Downloaded ${data?.length || 0} diary entries`,
      data: dailyLogs,
      downloaded: data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

// Upload recipes to Supabase
export async function uploadRecipes(recipes: Recipe[]) {
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
        image_url: recipe.imageUrl,
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
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Download recipes from Supabase
export async function downloadRecipes() {
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
      imageUrl: r.image_url,
      instructions: r.instructions,
      ingredients: r.ingredients || [],
      createdAt: r.created_at,
      source: 'imported' as const,
    }));

    return {
      success: true,
      message: `Downloaded ${recipes.length} recipes`,
      data: recipes,
      downloaded: recipes.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

// Upload weight entries to Supabase
export async function uploadWeightEntries(entries: WeightEntry[]) {
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
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Download weight entries from Supabase
export async function downloadWeightEntries() {
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
      message: `Downloaded ${entries.length} weight entries`,
      data: entries,
      downloaded: entries.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

// Delete all user data
export async function deleteAllUserData() {
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
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

// Full sync - upload and download all data
export async function fullSync() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase not configured',
      uploaded: 0,
      downloaded: 0,
    };
  }

  // Check for authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return {
      success: false,
      message: 'Auth session missing!',
      uploaded: 0,
      downloaded: 0,
    };
  }

  const store = useAppStore.getState();
  let totalUploaded = 0;
  let totalDownloaded = 0;
  const allErrors: string[] = [];

  // Upload local data
  const diaryUpload = await uploadDiaryEntries(store.dailyLogs);
  const recipesUpload = await uploadRecipes(store.recipes);
  const weightUpload = await uploadWeightEntries(store.weightHistory);

  totalUploaded += (diaryUpload.uploaded || 0);
  totalUploaded += (recipesUpload.uploaded || 0);
  totalUploaded += (weightUpload.uploaded || 0);

  if (diaryUpload.errors) allErrors.push(...diaryUpload.errors);
  if (recipesUpload.errors) allErrors.push(...recipesUpload.errors);
  if (weightUpload.errors) allErrors.push(...weightUpload.errors);

  // Download cloud data
  const diaryDownload = await downloadDiaryEntries();
  const recipesDownload = await downloadRecipes();
  const weightDownload = await downloadWeightEntries();

  totalDownloaded += (diaryDownload.downloaded || 0);
  totalDownloaded += (recipesDownload.downloaded || 0);
  totalDownloaded += (weightDownload.downloaded || 0);

  // Merge downloaded data into store
  if (diaryDownload.success && diaryDownload.data) {
    // Merge diary logs
    const existingDates = new Set(store.dailyLogs.map(l => l.date));
    const newLogs = diaryDownload.data.filter(l => !existingDates.has(l.date));
    if (newLogs.length > 0) {
      useAppStore.setState({
        dailyLogs: [...store.dailyLogs, ...newLogs],
      });
    }
  }

  if (recipesDownload.success && recipesDownload.data) {
    // Merge recipes
    const existingIds = new Set(store.recipes.map(r => r.id));
    const newRecipes = recipesDownload.data.filter(r => !existingIds.has(r.id));
    if (newRecipes.length > 0) {
      useAppStore.setState({
        recipes: [...store.recipes, ...newRecipes],
      });
    }
  }

  if (weightDownload.success && weightDownload.data) {
    // Merge weight entries
    const existingIds = new Set(store.weightHistory.map(w => w.id));
    const newEntries = weightDownload.data.filter(w => !existingIds.has(w.id));
    if (newEntries.length > 0) {
      useAppStore.setState({
        weightHistory: [...store.weightHistory, ...newEntries],
      });
    }
  }

  return {
    success: allErrors.length === 0,
    message: allErrors.length === 0 
      ? `Synced successfully! Uploaded ${totalUploaded}, downloaded ${totalDownloaded} items.`
      : `Sync completed with errors: ${allErrors.join(', ')}`,
    uploaded: totalUploaded,
    downloaded: totalDownloaded,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

// Export sync service
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
    const diaryResult = await downloadDiaryEntries();
    const recipesResult = await downloadRecipes();
    const weightResult = await downloadWeightEntries();

    const totalDownloaded = (diaryResult.downloaded || 0) + (recipesResult.downloaded || 0) + (weightResult.downloaded || 0);

    return {
      success: diaryResult.success && recipesResult.success && weightResult.success,
      message: `Downloaded ${totalDownloaded} items`,
      downloaded: totalDownloaded,
      diary: diaryResult.data,
      recipes: recipesResult.data,
      weight: weightResult.data,
    };
  },
  fullSync,
  deleteAllUserData,
};
