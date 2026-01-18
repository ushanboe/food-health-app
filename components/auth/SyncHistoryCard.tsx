"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Upload,
  Download,
  Utensils,
  Scale,
  Target,
  BookOpen,
  User,
} from 'lucide-react';
import {
  SyncRecord,
  getSyncHistory,
  clearSyncHistory,
  formatRelativeTime,
} from '@/lib/syncStatus';

export default function SyncHistoryCard() {
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [showAll, setShowAll] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Function to refresh history
  const refreshHistory = useCallback(() => {
    console.log('[DEBUG SyncHistoryCard] refreshHistory called');
    const data = getSyncHistory();
    console.log('[DEBUG SyncHistoryCard] Got history, length:', data.length);
    setHistory(data);
    setDebugInfo(`Last refresh: ${new Date().toLocaleTimeString()}, Records: ${data.length}`);
  }, []);

  useEffect(() => {
    console.log('[DEBUG SyncHistoryCard] Component mounted');
    
    // Load initial history
    refreshHistory();

    // Listen for storage changes (when sync saves new record)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('[DEBUG SyncHistoryCard] Storage event:', e.key);
      if (e.key === 'fitfork_sync_history') {
        console.log('[DEBUG SyncHistoryCard] Sync history changed in storage');
        refreshHistory();
      }
    };

    // Listen for custom sync event (for same-tab updates)
    const handleSyncComplete = () => {
      console.log('[DEBUG SyncHistoryCard] fitfork-sync-complete event received!');
      refreshHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fitfork-sync-complete', handleSyncComplete);

    // Also poll every 2 seconds while on this page (backup)
    const interval = setInterval(() => {
      console.log('[DEBUG SyncHistoryCard] Polling refresh');
      refreshHistory();
    }, 2000);

    return () => {
      console.log('[DEBUG SyncHistoryCard] Component unmounting');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fitfork-sync-complete', handleSyncComplete);
      clearInterval(interval);
    };
  }, [refreshHistory]);

  const handleClearHistory = () => {
    if (confirm('Clear sync history? This only clears the log, not your synced data.')) {
      clearSyncHistory();
      setHistory([]);
    }
  };

  const getStatusIcon = (status: SyncRecord['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: SyncRecord['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'partial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foodDiary':
        return <Utensils className="w-3 h-3" />;
      case 'weightEntries':
        return <Scale className="w-3 h-3" />;
      case 'goals':
        return <Target className="w-3 h-3" />;
      case 'recipes':
        return <BookOpen className="w-3 h-3" />;
      case 'profile':
        return <User className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'foodDiary':
        return 'Food Diary';
      case 'weightEntries':
        return 'Weight';
      case 'goals':
        return 'Goals';
      case 'recipes':
        return 'Recipes';
      case 'profile':
        return 'Profile';
      default:
        return category;
    }
  };

  // Always show the card - with debug info
  console.log('[DEBUG SyncHistoryCard] Rendering, history length:', history.length);

  // Show empty state
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
        <div className="text-center py-6">
          <RefreshCw className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No sync history yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Click "Sync Now" above to sync your data!
          </p>
        </div>
        {/* Debug info */}
        <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
          <strong>🐛 Debug:</strong> {debugInfo || 'Loading...'}
          <br />
          <button 
            onClick={refreshHistory}
            className="mt-1 underline"
          >
            Manual Refresh
          </button>
        </div>
      </motion.div>
    );
  }

  const displayHistory = showAll ? history : history.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sync History</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {history.length} sync{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
        <strong>🐛 Debug:</strong> {debugInfo}
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
              className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              {/* Record Header */}
              <button
                onClick={() => setExpanded(expanded === record.id ? false : record.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(record.status)}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {record.duration}ms
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatRelativeTime(record.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Upload className="w-3 h-3 text-green-500" />
                    <span>
                      {Object.values(record.details || {}).reduce(
                        (sum, d) => sum + (typeof d === 'object' && 'uploaded' in d ? d.uploaded : 0),
                        0
                      )}
                    </span>
                    <Download className="w-3 h-3 text-blue-500 ml-2" />
                    <span>
                      {Object.values(record.details || {}).reduce(
                        (sum, d) => sum + (typeof d === 'object' && 'downloaded' in d ? d.downloaded : 0),
                        0
                      )}
                    </span>
                  </div>
                  {expanded === record.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expanded === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                  >
                    <div className="p-3 space-y-2">
                      {Object.entries(record.details).map(([category, data]) => {
                        if (category === 'profile') {
                          return (
                            <div key={category} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                {getCategoryIcon(category)}
                                <span>{getCategoryLabel(category)}</span>
                              </div>
                              <span className={(data as {synced: boolean}).synced ? 'text-green-500' : 'text-gray-400'}>
                                {(data as {synced: boolean}).synced ? '✓ Synced' : '- No changes'}
                              </span>
                            </div>
                          );
                        }
                        const typedData = data as { uploaded: number; downloaded: number };
                        return (
                          <div key={category} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                              {getCategoryIcon(category)}
                              <span>{getCategoryLabel(category)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Upload className="w-3 h-3" /> {typedData.uploaded}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Download className="w-3 h-3" /> {typedData.downloaded}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {record.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Error: {record.error}
                          </p>
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
      {history.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          {showAll ? 'Show Less' : `Show ${history.length - 3} More`}
        </button>
      )}
    </motion.div>
  );
}
