"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock, ChevronRight, Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { HealthScoreBadge } from "@/components/HealthScore";
import { useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const { analysisHistory, clearHistory } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Safe access with fallback to empty array
  const history = analysisHistory || [];

  const filteredHistory = history.filter((scan) =>
    scan.foodName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedHistory = filteredHistory.reduce((groups, scan) => {
    const date = new Date(scan.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scan);
    return groups;
  }, {} as Record<string, typeof history>);

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="safe-top sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">History</h1>
            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-red-500 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search bar */}
          {history.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-24">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No History Yet</h2>
            <p className="text-gray-500 text-center mb-6 max-w-xs">
              Start scanning food items to build your history and track your eating habits.
            </p>
            <button
              onClick={() => router.push("/camera")}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium"
            >
              Scan Your First Food
            </button>
          </motion.div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, scans]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
                <div className="space-y-3">
                  {scans.map((scan, index) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {scan.imageData && (
                          <img
                            src={scan.imageData}
                            alt={scan.foodName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {scan.foodName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {scan.category}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <HealthScoreBadge score={scan.healthScore} />
                          <span className="text-xs text-gray-400">
                            {Math.round(scan.calories)} kcal
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear confirmation modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Clear All History?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                This will permanently delete all your scan history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
