// ============================================================
// Synced Activities Component
// Display activities synced from external fitness providers
// Shows last 7 days of activities
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
  Calendar,
  Link as LinkIcon,
  Settings,
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
                // Update local store
                setFitnessConnection(provider as FitnessProvider, {
                  isConnected: true,
                  lastSyncAt: status.lastSync ? new Date(status.lastSync) : undefined,
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
      if (normalizedType.includes(key)) return icon;
    }
    return ACTIVITY_ICONS.default;
  };

  // Show loading state while checking
  if (isCheckingStatus) {
    return (
      <div className="mx-4 mb-4 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-purple-300 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Checking fitness connections...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Show connect prompt if no providers connected
  if (!hasConnections) {
    return (
      <div className="mx-4 mb-4 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Connect Fitness Apps</h3>
            <p className="text-xs text-gray-400">Sync activities from Strava, Fitbit & more</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex items-center justify-center gap-2 w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          <Settings className="w-4 h-4" />
          Connect in Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl overflow-hidden">
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

              {/* 7-Day Summary Stats */}
              {(totalSteps > 0 || totalCalories > 0) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Footprints className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-lg font-bold">{totalSteps.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Steps (7 days)</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                    <p className="text-lg font-bold">{Math.round(totalCalories).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Calories (7 days)</p>
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
                        <p className="text-sm font-medium text-gray-300">{formatDate(dateStr)}</p>
                        <span className="text-xs text-gray-500">({activities.length})</span>
                      </div>
                      <div className="space-y-2">
                        {activities.map((activity) => {
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 text-sm">No activities synced yet</p>
                  <p className="text-gray-500 text-xs mt-1">Click sync to fetch your recent workouts</p>
                  <button
                    onClick={handleSync}
                    disabled={isLoading || isFitnessSyncing}
                    className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    {isLoading || isFitnessSyncing ? 'Syncing...' : 'Sync Now'}
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
