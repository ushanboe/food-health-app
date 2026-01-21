"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCycleStore, FlowIntensity, CycleMood, CycleSymptom, CyclePhase } from "@/lib/cycle-store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Heart,
  Frown,
  Smile,
  Meh,
  Zap,
  Moon,
  Sun,
  CloudRain,
  X,
  Check,
  Plus,
  ArrowLeft,
  Info,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Mood options with emojis
const moodOptions: { id: CycleMood; emoji: string; label: string }[] = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "energetic", emoji: "⚡", label: "Energetic" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "irritable", emoji: "😤", label: "Irritable" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "sensitive", emoji: "🥺", label: "Sensitive" },
];

// Symptom options
const symptomOptions: { id: CycleSymptom; emoji: string; label: string }[] = [
  { id: "cramps", emoji: "🤕", label: "Cramps" },
  { id: "headache", emoji: "🤯", label: "Headache" },
  { id: "bloating", emoji: "🎈", label: "Bloating" },
  { id: "fatigue", emoji: "😴", label: "Fatigue" },
  { id: "mood_swings", emoji: "🎭", label: "Mood Swings" },
  { id: "breast_tenderness", emoji: "💔", label: "Breast Pain" },
  { id: "acne", emoji: "😣", label: "Acne" },
  { id: "cravings", emoji: "🍫", label: "Cravings" },
  { id: "back_pain", emoji: "🔙", label: "Back Pain" },
  { id: "nausea", emoji: "🤢", label: "Nausea" },
];

// Flow intensity options
const flowOptions: { id: FlowIntensity; label: string; color: string; dots: number }[] = [
  { id: "none", label: "None", color: "bg-gray-200", dots: 0 },
  { id: "spotting", label: "Spotting", color: "bg-pink-200", dots: 1 },
  { id: "light", label: "Light", color: "bg-pink-300", dots: 2 },
  { id: "medium", label: "Medium", color: "bg-pink-400", dots: 3 },
  { id: "heavy", label: "Heavy", color: "bg-pink-500", dots: 4 },
];

// Helper functions
function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CyclePage() {
  const router = useRouter();
  const {
    settings,
    entries,
    cycles,
    logEntry,
    getEntry,
    startPeriod,
    endPeriod,
    getCurrentCycleDay,
    getCurrentPhase,
    getNextPeriodDate,
    getPhaseColor,
    getPhaseLabel,
    getCycleHistory,
  } = useCycleStore();

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(new Date()));
  const [showLogModal, setShowLogModal] = useState(false);

  // Current cycle info
  const cycleDay = getCurrentCycleDay();
  const currentPhase = getCurrentPhase();
  const nextPeriod = getNextPeriodDate();
  const { avgLength, avgPeriod } = getCycleHistory();

  // Calendar data
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({ date: formatDateKey(date), day, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date: formatDateKey(date), day, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date: formatDateKey(date), day, isCurrentMonth: false });
    }
    
    return days;
  }, [year, month, daysInMonth, firstDay]);

  // Get day color based on cycle data
  const getDayColor = (dateStr: string): string => {
    const entry = entries[dateStr];
    if (entry && entry.flow !== "none") {
      return "bg-pink-400 text-white"; // Period day
    }
    
    // Check if it's in predicted fertile window or period
    const currentCycle = cycles.find((c) => !c.endDate);
    if (currentCycle) {
      const cycleStart = new Date(currentCycle.startDate);
      const targetDate = new Date(dateStr);
      const dayInCycle = Math.floor((targetDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (dayInCycle > 0 && dayInCycle <= settings.averageCycleLength) {
        if (dayInCycle >= 12 && dayInCycle <= 16) {
          return "bg-teal-100 text-teal-700"; // Fertile window
        }
        if (dayInCycle === 14) {
          return "bg-teal-400 text-white"; // Ovulation
        }
      }
    }
    
    return "";
  };

  // Selected date entry
  const selectedEntry = selectedDate ? getEntry(selectedDate) : undefined;

  // Navigation
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(formatDateKey(new Date()));
  };

  // Log entry handlers
  const handleFlowChange = (flow: FlowIntensity) => {
    if (!selectedDate) return;
    
    const currentEntry = getEntry(selectedDate);
    const wasNone = !currentEntry || currentEntry.flow === "none";
    const isNowFlow = flow !== "none";
    
    // If starting period
    if (wasNone && isNowFlow) {
      // Check if this should start a new cycle
      const lastCycle = cycles[cycles.length - 1];
      if (!lastCycle || lastCycle.endDate) {
        startPeriod(selectedDate);
      }
    }
    
    logEntry(selectedDate, { flow });
  };

  const handleMoodToggle = (mood: CycleMood) => {
    if (!selectedDate) return;
    const currentMoods = selectedEntry?.moods || [];
    const newMoods = currentMoods.includes(mood)
      ? currentMoods.filter((m) => m !== mood)
      : [...currentMoods, mood];
    logEntry(selectedDate, { moods: newMoods });
  };

  const handleSymptomToggle = (symptom: CycleSymptom) => {
    if (!selectedDate) return;
    const currentSymptoms = selectedEntry?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter((s) => s !== symptom)
      : [...currentSymptoms, symptom];
    logEntry(selectedDate, { symptoms: newSymptoms });
  };

  const todayStr = formatDateKey(new Date());

  return (
    <PageContainer>
      <PageContent className="pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Cycle Tracking</h1>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
          >
            Today
          </button>
        </div>

        {/* Cycle Status Card */}
        {cycleDay && (
          <motion.div {...fadeUp} className="mb-6">
            <Card
              className="border-2"
              style={{ borderColor: getPhaseColor(currentPhase), backgroundColor: `${getPhaseColor(currentPhase)}10` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getPhaseColor(currentPhase) }}
                >
                  <span className="text-2xl font-bold text-white">{cycleDay}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Cycle Day</p>
                  <p className="text-lg font-semibold" style={{ color: getPhaseColor(currentPhase) }}>
                    {getPhaseLabel(currentPhase)}
                  </p>
                  {nextPeriod && (
                    <p className="text-sm text-gray-500 mt-1">
                      Next period: {new Date(nextPeriod).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Avg Cycle</p>
                  <p className="text-sm font-medium text-gray-700">{avgLength} days</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Calendar */}
        <motion.div {...fadeUp} className="mb-6">
          <Card>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, day, isCurrentMonth }, index) => {
                const isSelected = date === selectedDate;
                const isToday = date === todayStr;
                const dayColor = getDayColor(date);
                const entry = entries[date];
                const hasData = entry && (entry.flow !== "none" || entry.moods.length > 0 || entry.symptoms.length > 0);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                      ${isCurrentMonth ? "text-gray-900" : "text-gray-300"}
                      ${isSelected ? "ring-2 ring-pink-500 ring-offset-1" : ""}
                      ${isToday && !dayColor ? "bg-gray-100 font-bold" : ""}
                      ${dayColor || "hover:bg-gray-50"}
                    `}
                  >
                    <span>{day}</span>
                    {hasData && !dayColor && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-pink-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-pink-400" />
                <span className="text-xs text-gray-500">Period</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-teal-400" />
                <span className="text-xs text-gray-500">Ovulation</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-teal-100" />
                <span className="text-xs text-gray-500">Fertile</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Selected Date Logging */}
        {selectedDate && (
          <motion.div {...fadeUp}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                {selectedDate === todayStr && (
                  <Badge variant="success" size="sm">Today</Badge>
                )}
              </div>

              {/* Flow Intensity */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Droplets size={16} className="text-pink-500" />
                  Flow
                </p>
                <div className="flex gap-2">
                  {flowOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleFlowChange(option.id)}
                      className={`
                        flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all
                        ${selectedEntry?.flow === option.id
                          ? `${option.color} text-white shadow-md scale-105`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Heart size={16} className="text-purple-500" />
                  Mood
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleMoodToggle(mood.id)}
                      className={`
                        flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all
                        ${selectedEntry?.moods?.includes(mood.id)
                          ? "bg-purple-100 text-purple-700 ring-2 ring-purple-300"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }
                      `}
                    >
                      <span className="text-lg mb-1">{mood.emoji}</span>
                      <span className="truncate w-full text-center">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  Symptoms
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {symptomOptions.map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => handleSymptomToggle(symptom.id)}
                      className={`
                        flex flex-col items-center py-2 px-1 rounded-lg text-[10px] transition-all
                        ${selectedEntry?.symptoms?.includes(symptom.id)
                          ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }
                      `}
                    >
                      <span className="text-base mb-1">{symptom.emoji}</span>
                      <span className="truncate w-full text-center leading-tight">{symptom.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* First Time Setup Prompt */}
        {cycles.length === 0 && (
          <motion.div {...fadeUp} className="mt-6">
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Started</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Select a date and mark your period flow to start tracking your cycle. 
                    The app will learn your patterns and provide predictions.
                  </p>
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-sm font-medium text-pink-600 hover:text-pink-700"
                  >
                    Log today's data →
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </PageContent>
      <BottomNav />
    </PageContainer>
  );
}
