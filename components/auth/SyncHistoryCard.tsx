'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Utensils,
  Scale,
  Target,
  BookOpen,
  User,
  Clock,
  Trash2
} from 'lucide-react';
import { 
  getSyncHistory, 
  SyncRecord, 
  formatRelativeTime,
  clearSyncHistory 
} from '@/lib/syncStatus';

export default function SyncHistoryCard() {
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setHistory(getSyncHistory());
  }, []);

  const handleClearHistory = () => {
    if (confirm('Clear sync history? This only clears the log, not your synced data.')) {
      clearSyncHistory();
      setHistory([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'partial':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTotalItems = (record: SyncRecord) => {
    const d = record.details;
    return (
      d.foodDiary.uploaded + d.foodDiary.downloaded +
      d.weightEntries.uploaded + d.weightEntries.downloaded +
      d.goals.uploaded + d.goals.downloaded +
      d.recipes.uploaded + d.recipes.downloaded +
      (d.profile.synced ? 1 : 0)
    );
  };

  const displayHistory = showAll ? history : history.slice(0, 5);

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <History className="w-5 h-5 text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sync History</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
          No sync history yet. Your sync activity will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sync History</h2>
            <p className="text-xs text-gray-500">{history.length} sync{history.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sync Records */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayHistory.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
            >
              {/* Record Header */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === record.id ? false : record.id)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(record.status)}
                  <div>
                    <p className={`font-medium text-sm ${getStatusColor(record.status)}`}>
                      {record.status === 'success' ? 'Sync Complete' : 
                       record.status === 'failed' ? 'Sync Failed' : 'Partial Sync'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(record.timestamp)} • {getTotalItems(record)} items
                    </p>
                  </div>
                </div>
                {expanded === record.id ? 
                  <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expanded === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                      {/* Food Diary */}
                      {(record.details.foodDiary.uploaded > 0 || record.details.foodDiary.downloaded > 0) && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Utensils className="w-4 h-4" />
                            <span>Food Diary</span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">
                            ↑{record.details.foodDiary.uploaded} ↓{record.details.foodDiary.downloaded}
                          </span>
                        </div>
                      )}

                      {/* Weight Entries */}
                      {(record.details.weightEntries.uploaded > 0 || record.details.weightEntries.downloaded > 0) && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Scale className="w-4 h-4" />
                            <span>Weight Entries</span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">
                            ↑{record.details.weightEntries.uploaded} ↓{record.details.weightEntries.downloaded}
                          </span>
                        </div>
                      )}

                      {/* Goals */}
                      {(record.details.goals.uploaded > 0 || record.details.goals.downloaded > 0) && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Target className="w-4 h-4" />
                            <span>Goals</span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">
                            ↑{record.details.goals.uploaded} ↓{record.details.goals.downloaded}
                          </span>
                        </div>
                      )}

                      {/* Recipes */}
                      {(record.details.recipes.uploaded > 0 || record.details.recipes.downloaded > 0) && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <BookOpen className="w-4 h-4" />
                            <span>Recipes</span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">
                            ↑{record.details.recipes.uploaded} ↓{record.details.recipes.downloaded}
                          </span>
                        </div>
                      )}

                      {/* Profile */}
                      {record.details.profile.synced && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </div>
                          <span className="text-green-600 dark:text-green-400">✓ Synced</span>
                        </div>
                      )}

                      {/* Duration */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                        <span>Duration</span>
                        <span>{(record.duration / 1000).toFixed(1)}s</span>
                      </div>

                      {/* Error message if any */}
                      {record.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                          <p className="text-xs text-red-600 dark:text-red-400">{record.error}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More/Less */}
      {history.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          {showAll ? 'Show Less' : `Show All (${history.length})`}
        </button>
      )}
    </motion.div>
  );
}
