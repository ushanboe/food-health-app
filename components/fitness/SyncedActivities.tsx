// ============================================================
// Synced Activities Component
// Display activities synced from external fitness providers
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  Clock,
  Flame,
  Footprints,
  Heart,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  AlertCircle,
  Bike,
  Waves,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FitnessProvider, FitnessActivity, AggregatedFitnessData } from '@/lib/fitness-sync/types';
import { useFitnessSync } from '@/lib/fitness-sync/hooks';

const PROVIDER_COLORS: Record<FitnessProvider, string> = {
  google_fit: 'bg-blue-500',
  fitbit: 'bg-teal-500',
  strava: 'bg-orange-500',
  garmin: 'bg-indigo-500',
};

const PROVIDER_NAMES: Record<FitnessProvider, string> = {
  google_fit: 'Google Fit',
  fitbit: 'Fitbit',
  strava: 'Strava',
  garmin: 'Garmin',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  running: <Activity className="w-4 h-4" />,
  walking: <Footprints className="w-4 h-4" />,
  cycling: <Bike className="w-4 h-4" />,
  swimming: <Waves className="w-4 h-4" />,
  workout: <Flame className="w-4 h-4" />,
  default: <Activity className="w-4 h-4" />,
};

interface SyncedActivitiesProps {
  date: string;
  onImportActivity?: (activity: FitnessActivity) => void;
}

export default function SyncedActivities({ date, onImportActivity }: SyncedActivitiesProps) {
  const {
    fitnessConnections,
    syncedFitnessData,
    isFitnessSyncing,
    fitnessSyncError,
    lastFitnessSyncAt,
    getConnectedFitnessProviders,
  } = useAppStore();

  const { syncAllProviders, isLoading } = useFitnessSync();
  const [isExpanded, setIsExpanded] = useState(true);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const connectedProviders = getConnectedFitnessProviders();
  const hasConnections = connectedProviders.length > 0;

  // Filter activities for the selected date
  const todayActivities = syncedFitnessData?.activities.filter(a => {
    const activityDate = new Date(a.startTime).toISOString().split('T')[0];
    return activityDate === date;
  }) || [];

  // Get aggregated data for today
  const todaySteps = syncedFitnessData?.dailySteps?.find(d => d.date === date);
  const todayCalories = syncedFitnessData?.dailyCalories?.find(d => d.date === date);
  const todayHeartRate = syncedFitnessData?.dailyHeartRate?.find(d => d.date === date);

  const handleSync = async () => {
    await syncAllProviders();
  };

  const handleImport = (activity: FitnessActivity) => {
    if (onImportActivity) {
      onImportActivity(activity);
      setImportedIds(prev => new Set([...prev, activity.id]));
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
      if (normalizedType.includes(key)) return icon;
    }
    return ACTIVITY_ICONS.default;
  };

  if (!hasConnections) {
    return null; // Don't show if no providers connected
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Synced Activities</h3>
            <div className="flex items-center gap-2">
              {connectedProviders.map(provider => (
                <span
                  key={provider}
                  className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[provider]}`}
                  title={PROVIDER_NAMES[provider]}
                />
              ))}
              <span className="text-xs text-gray-400">
                {connectedProviders.length} source{connectedProviders.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleSync();
            }}
            disabled={isLoading || isFitnessSyncing}
            className="p-2 bg-white/10 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isFitnessSyncing ? 'animate-spin' : ''}`} />
          </motion.button>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Error Message */}
              {fitnessSyncError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{fitnessSyncError}</p>
                </div>
              )}

              {/* Daily Summary */}
              {(todaySteps || todayCalories || todayHeartRate) && (
                <div className="grid grid-cols-3 gap-2">
                  {todaySteps && (
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <Footprints className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                      <p className="text-lg font-bold">{todaySteps.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Steps</p>
                      <div className="flex justify-center gap-1 mt-1">
                        {todaySteps.sources.map(s => (
                          <span
                            key={s}
                            className={`w-1.5 h-1.5 rounded-full ${PROVIDER_COLORS[s]}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {todayCalories && (
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                      <p className="text-lg font-bold">{Math.round(todayCalories.value)}</p>
                      <p className="text-xs text-gray-400">Burned</p>
                      <div className="flex justify-center gap-1 mt-1">
                        {todayCalories.sources.map(s => (
                          <span
                            key={s}
                            className={`w-1.5 h-1.5 rounded-full ${PROVIDER_COLORS[s]}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {todayHeartRate && (
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <Heart className="w-5 h-5 mx-auto mb-1 text-red-400" />
                      <p className="text-lg font-bold">{Math.round(todayHeartRate.average)}</p>
                      <p className="text-xs text-gray-400">Avg BPM</p>
                      <div className="flex justify-center gap-1 mt-1">
                        {todayHeartRate.sources.map(s => (
                          <span
                            key={s}
                            className={`w-1.5 h-1.5 rounded-full ${PROVIDER_COLORS[s]}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activities List */}
              {todayActivities.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Activities</p>
                  {todayActivities.map((activity) => {
                    const isImported = importedIds.has(activity.id);
                    return (
                      <motion.div
                        key={activity.id}
                        layout
                        className="bg-white/10 rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 ${PROVIDER_COLORS[activity.source]} rounded-lg flex items-center justify-center`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{activity.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(activity.startTime)}
                                </span>
                                <span>{formatDuration(activity.duration)}</span>
                                {activity.calories && (
                                  <span className="flex items-center gap-1">
                                    <Flame className="w-3 h-3" />
                                    {Math.round(activity.calories)}
                                  </span>
                                )}
                              </div>
                              {activity.distance && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {(activity.distance / 1000).toFixed(2)} km
                                </p>
                              )}
                            </div>
                          </div>

                          {onImportActivity && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleImport(activity)}
                              disabled={isImported}
                              className={`p-2 rounded-lg ${
                                isImported
                                  ? 'bg-green-500/30 text-green-400'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {isImported ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No activities synced for this date</p>
                  <button
                    onClick={handleSync}
                    className="text-purple-400 text-sm mt-2 underline"
                  >
                    Sync now
                  </button>
                </div>
              )}

              {/* Last Sync Info */}
              {lastFitnessSyncAt && (
                <p className="text-xs text-gray-500 text-center">
                  Last synced: {new Date(lastFitnessSyncAt).toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
