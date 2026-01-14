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

interface AppState {
  // Current analysis
  currentImage: string | null;
  isAnalyzing: boolean;
  currentAnalysis: FoodAnalysis | null;

  // History
  analysisHistory: FoodAnalysis[];

  // User profile
  userProfile: UserProfile;

  // AI Settings
  aiSettings: AISettings;

  // Actions
  setCurrentImage: (image: string | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setCurrentAnalysis: (analysis: FoodAnalysis | null) => void;
  addToHistory: (analysis: FoodAnalysis) => void;
  clearHistory: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentImage: null,
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
        provider: "demo", // Default to demo until user sets up API key
        geminiApiKey: "",
        openaiApiKey: "",
      },

      // Actions
      setCurrentImage: (image) => set({ currentImage: image }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      addToHistory: (analysis) =>
        set((state) => ({
          analysisHistory: [analysis, ...state.analysisHistory].slice(0, 50),
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
    }),
    {
      name: "nutriscan-storage",
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        userProfile: state.userProfile,
        aiSettings: state.aiSettings,
      }),
    }
  )
);
