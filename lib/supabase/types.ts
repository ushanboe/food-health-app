// Database types for Supabase

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  serving_size: string | null;
  image_url: string | null;
  barcode: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  servings: number;
  thumbnail: string | null;
  instructions: string | null;
  ingredients: RecipeIngredient[];
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string | null;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  date: string;
  glasses: number;
  created_at: string;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
}

// Database schema type for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      diary_entries: {
        Row: DiaryEntry;
        Insert: Omit<DiaryEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Recipe, 'id' | 'user_id' | 'created_at'>>;
      };
      weight_entries: {
        Row: WeightEntry;
        Insert: Omit<WeightEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<WeightEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      water_entries: {
        Row: WaterEntry;
        Insert: Omit<WaterEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<WaterEntry, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
