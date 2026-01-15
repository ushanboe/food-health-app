import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIProvider } from "./ai-vision";

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
  // Supabase Cloud Sync
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseLastSync?: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

// Phase 2: Weight tracking
export interface WeightEntry {
  id: string;
  date: string;
  weight: number; // in kg
  note?: string;
}

// Phase 2: User body stats for TDEE
export interface UserStats {
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  weightGoal: "lose" | "maintain" | "gain";
}

// Phase 2: Recipe
export interface RecipeIngredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  createdAt: Date;
  thumbnail?: string;
  instructions?: string;
  imageData?: string;
}

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

  // Phase 2
  weightHistory: WeightEntry[];
  userStats: UserStats;
  recipes: Recipe[];

  // Actions
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

  // Phase 2 actions
  addWeightEntry: (entry: WeightEntry) => void;
  removeWeightEntry: (id: string) => void;
  updateUserStats: (stats: Partial<UserStats>) => void;
  calculateTDEE: () => number;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;
}

export const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// TDEE Calculator
const calculateBMR = (stats: UserStats): number => {
  // Mifflin-St Jeor Equation
  if (stats.gender === "male") {
    return 10 * stats.currentWeight + 6.25 * stats.height - 5 * stats.age + 5;
  }
  return 10 * stats.currentWeight + 6.25 * stats.height - 5 * stats.age - 161;
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
      },
      dailyLogs: [],

      // Phase 2 defaults
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

      // Phase 2: Weight tracking
      addWeightEntry: (entry) =>
        set((state) => {
          const filtered = state.weightHistory.filter((w) => w.date !== entry.date);
          const updated = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
          return {
            weightHistory: updated.slice(-90), // Keep 90 days
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
        // Adjust for goal
        if (userStats.weightGoal === "lose") return Math.round(tdee - 500);
        if (userStats.weightGoal === "gain") return Math.round(tdee + 300);
        return Math.round(tdee);
      },

      // Phase 2: Recipes
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
    }),
    {
      name: "nutriscan-storage",
    }
  )
);
