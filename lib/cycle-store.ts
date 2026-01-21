"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types for cycle tracking
export type FlowIntensity = "none" | "spotting" | "light" | "medium" | "heavy";

export type CycleMood = 
  | "happy" | "calm" | "energetic" | "neutral" 
  | "anxious" | "irritable" | "sad" | "sensitive";

export type CycleSymptom =
  | "cramps" | "headache" | "bloating" | "fatigue" | "mood_swings"
  | "breast_tenderness" | "acne" | "cravings" | "back_pain" | "nausea";

export type CyclePhase = 
  | "menstrual"    // Days 1-5 (period)
  | "follicular"   // Days 6-13 (pre-ovulation)
  | "ovulation"    // Days 14-16 (fertile window)
  | "luteal";      // Days 17-28 (post-ovulation/PMS)

export interface CycleEntry {
  date: string; // YYYY-MM-DD
  flow: FlowIntensity;
  moods: CycleMood[];
  symptoms: CycleSymptom[];
  notes: string;
  temperature?: number; // BBT in Celsius
}

export interface CycleRecord {
  id: string;
  startDate: string;
  endDate?: string; // null if current cycle
  periodEndDate?: string; // when period ended within cycle
}

export interface CycleSettings {
  enabled: boolean;
  showOnHomePage: boolean;
  averageCycleLength: number;
  averagePeriodLength: number;
  reminderDaysBefore: number;
  pinLock: boolean;
  pin?: string;
}

interface CycleStore {
  // Settings
  settings: CycleSettings;
  updateSettings: (settings: Partial<CycleSettings>) => void;
  
  // Entries (daily logs)
  entries: Record<string, CycleEntry>;
  logEntry: (date: string, entry: Partial<CycleEntry>) => void;
  getEntry: (date: string) => CycleEntry | undefined;
  
  // Cycles (period records)
  cycles: CycleRecord[];
  startPeriod: (date: string) => void;
  endPeriod: (date: string) => void;
  
  // Calculations
  getCurrentCycleDay: () => number | null;
  getCurrentPhase: () => CyclePhase | null;
  getNextPeriodDate: () => string | null;
  getCycleHistory: () => { avgLength: number; avgPeriod: number; cycles: CycleRecord[] };
  
  // Phase colors for UI
  getPhaseColor: (phase: CyclePhase | null) => string;
  getPhaseLabel: (phase: CyclePhase | null) => string;
  
  // Reset
  resetCycleData: () => void;
}

const defaultSettings: CycleSettings = {
  enabled: false,
  showOnHomePage: false,
  averageCycleLength: 28,
  averagePeriodLength: 5,
  reminderDaysBefore: 3,
  pinLock: false,
};

const defaultEntry: CycleEntry = {
  date: "",
  flow: "none",
  moods: [],
  symptoms: [],
  notes: "",
};

// Helper to calculate days between dates
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to add days to a date
function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Helper to get today's date
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export const useCycleStore = create<CycleStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      entries: {},
      cycles: [],
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      logEntry: (date, entry) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...defaultEntry,
              ...state.entries[date],
              ...entry,
              date,
            },
          },
        })),
      
      getEntry: (date) => get().entries[date],
      
      startPeriod: (date) =>
        set((state) => {
          // End any current cycle
          const updatedCycles = state.cycles.map((cycle) =>
            !cycle.endDate ? { ...cycle, endDate: addDays(date, -1) } : cycle
          );
          
          // Start new cycle
          const newCycle: CycleRecord = {
            id: `cycle_${Date.now()}`,
            startDate: date,
          };
          
          return {
            cycles: [...updatedCycles, newCycle],
            entries: {
              ...state.entries,
              [date]: {
                ...defaultEntry,
                ...state.entries[date],
                date,
                flow: state.entries[date]?.flow || "medium",
              },
            },
          };
        }),
      
      endPeriod: (date) =>
        set((state) => {
          const updatedCycles = state.cycles.map((cycle) =>
            !cycle.periodEndDate && !cycle.endDate
              ? { ...cycle, periodEndDate: date }
              : cycle
          );
          return { cycles: updatedCycles };
        }),
      
      getCurrentCycleDay: () => {
        const { cycles } = get();
        if (cycles.length === 0) return null;
        
        const currentCycle = cycles.find((c) => !c.endDate);
        if (!currentCycle) return null;
        
        const today = getToday();
        return daysBetween(currentCycle.startDate, today) + 1;
      },
      
      getCurrentPhase: () => {
        const cycleDay = get().getCurrentCycleDay();
        const { settings } = get();
        
        if (cycleDay === null) return null;
        
        // Determine phase based on cycle day
        if (cycleDay <= settings.averagePeriodLength) {
          return "menstrual";
        } else if (cycleDay <= 13) {
          return "follicular";
        } else if (cycleDay <= 16) {
          return "ovulation";
        } else {
          return "luteal";
        }
      },
      
      getNextPeriodDate: () => {
        const { cycles, settings } = get();
        if (cycles.length === 0) return null;
        
        const currentCycle = cycles.find((c) => !c.endDate);
        if (!currentCycle) return null;
        
        return addDays(currentCycle.startDate, settings.averageCycleLength);
      },
      
      getCycleHistory: () => {
        const { cycles } = get();
        const completedCycles = cycles.filter((c) => c.endDate);
        
        if (completedCycles.length === 0) {
          return { avgLength: 28, avgPeriod: 5, cycles };
        }
        
        const lengths = completedCycles.map((c) =>
          daysBetween(c.startDate, c.endDate!)
        );
        const periodLengths = completedCycles
          .filter((c) => c.periodEndDate)
          .map((c) => daysBetween(c.startDate, c.periodEndDate!));
        
        const avgLength = Math.round(
          lengths.reduce((a, b) => a + b, 0) / lengths.length
        );
        const avgPeriod = periodLengths.length > 0
          ? Math.round(
              periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
            )
          : 5;
        
        return { avgLength, avgPeriod, cycles };
      },
      
      getPhaseColor: (phase) => {
        switch (phase) {
          case "menstrual":
            return "#F87171"; // Soft coral/red
          case "follicular":
            return "#A78BFA"; // Soft purple
          case "ovulation":
            return "#34D399"; // Teal/green (fertile)
          case "luteal":
            return "#FBBF24"; // Amber (PMS)
          default:
            return "#E5E7EB"; // Gray
        }
      },
      
      getPhaseLabel: (phase) => {
        switch (phase) {
          case "menstrual":
            return "Period";
          case "follicular":
            return "Follicular";
          case "ovulation":
            return "Fertile Window";
          case "luteal":
            return "Luteal";
          default:
            return "Not tracking";
        }
      },
      
      resetCycleData: () =>
        set({
          settings: defaultSettings,
          entries: {},
          cycles: [],
        }),
    }),
    {
      name: "fitfork-cycle-storage",
    }
  )
);
