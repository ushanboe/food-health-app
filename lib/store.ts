import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIProvider } from "./ai-vision";
import { FitnessProvider, FitnessConnection, AggregatedFitnessData } from "./fitness-sync/types";

export interface FoodAnalysis {
  id: string;
  timestamp: Date;
  imageData: string;
  foodName: string;
  category: string;
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  verdict: "healthy" | "moderate" | "unhealthy";
  description: string;
  alternatives: string[];
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  barcode?: string;
  brandName?: string;
  nutriScore?: string;
  novaGroup?: number;
  source?: "ai" | "barcode";
}

export interface UserProfile {
  name: string;
  dietaryPreferences: string[];
  allergies: string[];
  healthGoals: string[];
}

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  openaiApiKey: string;
  spoonacularApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseLastSync?: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // daily water goal in ml (default 2000ml = ~8 cups)
  exerciseCalories: number; // daily exercise calorie burn goal (default 300)
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface MealEntry {
  id: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  servingSize?: string;
  imageData?: string;
  timestamp: Date;
  sourceAnalysisId?: string;
}

export interface DailyLog {
  date: string;
  meals: MealEntry[];
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

// ============ WATER TRACKING ============
export interface WaterEntry {
  id: string;
  date: string;
  amount: number; // in ml
  timestamp: Date;
}

export interface DailyWaterLog {
  date: string;
  entries: WaterEntry[];
}

export interface UserStats {
  height: number;
  currentWeight: number;
  targetWeight: number;
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  weightGoal: "lose" | "maintain" | "gain";
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  rating?: number; // 1-5 star rating
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  instructions?: string;
  imageUrl?: string;
  createdAt: Date;
  source?: "manual" | "imported" | "api";
  sourceUrl?: string;
}

// ============ PHASE 3: FITNESS TRACKING ============

export type ExerciseCategory = "cardio" | "strength" | "flexibility" | "sports" | "daily";

export interface ExerciseType {
  id: string;
  name: string;
  category: ExerciseCategory;
  metValue: number;
  icon: string;
}

export interface ExerciseEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  duration: number;
  caloriesBurned: number;
  intensity: "light" | "moderate" | "vigorous";
  notes?: string;
  timestamp: Date;
  date: string;
}

export interface DailyFitnessLog {
  date: string;
  exercises: ExerciseEntry[];
  steps: number;
}

export const EXERCISE_TYPES: ExerciseType[] = [
  { id: "walking", name: "Walking", category: "cardio", metValue: 3.5, icon: "🚶" },
  { id: "running", name: "Running", category: "cardio", metValue: 9.8, icon: "🏃" },
  { id: "cycling", name: "Cycling", category: "cardio", metValue: 7.5, icon: "🚴" },
  { id: "swimming", name: "Swimming", category: "cardio", metValue: 8.0, icon: "🏊" },
  { id: "jump_rope", name: "Jump Rope", category: "cardio", metValue: 11.0, icon: "⏫" },
  { id: "rowing", name: "Rowing", category: "cardio", metValue: 7.0, icon: "🚣" },
  { id: "elliptical", name: "Elliptical", category: "cardio", metValue: 5.0, icon: "🔄" },
  { id: "stair_climbing", name: "Stair Climbing", category: "cardio", metValue: 8.8, icon: "🪜" },
  { id: "weight_lifting", name: "Weight Lifting", category: "strength", metValue: 6.0, icon: "🏋️" },
  { id: "bodyweight", name: "Bodyweight Exercises", category: "strength", metValue: 5.0, icon: "💪" },
  { id: "resistance_bands", name: "Resistance Bands", category: "strength", metValue: 4.5, icon: "🎗️" },
  { id: "crossfit", name: "CrossFit", category: "strength", metValue: 8.0, icon: "🔥" },
  { id: "yoga", name: "Yoga", category: "flexibility", metValue: 3.0, icon: "🧘" },
  { id: "pilates", name: "Pilates", category: "flexibility", metValue: 3.5, icon: "🤸" },
  { id: "stretching", name: "Stretching", category: "flexibility", metValue: 2.5, icon: "🙆" },
  { id: "basketball", name: "Basketball", category: "sports", metValue: 8.0, icon: "🏀" },
  { id: "soccer", name: "Soccer/Football", category: "sports", metValue: 10.0, icon: "⚽" },
  { id: "tennis", name: "Tennis", category: "sports", metValue: 7.3, icon: "🎾" },
  { id: "badminton", name: "Badminton", category: "sports", metValue: 5.5, icon: "🏸" },
  { id: "golf", name: "Golf", category: "sports", metValue: 4.8, icon: "⛳" },
  { id: "hiking", name: "Hiking", category: "sports", metValue: 6.0, icon: "🥾" },
  { id: "dancing", name: "Dancing", category: "sports", metValue: 6.5, icon: "💃" },
  { id: "martial_arts", name: "Martial Arts", category: "sports", metValue: 10.0, icon: "🥋" },
  { id: "housework", name: "Housework", category: "daily", metValue: 3.5, icon: "🧹" },
  { id: "gardening", name: "Gardening", category: "daily", metValue: 4.0, icon: "🌱" },
  { id: "playing_kids", name: "Playing with Kids", category: "daily", metValue: 5.0, icon: "👶" },
];

export const calculateCaloriesBurned = (
  metValue: number,
  weightKg: number,
  durationMinutes: number,
  intensity: "light" | "moderate" | "vigorous" = "moderate"
): number => {
  const intensityMultiplier = { light: 0.8, moderate: 1.0, vigorous: 1.3 };
  const hours = durationMinutes / 60;
  return Math.round(metValue * weightKg * hours * intensityMultiplier[intensity]);
};

// ============ STORE INTERFACE ============

export type Theme = "light" | "dark" | "system";
interface AppState {
  currentImage: string | null;
  scannedBarcode: string | null;
  isAnalyzing: boolean;
  currentAnalysis: FoodAnalysis | null;
  analysisHistory: FoodAnalysis[];
  userProfile: UserProfile;
  aiSettings: AISettings;
  dailyGoals: DailyGoals;
  dailyLogs: DailyLog[];
  weightHistory: WeightEntry[];
  userStats: UserStats;
  recipes: Recipe[];
  fitnessLogs: DailyFitnessLog[];
  waterLogs: DailyWaterLog[];

  setCurrentImage: (image: string | null) => void;
  setScannedBarcode: (barcode: string | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setCurrentAnalysis: (analysis: FoodAnalysis | null) => void;
  addToHistory: (analysis: FoodAnalysis) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  updateDailyGoals: (goals: Partial<DailyGoals>) => void;
  addMealEntry: (entry: MealEntry) => void;
  removeMealEntry: (date: string, entryId: string) => void;
  getDailyLog: (date: string) => DailyLog | undefined;
  getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number };
  clearDailyLog: (date: string) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  removeWeightEntry: (id: string) => void;
  updateUserStats: (stats: Partial<UserStats>) => void;
  calculateTDEE: () => number;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;
  // Fitness actions
  addExerciseEntry: (entry: ExerciseEntry) => void;
  removeExerciseEntry: (date: string, entryId: string) => void;
  updateSteps: (date: string, steps: number) => void;
  getDailyFitnessLog: (date: string) => DailyFitnessLog | undefined;
  getDailyCaloriesBurned: (date: string) => number;
  getNetCalories: (date: string) => number;

  // Water tracking actions
  addWaterEntry: (entry: WaterEntry) => void;
  removeWaterEntry: (date: string, entryId: string) => void;
  getDailyWaterLog: (date: string) => DailyWaterLog | undefined;
  getDailyWaterTotal: (date: string) => number;

  // Fitness Sync State (External Providers)
  fitnessConnections: Record<FitnessProvider, FitnessConnection | null>;
  syncedFitnessData: AggregatedFitnessData | null;
  fitnessSyncPreferences: {
    autoSyncEnabled: boolean;
    syncIntervalMinutes: number;
    syncDaysBack: number;
    preferredStepsSource: FitnessProvider | 'manual' | 'auto';
    preferredCaloriesSource: FitnessProvider | 'manual' | 'auto';
  };
  lastFitnessSyncAt: string | null;
  isFitnessSyncing: boolean;
  fitnessSyncError: string | null;

  // Theme
  theme: Theme;

  // Fitness Sync Actions
  setFitnessConnection: (provider: FitnessProvider, connection: FitnessConnection | null) => void;
  clearFitnessConnection: (provider: FitnessProvider) => void;
  setSyncedFitnessData: (data: AggregatedFitnessData | null) => void;
  updateFitnessSyncPreferences: (prefs: Partial<AppState['fitnessSyncPreferences']>) => void;
  setFitnessSyncing: (syncing: boolean) => void;
  setFitnessSyncError: (error: string | null) => void;
  setLastFitnessSyncAt: (timestamp: string | null) => void;
  getConnectedFitnessProviders: () => FitnessProvider[];
  isFitnessProviderConnected: (provider: FitnessProvider) => boolean;

  // Theme action
  setTheme: (theme: Theme) => void;
}

export const getTodayString = () => new Date().toISOString().split("T")[0];

const calculateBMR = (stats: UserStats): number => {
  if (stats.gender === "male") {
    return 88.362 + 13.397 * stats.currentWeight + 4.799 * stats.height - 5.677 * stats.age;
  }
  return 447.593 + 9.247 * stats.currentWeight + 3.098 * stats.height - 4.33 * stats.age;
};

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentImage: null,
      scannedBarcode: null,
      isAnalyzing: false,
      currentAnalysis: null,
      analysisHistory: [],
      userProfile: {
        name: "",
        dietaryPreferences: [],
        allergies: [],
        healthGoals: [],
      },
      aiSettings: {
        provider: "demo",
        geminiApiKey: "",
        openaiApiKey: "",
        spoonacularApiKey: "",
        supabaseUrl: "",
        supabaseAnonKey: "",
      },
      dailyGoals: {
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 65,
        water: 2000, // 2000ml = ~8 cups
        exerciseCalories: 300, // default 300 cal burn goal
      },
      dailyLogs: [],
      weightHistory: [],
      userStats: {
        height: 170,
        currentWeight: 70,
        targetWeight: 70,
        age: 30,
        gender: "male",
        activityLevel: "moderate",
        weightGoal: "maintain",
      },
      recipes: [],
      fitnessLogs: [],
      waterLogs: [],

      // Fitness Sync State
      fitnessConnections: {
        google_fit: null,
        fitbit: null,
        strava: null,
        garmin: null,
      },
      syncedFitnessData: null,
      fitnessSyncPreferences: {
        autoSyncEnabled: false,
        syncIntervalMinutes: 60,
        syncDaysBack: 7,
        preferredStepsSource: 'auto',
        preferredCaloriesSource: 'auto',
      },
      lastFitnessSyncAt: null,
      isFitnessSyncing: false,
      fitnessSyncError: null,
      theme: "light" as Theme,

      setCurrentImage: (image) => set({ currentImage: image }),
      setScannedBarcode: (barcode) => set({ scannedBarcode: barcode }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

      addToHistory: (analysis) =>
        set((state) => ({
          analysisHistory: [analysis, ...state.analysisHistory].slice(0, 50),
        })),

      removeFromHistory: (id) =>
        set((state) => ({
          analysisHistory: state.analysisHistory.filter((a) => a.id !== id),
        })),

      clearHistory: () => set({ analysisHistory: [] }),

      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),

      updateAISettings: (settings) =>
        set((state) => ({
          aiSettings: { ...state.aiSettings, ...settings },
        })),

      updateDailyGoals: (goals) =>
        set((state) => ({
          dailyGoals: { ...state.dailyGoals, ...goals },
        })),

      addMealEntry: (entry) =>
        set((state) => {
          const today = getTodayString();
          const existingLog = state.dailyLogs.find((l) => l.date === today);
          if (existingLog) {
            return {
              dailyLogs: state.dailyLogs.map((l) =>
                l.date === today ? { ...l, meals: [...l.meals, entry] } : l
              ),
            };
          }
          return {
            dailyLogs: [...state.dailyLogs, { date: today, meals: [entry] }],
          };
        }),

      removeMealEntry: (date, entryId) =>
        set((state) => ({
          dailyLogs: state.dailyLogs.map((l) =>
            l.date === date
              ? { ...l, meals: l.meals.filter((m) => m.id !== entryId) }
              : l
          ),
        })),

      getDailyLog: (date) => get().dailyLogs.find((l) => l.date === date),

      getDailyTotals: (date) => {
        const log = get().dailyLogs.find((l) => l.date === date);
        if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return log.meals.reduce(
          (acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fat: acc.fat + m.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      clearDailyLog: (date) =>
        set((state) => ({
          dailyLogs: state.dailyLogs.filter((l) => l.date !== date),
        })),

      addWeightEntry: (entry) =>
        set((state) => {
          const filtered = state.weightHistory.filter((w) => w.date !== entry.date);
          const updated = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
          return {
            weightHistory: updated.slice(-90),
            userStats: { ...state.userStats, currentWeight: entry.weight },
          };
        }),

      removeWeightEntry: (id) =>
        set((state) => ({
          weightHistory: state.weightHistory.filter((w) => w.id !== id),
        })),

      updateUserStats: (stats) =>
        set((state) => ({
          userStats: { ...state.userStats, ...stats },
        })),

      calculateTDEE: () => {
        const { userStats } = get();
        const bmr = calculateBMR(userStats);
        const tdee = bmr * activityMultipliers[userStats.activityLevel];
        if (userStats.weightGoal === "lose") return Math.round(tdee - 500);
        if (userStats.weightGoal === "gain") return Math.round(tdee + 300);
        return Math.round(tdee);
      },

      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [recipe, ...state.recipes],
        })),

      updateRecipe: (id, updates) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),

      // Fitness actions
      addExerciseEntry: (entry) =>
        set((state) => {
          const existingLog = state.fitnessLogs.find((l) => l.date === entry.date);
          if (existingLog) {
            return {
              fitnessLogs: state.fitnessLogs.map((l) =>
                l.date === entry.date
                  ? { ...l, exercises: [...l.exercises, entry] }
                  : l
              ),
            };
          }
          return {
            fitnessLogs: [...state.fitnessLogs, { date: entry.date, exercises: [entry], steps: 0 }],
          };
        }),

      removeExerciseEntry: (date, entryId) =>
        set((state) => ({
          fitnessLogs: state.fitnessLogs.map((l) =>
            l.date === date
              ? { ...l, exercises: l.exercises.filter((e) => e.id !== entryId) }
              : l
          ),
        })),

      updateSteps: (date, steps) =>
        set((state) => {
          const existingLog = state.fitnessLogs.find((l) => l.date === date);
          if (existingLog) {
            return {
              fitnessLogs: state.fitnessLogs.map((l) =>
                l.date === date ? { ...l, steps } : l
              ),
            };
          }
          return {
            fitnessLogs: [...state.fitnessLogs, { date, exercises: [], steps }],
          };
        }),

      getDailyFitnessLog: (date) => get().fitnessLogs.find((l) => l.date === date),

      getDailyCaloriesBurned: (date) => {
        const log = get().fitnessLogs.find((l) => l.date === date);
        if (!log) return 0;
        const exerciseCalories = log.exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
        const stepCalories = Math.round(log.steps * 0.04);
        return exerciseCalories + stepCalories;
      },

      getNetCalories: (date) => {
        const consumed = get().getDailyTotals(date).calories;
        const burned = get().getDailyCaloriesBurned(date);
        return consumed - burned;
      },

      // Water tracking actions
      addWaterEntry: (entry) =>
        set((state) => {
          const existingLog = state.waterLogs.find((l) => l.date === entry.date);
          if (existingLog) {
            return {
              waterLogs: state.waterLogs.map((l) =>
                l.date === entry.date
                  ? { ...l, entries: [...l.entries, entry] }
                  : l
              ),
            };
          }
          return {
            waterLogs: [...state.waterLogs, { date: entry.date, entries: [entry] }],
          };
        }),

      removeWaterEntry: (date, entryId) =>
        set((state) => ({
          waterLogs: state.waterLogs.map((l) =>
            l.date === date
              ? { ...l, entries: l.entries.filter((e) => e.id !== entryId) }
              : l
          ),
        })),

      getDailyWaterLog: (date) => get().waterLogs.find((l) => l.date === date),

      getDailyWaterTotal: (date) => {
        const log = get().waterLogs.find((l) => l.date === date);
        if (!log) return 0;
        return log.entries.reduce((sum, e) => sum + e.amount, 0);
      },

      // Fitness Sync Actions
      setFitnessConnection: (provider, connection) =>
        set((state) => ({
          fitnessConnections: {
            ...state.fitnessConnections,
            [provider]: connection,
          },
        })),

      clearFitnessConnection: (provider) =>
        set((state) => ({
          fitnessConnections: {
            ...state.fitnessConnections,
            [provider]: null,
          },
        })),

      setSyncedFitnessData: (data) => set({ syncedFitnessData: data }),

      updateFitnessSyncPreferences: (prefs) =>
        set((state) => ({
          fitnessSyncPreferences: {
            ...state.fitnessSyncPreferences,
            ...prefs,
          },
        })),

      setFitnessSyncing: (syncing) => set({ isFitnessSyncing: syncing }),

      setFitnessSyncError: (error) => set({ fitnessSyncError: error }),

      setLastFitnessSyncAt: (timestamp) => set({ lastFitnessSyncAt: timestamp }),

      getConnectedFitnessProviders: () => {
        const state = get();
        return (Object.entries(state.fitnessConnections) as [FitnessProvider, FitnessConnection | null][])
          .filter(([_, conn]) => conn?.isConnected)
          .map(([provider]) => provider);
      },

      isFitnessProviderConnected: (provider) => {
        const state = get();
        return state.fitnessConnections[provider]?.isConnected ?? false;
      },

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "nutriscan-storage",
    }
  )
);
