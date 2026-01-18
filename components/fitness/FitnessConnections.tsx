// ============================================================
// Fitness Connections Component
// Manage connections to external fitness providers
// Uses server-side OAuth - no client-side credentials needed
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Link2,
  Unlink,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Smartphone,
  Watch,
  Bike,
  Heart,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FitnessProvider, FitnessConnection } from '@/lib/fitness-sync/types';

// Provider display info
const PROVIDER_INFO: Record<FitnessProvider, {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}> = {
  google_fit: {
    name: 'Google Fit',
    icon: <Activity className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Sync steps, workouts & calories',
    features: ['Steps', 'Workouts', 'Calories', 'Heart Rate'],
  },
  fitbit: {
    name: 'Fitbit',
    icon: <Watch className="w-5 h-5" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: 'Sync activities & health metrics',
    features: ['Steps', 'Activities', 'Heart Rate', 'Sleep'],
  },
  strava: {
    name: 'Strava',
    icon: <Bike className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Sync running, cycling & swimming',
    features: ['Running', 'Cycling', 'Swimming', 'Workouts'],
  },
  garmin: {
    name: 'Garmin Connect',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Sync activities & health data',
    features: ['Steps', 'Activities', 'Heart Rate', 'Sleep'],
  },
};

const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

interface ProviderStatus {
  provider: FitnessProvider;
  configured: boolean;
  connected: boolean;
  connectedAt?: string;
  expiresAt?: number;
  needsRefresh?: boolean;
}

export default function FitnessConnections() {
  const {
    fitnessConnections,
    fitnessSyncPreferences,
    lastFitnessSyncAt,
    isFitnessSyncing,
    fitnessSyncError,
    setFitnessConnection,
    clearFitnessConnection,
    updateFitnessSyncPreferences,
    setFitnessSyncing,
    setFitnessSyncError,
    setLastFitnessSyncAt,
  } = useAppStore();

  const [expandedProvider, setExpandedProvider] = useState<FitnessProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState<FitnessProvider | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch connection status from server
  // Note: We intentionally exclude fitnessConnections from deps to prevent infinite loop
  // The store functions are stable references from zustand
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/fitness/status');
      if (response.ok) {
        const data = await response.json();
        setProviderStatuses(data.providers);

        // Update local store with server status
        // Get current state directly from store to avoid stale closure
        const currentConnections = useAppStore.getState().fitnessConnections;
        
        for (const status of data.providers) {
          if (status.connected) {
            const existingConnection = currentConnections[status.provider as FitnessProvider];
            setFitnessConnection(status.provider, {
              provider: status.provider,
              isConnected: true,
              connectedAt: status.connectedAt || existingConnection?.connectedAt || new Date().toISOString(),
              lastSyncAt: existingConnection?.lastSyncAt || null,
              syncEnabled: existingConnection?.syncEnabled ?? true,
            });
          } else if (currentConnections[status.provider as FitnessProvider]?.isConnected) {
            // Server says not connected but local says connected - clear local
            clearFitnessConnection(status.provider);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch fitness status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFitnessConnection, clearFitnessConnection]);

  // Check for OAuth callback results on mount - runs only once
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connectedProvider = urlParams.get('fitness_connected');
    const errorMessage = urlParams.get('fitness_error');
    const errorProvider = urlParams.get('provider');
    const disconnectedProvider = urlParams.get('fitness_disconnected');

    if (connectedProvider) {
      setSuccessMessage(`Successfully connected to ${PROVIDER_INFO[connectedProvider as FitnessProvider]?.name || connectedProvider}!`);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh status
      fetchStatus();
    } else if (disconnectedProvider) {
      setSuccessMessage(`Disconnected from ${PROVIDER_INFO[disconnectedProvider as FitnessProvider]?.name || disconnectedProvider}`);
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } else if (errorMessage) {
      let displayError = errorMessage;
      if (errorMessage === 'not_configured') {
        displayError = `${PROVIDER_INFO[errorProvider as FitnessProvider]?.name || errorProvider} is coming soon!`;
      } else if (errorMessage === 'garmin_oauth1') {
        displayError = 'Garmin Connect integration is coming soon!';
      } else if (errorMessage === 'invalid_state') {
        displayError = 'Authentication failed. Please try again.';
      }
      setFitnessSyncError(displayError);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Initial status fetch
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleConnect = (provider: FitnessProvider) => {
    setIsConnecting(provider);
    setFitnessSyncError(null);
    // Redirect to server-side OAuth initiation
    window.location.href = `/api/fitness/connect/${provider}`;
  };

  const handleDisconnect = async (provider: FitnessProvider) => {
    try {
      const response = await fetch(`/api/fitness/disconnect/${provider}`, {
        method: 'POST',
      });

      if (response.ok) {
        clearFitnessConnection(provider);
        setSuccessMessage(`Disconnected from ${PROVIDER_INFO[provider].name}`);
        // Refresh status
        fetchStatus();
      } else {
        const data = await response.json();
        setFitnessSyncError(data.error || 'Failed to disconnect');
      }
    } catch (error) {
      setFitnessSyncError('Failed to disconnect. Please try again.');
    }
  };

  const handleSync = async (provider: FitnessProvider) => {
    setFitnessSyncing(true);
    setFitnessSyncError(null);

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(
        Date.now() - (fitnessSyncPreferences.syncDaysBack || 7) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0];

      const response = await fetch(`/api/fitness/sync/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update last sync time for this provider
        const connection = fitnessConnections[provider];
        if (connection) {
          setFitnessConnection(provider, {
            ...connection,
            lastSyncAt: result.syncedAt,
          });
        }
        setLastFitnessSyncAt(new Date().toISOString());
        setSuccessMessage(`Synced data from ${PROVIDER_INFO[provider].name}`);
      } else {
        const data = await response.json();
        if (data.code === 'NOT_CONNECTED' || data.code === 'TOKEN_REFRESH_FAILED') {
          // Token expired or invalid - need to reconnect
          clearFitnessConnection(provider);
          setFitnessSyncError(`Please reconnect to ${PROVIDER_INFO[provider].name}`);
          fetchStatus();
        } else {
          setFitnessSyncError(data.error || 'Sync failed');
        }
      }
    } catch (error) {
      setFitnessSyncError('Sync failed. Please try again.');
    } finally {
      setFitnessSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    setFitnessSyncing(true);
    setFitnessSyncError(null);

    try {
      const connectedProviders = providerStatuses.filter(p => p.connected);

      if (connectedProviders.length === 0) {
        setFitnessSyncError('No fitness providers connected');
        return;
      }

      for (const status of connectedProviders) {
        await handleSync(status.provider);
      }

      setLastFitnessSyncAt(new Date().toISOString());
    } catch (error) {
      setFitnessSyncError('Sync failed. Please try again.');
    } finally {
      setFitnessSyncing(false);
    }
  };

  const getProviderStatus = (provider: FitnessProvider): ProviderStatus | undefined => {
    return providerStatuses.find(p => p.provider === provider);
  };

  const connectedCount = providerStatuses.filter(p => p.connected).length;

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingStatus) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Fitness Connections</h2>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Fitness Connections</h2>
            <p className="text-sm text-gray-500">
              {connectedCount > 0
                ? `${connectedCount} provider${connectedCount > 1 ? 's' : ''} connected`
                : 'Connect your fitness apps'
              }
            </p>
          </div>
        </div>

        {connectedCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSyncAll}
            disabled={isFitnessSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFitnessSyncing ? 'animate-spin' : ''}`} />
            {isFitnessSyncing ? 'Syncing...' : 'Sync All'}
          </motion.button>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {fitnessSyncError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{fitnessSyncError}</p>
              <button
                onClick={() => setFitnessSyncError(null)}
                className="text-xs text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Sync Info */}
      {lastFitnessSyncAt && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last synced: {formatLastSync(lastFitnessSyncAt)}</span>
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-3">
        {ALL_PROVIDERS.map((provider) => {
          const info = PROVIDER_INFO[provider];
          const status = getProviderStatus(provider);
          const connection = fitnessConnections[provider];
          const isConnected = status?.connected ?? connection?.isConnected ?? false;
          const isConfigured = status?.configured ?? true;
          const isExpanded = expandedProvider === provider;
          const isLoading = isConnecting === provider;

          return (
            <motion.div
              key={provider}
              layout
              className={`bg-white rounded-2xl border transition-colors ${
                isConnected ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              {/* Provider Header */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedProvider(isExpanded ? null : provider)}
              >
                <div className={`w-12 h-12 ${info.bgColor} rounded-xl flex items-center justify-center ${info.color}`}>
                  {info.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{info.name}</h3>
                    {isConnected && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Connected
                      </span>
                    )}
                    {!isConfigured && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>

                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {info.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Connection Status */}
                      {isConnected && connection && (
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Connected</span>
                            <span className="text-gray-700">
                              {new Date(connection.connectedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Last Sync</span>
                            <span className="text-gray-700">
                              {formatLastSync(connection.lastSyncAt)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isConnected ? (
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSync(provider);
                            }}
                            disabled={isFitnessSyncing}
                            className={`flex-1 py-3 ${info.bgColor} ${info.color} font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50`}
                          >
                            <RefreshCw className={`w-4 h-4 ${isFitnessSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(provider);
                            }}
                            className="py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl flex items-center justify-center gap-2"
                          >
                            <Unlink className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(provider);
                          }}
                          disabled={isLoading || !isConfigured}
                          className={`w-full py-3 ${info.bgColor} ${info.color} font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                          {isLoading ? 'Connecting...' : !isConfigured ? 'Coming Soon' : 'Connect'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Auto-Sync Toggle */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Auto-Sync</h3>
            <p className="text-sm text-gray-500">Sync fitness data when app opens</p>
          </div>
          <button
            onClick={() => updateFitnessSyncPreferences({
              autoSyncEnabled: !fitnessSyncPreferences.autoSyncEnabled
            })}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              fitnessSyncPreferences.autoSyncEnabled ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          >
            <motion.div
              animate={{ x: fitnessSyncPreferences.autoSyncEnabled ? 22 : 2 }}
              className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
        <h3 className="font-medium text-purple-800 mb-2">📱 How to connect</h3>
        <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
          <li>Tap on a fitness provider above</li>
          <li>Click Connect to start authorization</li>
          <li>Log in to your fitness account</li>
          <li>Grant permissions to sync your data</li>
          <li>Your fitness data will sync automatically</li>
        </ol>
      </div>
    </div>
  );
}
