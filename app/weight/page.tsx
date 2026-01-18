"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore, getTodayString } from "@/lib/store";
import {
  PageWrapper,
  Card3D,
  Button3D,
  StatCard,
  SectionHeader,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

export default function WeightPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  const { weightHistory, addWeightEntry } = useAppStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const sortedEntries = [...weightHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestWeight = sortedEntries[0]?.weight || 0;
  const previousWeight = sortedEntries[1]?.weight || latestWeight;
  const weightChange = latestWeight - previousWeight;
  const startWeight = sortedEntries[sortedEntries.length - 1]?.weight || latestWeight;
  const totalChange = latestWeight - startWeight;

  const handleAddWeight = () => {
    if (!newWeight) return;
    
    hapticSuccess();
    const weightValue = parseFloat(newWeight);
    const weightInKg = unit === "lbs" ? weightValue * 0.453592 : weightValue;
    
    addWeightEntry({
      id: Date.now().toString(),
      date: getTodayString(),
      weight: weightInKg,
    });
    
    setShowAddWeight(false);
    setNewWeight("");
  };

  const formatWeight = (weight: number) => {
    if (unit === "lbs") {
      return `${(weight * 2.20462).toFixed(1)} lbs`;
    }
    return `${weight.toFixed(1)} kg`;
  };

  const getChangeColor = (change: number) => {
    if (change < 0) return "text-green-400";
    if (change > 0) return "text-red-400";
    return "text-gray-400";
  };

  const getChangeIcon = (change: number) => {
    if (change < 0) return "↓";
    if (change > 0) return "↑";
    return "→";
  };

  // Generate chart data (last 7 entries)
  const chartData = sortedEntries.slice(0, 7).reverse();
  const maxWeight = Math.max(...chartData.map(e => e.weight), 1);
  const minWeight = Math.min(...chartData.map(e => e.weight), 0);
  const range = maxWeight - minWeight || 1;

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            ⚖️ Weight Tracker
          </h1>
          <p className="text-gray-400 mt-1">Monitor your progress</p>
        </motion.div>

        {/* Current Weight Card */}
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="luxury" glowColor="rgba(168, 85, 247, 0.3)">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Current Weight</p>
              <motion.p
                className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                {latestWeight > 0 ? formatWeight(latestWeight) : "--"}
              </motion.p>
              
              {weightChange !== 0 && (
                <motion.div
                  className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full ${weightChange < 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className={getChangeColor(weightChange)}>
                    {getChangeIcon(weightChange)} {Math.abs(weightChange).toFixed(1)} kg
                  </span>
                  <span className="text-gray-500 text-sm">from last</span>
                </motion.div>
              )}

              {/* Unit Toggle */}
              <div className="flex justify-center gap-2 mt-4">
                <motion.button
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    unit === "kg" ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                  onClick={() => { hapticLight(); setUnit("kg"); }}
                  whileTap={{ scale: 0.95 }}
                >
                  kg
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    unit === "lbs" ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                  onClick={() => { hapticLight(); setUnit("lbs"); }}
                  whileTap={{ scale: 0.95 }}
                >
                  lbs
                </motion.button>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon="📊"
            label="Total Change"
            value={`${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}`}
            subValue="kg"
            color={totalChange <= 0 ? "green" : "orange"}
          />
          <StatCard
            icon="📈"
            label="Entries"
            value={weightHistory.length}
            color="purple"
          />
        </div>

        {/* Mini Chart */}
        {chartData.length > 1 && (
          <>
            <SectionHeader title="Trend" icon="📉" />
            <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
              <Card3D variant="glass">
                <div className="h-32 flex items-end justify-between gap-1">
                  {chartData.map((entry, index) => {
                    const height = ((entry.weight - minWeight) / range) * 100;
                    return (
                      <motion.div
                        key={entry.id}
                        className="flex-1 flex flex-col items-center gap-1"
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg"
                          style={{ height: `${Math.max(height, 10)}%` }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: index * 0.1, type: "spring" }}
                        />
                        <span className="text-[10px] text-gray-500">
                          {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card3D>
            </motion.div>
          </>
        )}

        {/* Recent Entries */}
        <SectionHeader
          title="History"
          icon="📜"
          action={
            <Button3D
              variant="primary"
              size="sm"
              icon="+"
              onClick={() => { hapticMedium(); setShowAddWeight(true); }}
            >
              Log
            </Button3D>
          }
        />

        {sortedEntries.length === 0 ? (
          <Card3D variant="glass">
            <div className="text-center py-8">
              <span className="text-5xl mb-4 block">⚖️</span>
              <p className="text-gray-400">No weight entries yet</p>
              <p className="text-gray-500 text-sm mt-1">Tap + to log your first weight</p>
            </div>
          </Card3D>
        ) : (
          <div className="space-y-2">
            {sortedEntries.slice(0, 10).map((entry, index) => {
              const prevEntry = sortedEntries[index + 1];
              const change = prevEntry ? entry.weight - prevEntry.weight : 0;
              
              return (
                <motion.div
                  key={entry.id}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.05 }}
                >
                  <Card3D variant="glass" intensity="subtle">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{formatWeight(entry.weight)}</p>
                        <p className="text-gray-500 text-sm">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {change !== 0 && (
                        <span className={`text-sm ${getChangeColor(change)}`}>
                          {getChangeIcon(change)} {Math.abs(change).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Weight Modal */}
      <AnimatePresence>
        {showAddWeight && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddWeight(false)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 text-center">⚖️ Log Weight</h2>
              
              <div className="mb-4">
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder={unit === "kg" ? "70.5" : "155.0"}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center text-2xl placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <p className="text-center text-gray-500 mt-2">{unit}</p>
              </div>
              
              <div className="flex gap-3">
                <Button3D
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowAddWeight(false)}
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  fullWidth
                  disabled={!newWeight}
                  onClick={handleAddWeight}
                >
                  Save
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavV2 />
    </PageWrapper>
  );
}
