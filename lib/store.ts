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
}

// NEW: Daily Goals
export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// NEW: Meal types
export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

// NEW: Meal entry (food item added to a meal)
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
  sourceAnalysisId?: string; // Link to original FoodAnalysis if from scan
}

// NEW: Daily log (all meals for a specific date)
export interface DailyLog {
  date: string; // YYYY-MM-DD format
  meals: MealEntry[];
}

interface AppState {
  // Current analysis
  currentImage: string | null;
  scannedBarcode: string | null;
  isAnalyzing: boolean;
  currentAnalysis: FoodAnalysis | null;

  // History
  analysisHistory: FoodAnalysis[];

  // User profile
  userProfile: UserProfile;

  // AI Settings
  aiSettings: AISettings;

  // NEW: Daily Goals
  dailyGoals: DailyGoals;

  // NEW: Food Diary (daily logs)
  dailyLogs: DailyLog[];

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

  // NEW: Goal actions
  updateDailyGoals: (goals: Partial<DailyGoals>) => void;

  // NEW: Meal/Diary actions
  addMealEntry: (entry: MealEntry) => void;
  removeMealEntry: (date: string, entryId: string) => void;
  getDailyLog: (date: string) => DailyLog | undefined;
  getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number };
  clearDailyLog: (date: string) => void;
}

// Helper to get today's date string
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
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
      },
      // NEW: Default daily goals
      dailyGoals: {
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 65,
      },
      // NEW: Empty daily logs
      dailyLogs: [],

      // Actions
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
          analysisHistory: state.analysisHistory.filter((item) => item.id !== id),
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

      // NEW: Update daily goals
      updateDailyGoals: (goals) =>
        set((state) => ({
          dailyGoals: { ...state.dailyGoals, ...goals },
        })),

      // NEW: Add meal entry
      addMealEntry: (entry) =>
        set((state) => {
          const date = entry.timestamp instanceof Date 
            ? entry.timestamp.toISOString().split("T")[0]
            : new Date(entry.timestamp).toISOString().split("T")[0];
          const existingLogIndex = state.dailyLogs.findIndex((log) => log.date === date);

          if (existingLogIndex >= 0) {
            // Add to existing day
            const updatedLogs = [...state.dailyLogs];
            updatedLogs[existingLogIndex] = {
              ...updatedLogs[existingLogIndex],
              meals: [...updatedLogs[existingLogIndex].meals, entry],
            };
            return { dailyLogs: updatedLogs };
          } else {
            // Create new day
            return {
              dailyLogs: [...state.dailyLogs, { date, meals: [entry] }],
            };
          }
        }),

      // NEW: Remove meal entry
      removeMealEntry: (date, entryId) =>
        set((state) => ({
          dailyLogs: state.dailyLogs.map((log) =>
            log.date === date
              ? { ...log, meals: log.meals.filter((m) => m.id !== entryId) }
              : log
          ),
        })),

      // NEW: Get daily log
      getDailyLog: (date) => {
        return get().dailyLogs.find((log) => log.date === date);
      },

      // NEW: Get daily totals
      getDailyTotals: (date) => {
        const log = get().dailyLogs.find((l) => l.date === date);
        if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return log.meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      // NEW: Clear daily log
      clearDailyLog: (date) =>
        set((state) => ({
          dailyLogs: state.dailyLogs.filter((log) => log.date !== date),
        })),
    }),
    {
      name: "nutriscan-storage",
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        userProfile: state.userProfile,
        aiSettings: state.aiSettings,
        dailyGoals: state.dailyGoals,
        dailyLogs: state.dailyLogs,
      }),
    }
  )
);
