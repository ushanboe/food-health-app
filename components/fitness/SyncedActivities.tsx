// ============================================================
// Synced Activities Component
// Display activities synced from external fitness providers
// Shows last 7 days of activities with detail view
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
  Calendar,
  Link as LinkIcon,
  Settings,
  X,
  TrendingUp,
  Mountain,
  Gauge,
  Timer,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { FitnessProvider, FitnessActivity } from '@/lib/fitness-sync/types';
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

// Emoji icons matching the exercise types in store
const ACTIVITY_EMOJI_ICONS: Record<string, string> = {
  walking: '🚶',
  walk: '🚶',
  running: '🏃',
  run: '🏃',
  cycling: '🚴',
  ride: '🚴',
  bike: '🚴',
  swimming: '🏊',
  swim: '🏊',
  hiking: '🥾',
  hike: '🥾',
  yoga: '🧘',
  pilates: '🤸',
  weight: '🏋️',
  strength: '💪',
  crossfit: '🔥',
  rowing: '🚣',
  elliptical: '🔄',
  stair: '🪜',
  basketball: '🏀',
  soccer: '⚽',
  football: '⚽',
  tennis: '🎾',
  badminton: '🏸',
  golf: '⛳',
  dancing: '💃',
  dance: '💃',
  martial: '🥋',
  workout: '💪',
  exercise: '🏃',
  default: '🏃',
};

interface SyncedActivitiesProps {
  date: string;
  onImportActivity?: (activity: FitnessActivity) => void;
}

export default function SyncedActivities({ date, onImportActivity }: SyncedActivitiesProps) {
  const {
    syncedFitnessData,
    isFitnessSyncing,
    fitnessSyncError,
    lastFitnessSyncAt,
    setFitnessConnection,
  } = useAppStore();

  const { syncAllProviders, isLoading } = useFitnessSync();
  const [isExpanded, setIsExpanded] = useState(true);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [connectedProviders, setConnectedProviders] = useState<FitnessProvider[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<FitnessActivity | null>(null);

  // Fetch connection status from server on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch('/api/fitness/status');
        if (response.ok) {
          const data = await response.json();
          const connected: FitnessProvider[] = [];
          
          if (data.providers) {
            Object.entries(data.providers).forEach(([provider, status]: [string, any]) => {
              if (status?.connected) {
                connected.push(provider as FitnessProvider);
                setFitnessConnection(provider as FitnessProvider, {
                  provider: provider as FitnessProvider,
                  isConnected: true,
                  connectedAt: status.connectedAt || new Date().toISOString(),
                  lastSyncAt: status.lastSync || null,
                  syncEnabled: true,
                });
              }
            });
          }
          
          setConnectedProviders(connected);
        }
      } catch (error) {
        console.error('Failed to check fitness connection status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkConnectionStatus();
  }, [setFitnessConnection]);

  const hasConnections = connectedProviders.length > 0;

  // Get last 7 days dates
  const getLast7Days = () => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last7Days = getLast7Days();

  // Get all activities from last 7 days, grouped by date
  const activitiesByDate = last7Days.reduce((acc, dateStr) => {
    const activities = syncedFitnessData?.activities.filter(a => {
      const activityDate = new Date(a.startTime).toISOString().split('T')[0];
      return activityDate === dateStr;
    }) || [];
    if (activities.length > 0) {
      acc[dateStr] = activities;
    }
    return acc;
  }, {} as Record<string, FitnessActivity[]>);

  const totalActivities = Object.values(activitiesByDate).flat().length;

  // Get aggregated stats for last 7 days
  const totalSteps = syncedFitnessData?.dailySteps
    ?.filter(d => last7Days.includes(d.date))
    ?.reduce((sum, d) => sum + d.value, 0) || 0;

  const totalCalories = syncedFitnessData?.dailyCalories
    ?.filter(d => last7Days.includes(d.date))
    ?.reduce((sum, d) => sum + d.value, 0) || 0;

  const handleSync = async () => {
    await syncAllProviders();
  };

  const handleImport = (activity: FitnessActivity, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatSpeed = (speedMps: number) => {
    const kmh = speedMps * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const formatPace = (speedMps: number) => {
    if (speedMps <= 0) return '--';
    const minPerKm = 1000 / (speedMps * 60);
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  const getActivityIcon = (type: string): string => {
    const normalizedType = type.toLowerCase();
    for (const [key, icon] of Object.entries(ACTIVITY_EMOJI_ICONS)) {
      if (normalizedType.includes(key)) return icon;
    }
    return ACTIVITY_EMOJI_ICONS.default;
  };

  // Show loading state while checking
  if (isCheckingStatus) {
    return (
      <div className="mb-4 bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Checking fitness connections...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Show connect prompt if no providers connected
  if (!hasConnections) {
    return (
      <div className="mb-4 bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-200 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Connect Fitness Apps</h3>
            <p className="text-xs text-gray-500">Sync activities from Strava, Fitbit & more</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          <Settings className="w-4 h-4" />
          Connect in Settings
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
              🏃
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Synced Activities</h3>
              <div className="flex items-center gap-2">
                {connectedProviders.map(provider => (
                  <span
                    key={provider}
                    className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[provider]}`}
                    title={PROVIDER_NAMES[provider]}
                  />
                ))}
                <span className="text-xs text-gray-500">
                  {totalActivities} activities (7 days)
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
              className="p-2 bg-emerald-100 rounded-lg disabled:opacity-50 text-emerald-600"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isFitnessSyncing ? 'animate-spin' : ''}`} />
            </motion.button>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{fitnessSyncError}</p>
                  </div>
                )}

                {/* 7-Day Summary Stats */}
                {(totalSteps > 0 || totalCalories > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 text-center">
                      <span className="text-2xl">👟</span>
                      <p className="text-lg font-bold text-gray-900">{totalSteps.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Steps (7 days)</p>
                    </div>
                    <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 text-center">
                      <span className="text-2xl">🔥</span>
                      <p className="text-lg font-bold text-gray-900">{Math.round(totalCalories).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Calories (7 days)</p>
                    </div>
                  </div>
                )}

                {/* Activities List by Date */}
                {totalActivities > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(activitiesByDate).map(([dateStr, activities]) => (
                      <div key={dateStr}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">{formatDate(dateStr)}</p>
                          <span className="text-xs text-gray-400">({activities.length})</span>
                        </div>
                        <div className="space-y-2">
                          {activities.map((activity) => {
                            const isImported = importedIds.has(activity.id);
                            return (
                              <motion.div
                                key={activity.id}
                                layout
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedActivity(activity)}
                                className="bg-white border border-gray-100 rounded-xl p-3 cursor-pointer hover:border-emerald-200 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 ${PROVIDER_COLORS[activity.source]} rounded-xl flex items-center justify-center text-xl`}>
                                      {getActivityIcon(activity.type)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{activity.name}</p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
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
                                        <p className="text-xs text-gray-400 mt-1">
                                          {(activity.distance / 1000).toFixed(2)} km
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {onImportActivity && (
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => handleImport(activity, e)}
                                      disabled={isImported}
                                      className={`p-2 rounded-lg ${
                                        isImported
                                          ? 'bg-green-100 text-green-600'
                                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600'
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-4xl block mb-3">🏃</span>
                    <p className="text-gray-600 text-sm">No activities synced yet</p>
                    <p className="text-gray-400 text-xs mt-1">Click sync to fetch your recent workouts</p>
                    <button
                      onClick={handleSync}
                      disabled={isLoading || isFitnessSyncing}
                      className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {isLoading || isFitnessSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                )}

                {/* Last Sync Info */}
                {lastFitnessSyncAt && (
                  <p className="text-xs text-gray-400 text-center">
                    Last synced: {new Date(lastFitnessSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 ${PROVIDER_COLORS[selectedActivity.source]} rounded-2xl flex items-center justify-center text-3xl`}>
                    {getActivityIcon(selectedActivity.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedActivity.name}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedActivity.startTime).toLocaleDateString([], {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Timer className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(selectedActivity.duration)}</p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
                {selectedActivity.distance && (
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold text-gray-900">{(selectedActivity.distance / 1000).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Kilometers</p>
                  </div>
                )}
                {selectedActivity.calories && (
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold text-gray-900">{Math.round(selectedActivity.calories)}</p>
                    <p className="text-xs text-gray-500">Calories</p>
                  </div>
                )}
                {selectedActivity.averageSpeed && (
                  <div className="bg-cyan-50 rounded-xl p-4 text-center">
                    <Gauge className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
                    <p className="text-2xl font-bold text-gray-900">{formatSpeed(selectedActivity.averageSpeed)}</p>
                    <p className="text-xs text-gray-500">Avg Speed</p>
                  </div>
                )}
              </div>

              {/* Heart Rate Stats */}
              {(selectedActivity.averageHeartRate || selectedActivity.maxHeartRate) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Heart Rate
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedActivity.averageHeartRate && (
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{Math.round(selectedActivity.averageHeartRate)}</p>
                        <p className="text-xs text-gray-500">Avg BPM</p>
                      </div>
                    )}
                    {selectedActivity.maxHeartRate && (
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{Math.round(selectedActivity.maxHeartRate)}</p>
                        <p className="text-xs text-gray-500">Max BPM</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Stats */}
              <div className="space-y-3">
                {selectedActivity.elevationGain && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <Mountain className="w-5 h-5 text-emerald-500" />
                      <span className="text-gray-700">Elevation Gain</span>
                    </div>
                    <span className="font-bold text-gray-900">{Math.round(selectedActivity.elevationGain)} m</span>
                  </div>
                )}
                {selectedActivity.averageSpeed && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-lime-500" />
                      <span className="text-gray-700">Pace</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatPace(selectedActivity.averageSpeed)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">Start Time</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatTime(selectedActivity.startTime)}</span>
                </div>
              </div>

              {/* Source Badge */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className={`w-3 h-3 rounded-full ${PROVIDER_COLORS[selectedActivity.source]}`} />
                <span className="text-sm text-gray-500">Synced from {PROVIDER_NAMES[selectedActivity.source]}</span>
              </div>

              {/* Import Button */}
              {onImportActivity && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    handleImport(selectedActivity, e);
                    setSelectedActivity(null);
                  }}
                  disabled={importedIds.has(selectedActivity.id)}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
                    importedIds.has(selectedActivity.id)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {importedIds.has(selectedActivity.id) ? (
                    <>
                      <Check className="w-5 h-5" />
                      Imported
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Import to Today's Log
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
