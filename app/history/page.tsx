"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Calendar, ChevronRight, Barcode, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";

export default function HistoryPage() {
  const router = useRouter();
  const { analysisHistory, clearHistory, setCurrentAnalysis } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = analysisHistory?.filter((item) =>
    item.foodName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleItemClick = (item: typeof filteredHistory[0]) => {
    setCurrentAnalysis(item);
    router.push("/details");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all scan history?")) {
      clearHistory();
    }
  };

  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, typeof filteredHistory>);

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-gray-50">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="px-5 py-6 safe-top">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Scan History</h1>
            </div>
            {filteredHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-6"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </motion.div>

          {/* History List */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items], groupIndex) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + groupIndex * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">{date}</span>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.imageData ? (
                              <img
                                src={item.imageData}
                                alt={item.foodName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Barcode className="w-6 h-6 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate">
                              {item.foodName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {item.calories} cal
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {item.category}
                              </span>
                              {item.source === "barcode" && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-green-600 flex items-center gap-0.5">
                                    <Barcode className="w-3 h-3" />
                                    Verified
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                                item.healthScore >= 60
                                  ? "bg-green-100 text-green-700"
                                  : item.healthScore >= 40
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.healthScore}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">
                {searchQuery ? "No results found" : "No scans yet"}
              </h3>
              <p className="text-gray-500 text-sm text-center">
                {searchQuery
                  ? "Try a different search term"
                  : "Start scanning food to build your history"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Nav */}
      <BottomNav />
    </div>
  );
}
