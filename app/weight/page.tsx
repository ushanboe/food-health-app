"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Scale, TrendingDown, TrendingUp, Minus, Target, Trash2 } from "lucide-react";
import { useAppStore, getTodayString, WeightEntry } from "@/lib/store";

export default function WeightPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { weightHistory, userStats, addWeightEntry, removeWeightEntry } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState(userStats.currentWeight.toString());
  const [newNote, setNewNote] = useState("");

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" /></div>;

  const today = getTodayString();
  const sortedHistory = [...weightHistory].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedHistory[0]?.weight || userStats.currentWeight;
  const startWeight = sortedHistory[sortedHistory.length - 1]?.weight || latestWeight;
  const weightChange = latestWeight - startWeight;
  const toGoal = latestWeight - userStats.targetWeight;

  // Chart data - last 30 days
  const last30 = sortedHistory.slice(0, 30).reverse();
  const minW = Math.min(...last30.map(w => w.weight), userStats.targetWeight) - 2;
  const maxW = Math.max(...last30.map(w => w.weight), userStats.targetWeight) + 2;
  const range = maxW - minW || 1;

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 20 || weight > 300) return;
    addWeightEntry({
      id: `weight-${Date.now()}`,
      date: today,
      weight,
      note: newNote || undefined,
    });
    setShowAddModal(false);
    setNewNote("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-5 pt-12 pb-6 safe-top">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Weight Tracker</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <Scale className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{latestWeight}</p>
            <p className="text-xs opacity-80">Current (kg)</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            {weightChange <= 0 ? <TrendingDown className="w-5 h-5 mx-auto mb-1 opacity-80" /> : <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-80" />}
            <p className="text-2xl font-bold">{weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}</p>
            <p className="text-xs opacity-80">Change (kg)</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{Math.abs(toGoal).toFixed(1)}</p>
            <p className="text-xs opacity-80">{toGoal > 0 ? "To lose" : toGoal < 0 ? "To gain" : "At goal!"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Progress Chart</h3>
          {last30.length > 1 ? (
            <div className="relative h-40">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>{maxW.toFixed(0)}</span>
                <span>{((maxW + minW) / 2).toFixed(0)}</span>
                <span>{minW.toFixed(0)}</span>
              </div>
              {/* Chart area */}
              <div className="ml-10 h-full relative">
                {/* Target line */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-green-400"
                  style={{ top: `${((maxW - userStats.targetWeight) / range) * 100}%` }}
                >
                  <span className="absolute right-0 -top-3 text-xs text-green-500">Goal</span>
                </div>
                {/* Line chart */}
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points={last30.map((w, i) => {
                      const x = (i / (last30.length - 1)) * 100;
                      const y = ((maxW - w.weight) / range) * 100;
                      return `${x}%,${y}%`;
                    }).join(" ")}
                  />
                  {last30.map((w, i) => {
                    const x = (i / (last30.length - 1)) * 100;
                    const y = ((maxW - w.weight) / range) * 100;
                    return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="4" fill="#3b82f6" />;
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">
              <p>Add more entries to see your progress chart</p>
            </div>
          )}
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">History</h3>
          {sortedHistory.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedHistory.map((entry, i) => {
                const prev = sortedHistory[i + 1];
                const diff = prev ? entry.weight - prev.weight : 0;
                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{entry.weight} kg</p>
                      <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                      {entry.note && <p className="text-xs text-gray-400 mt-1">{entry.note}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {diff !== 0 && (
                        <span className={`text-sm font-medium ${diff < 0 ? "text-green-500" : "text-red-500"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      )}
                      <button onClick={() => removeWeightEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No weight entries yet</p>
          )}
        </motion.div>
      </div>

      {/* Add Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Log Weight</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-2xl font-bold text-center"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g., After workout"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">
                  Cancel
                </button>
                <button onClick={handleAddWeight} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
