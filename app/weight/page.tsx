"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  Scale,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function WeightPage() {
  const router = useRouter();
  const { weightHistory, addWeightEntry, userStats } = useAppStore();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const sortedEntries = [...(weightHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const currentWeight = sortedEntries[0]?.weight || 0;
  const previousWeight = sortedEntries[1]?.weight || currentWeight;
  const weightChange = currentWeight - previousWeight;
  const targetWeight = userStats.targetWeight || 70;
  const toGoal = currentWeight - targetWeight;

  const handleAddWeight = () => {
    if (newWeight) {
      addWeightEntry({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        weight: parseFloat(newWeight),
      });
      setNewWeight("");
      setShowAddSheet(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <PageContainer>
      <Header variant="green" showLogo
        title="Weight Tracking"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddSheet(true)}
          >
            <Plus size={20} className="text-emerald-600" />
          </Button>
        }
      />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Current Weight Card */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Scale size={32} className="text-emerald-600" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Current Weight</p>
                <p className="text-4xl font-bold text-gray-900">
                  {currentWeight > 0 ? currentWeight.toFixed(1) : "--"}
                  <span className="text-lg font-normal text-gray-400 ml-1">kg</span>
                </p>
                {weightChange !== 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {weightChange < 0 ? (
                      <TrendingDown size={16} className="text-emerald-500" />
                    ) : (
                      <TrendingUp size={16} className="text-red-500" />
                    )}
                    <span className={weightChange < 0 ? "text-emerald-600" : "text-red-600"}>
                      {Math.abs(weightChange).toFixed(1)} kg
                    </span>
                    <span className="text-gray-400">from last entry</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-6">
            <Card className="text-center py-4">
              <Target size={20} className="mx-auto mb-2 text-blue-500" />
              <p className="text-lg font-bold text-gray-900">{targetWeight} kg</p>
              <p className="text-xs text-gray-500">Target</p>
            </Card>
            <Card className="text-center py-4">
              {toGoal > 0 ? (
                <TrendingDown size={20} className="mx-auto mb-2 text-emerald-500" />
              ) : toGoal < 0 ? (
                <TrendingUp size={20} className="mx-auto mb-2 text-amber-500" />
              ) : (
                <Minus size={20} className="mx-auto mb-2 text-gray-400" />
              )}
              <p className="text-lg font-bold text-gray-900">
                {Math.abs(toGoal).toFixed(1)} kg
              </p>
              <p className="text-xs text-gray-500">
                {toGoal > 0 ? "To lose" : toGoal < 0 ? "To gain" : "At goal!"}
              </p>
            </Card>
          </motion.div>

          {/* Weight History */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">History</p>
              <span className="text-xs text-gray-400">{sortedEntries.length} entries</span>
            </div>

            {sortedEntries.length === 0 ? (
              <EmptyState
                icon={<Scale size={32} />}
                title="No weight entries"
                description="Start tracking your weight to see your progress"
                action={{
                  label: "Add Weight",
                  onClick: () => setShowAddSheet(true),
                }}
              />
            ) : (
              <div className="space-y-2">
                {sortedEntries.slice(0, 10).map((entry, index) => {
                  const prevEntry = sortedEntries[index + 1];
                  const change = prevEntry ? entry.weight - prevEntry.weight : 0;

                  return (
                    <Card key={entry.id || entry.date} padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Calendar size={18} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {entry.weight.toFixed(1)} kg
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(entry.date)}
                            </p>
                          </div>
                        </div>
                        {change !== 0 && (
                          <Badge variant={change < 0 ? "success" : "error"}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Add Weight Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Log Weight"
      >
        <div className="space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            placeholder="Enter your weight"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            icon={<Scale size={20} />}
          />
          <Button fullWidth onClick={handleAddWeight} disabled={!newWeight}>
            Save Weight
          </Button>
        </div>
      </BottomSheet>

      {/* Floating Add Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg flex items-center justify-center text-white"
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddSheet(true)}
      >
        <Plus size={28} />
      </motion.button>

      <BottomNav />
    </PageContainer>
  );
}
