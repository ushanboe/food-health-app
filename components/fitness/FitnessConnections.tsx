// ============================================================
// Fitness Connections Component
// Manage connections to external fitness providers
// ============================================================

'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FitnessProvider, FitnessConnection } from '@/lib/fitness-sync/types';
import { PROVIDER_CONFIGS } from '@/lib/fitness-sync/config';

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

  // Check for OAuth callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider') as FitnessProvider | null;
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (provider && success === 'true') {
      // Connection successful - update state
      const connection: FitnessConnection = {
        provider,
        isConnected: true,
        connectedAt: new Date().toISOString(),
        lastSyncAt: null,
        syncEnabled: true,
      };
      setFitnessConnection(provider, connection);
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (provider && error) {
      setFitnessSyncError(`Failed to connect ${PROVIDER_INFO[provider]?.name}: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setFitnessConnection, setFitnessSyncError]);

  const handleConnect = async (provider: FitnessProvider) => {
    setIsConnecting(provider);
    setFitnessSyncError(null);

    try {
      const config = PROVIDER_CONFIGS[provider];
      if (!config.clientId) {
        throw new Error(`${PROVIDER_INFO[provider].name} is not configured. Please add API credentials.`);
      }

      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const state = Math.random().toString(36).substring(7);
      
      // Store state for verification
      sessionStorage.setItem(`oauth_state_${provider}`, state);

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(provider === 'strava' ? ',' : ' '),
        state,
      });

      // Provider-specific params
      if (provider === 'google_fit') {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
      } else if (provider === 'strava') {
        params.set('approval_prompt', 'auto');
      }

      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      setFitnessSyncError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (provider: FitnessProvider) => {
    clearFitnessConnection(provider);
    // Also clear tokens from localStorage
    try {
      const savedTokens = localStorage.getItem('fitness_tokens');
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        delete tokens[provider];
        localStorage.setItem('fitness_tokens', JSON.stringify(tokens));
      }
    } catch {
      // Ignore errors
    }
  };

  const handleSyncAll = async () => {
    setFitnessSyncing(true);
    setFitnessSyncError(null);

    try {
      // Get connected providers
      const connected = ALL_PROVIDERS.filter(p => fitnessConnections[p]?.isConnected);
      
      if (connected.length === 0) {
        throw new Error('No fitness providers connected');
      }

      // Sync each provider
      for (const provider of connected) {
        try {
          const savedTokens = localStorage.getItem('fitness_tokens');
          if (!savedTokens) continue;
          
          const tokens = JSON.parse(savedTokens);
          const token = tokens[provider];
          if (!token) continue;

          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(
            Date.now() - fitnessSyncPreferences.syncDaysBack * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0];

          const response = await fetch('/api/fitness/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              accessToken: atob(token.accessToken),
              startDate,
              endDate,
            }),
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
          }
        } catch (err) {
          console.error(`Failed to sync ${provider}:`, err);
        }
      }

      setLastFitnessSyncAt(new Date().toISOString());
    } catch (error) {
      setFitnessSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setFitnessSyncing(false);
    }
  };

  const connectedCount = ALL_PROVIDERS.filter(p => fitnessConnections[p]?.isConnected).length;

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
          const connection = fitnessConnections[provider];
          const isConnected = connection?.isConnected ?? false;
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

                      {/* Action Button */}
                      {isConnected ? (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(provider);
                          }}
                          className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl flex items-center justify-center gap-2"
                        >
                          <Unlink className="w-4 h-4" />
                          Disconnect
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(provider);
                          }}
                          disabled={isLoading}
                          className={`w-full py-3 ${info.bgColor} ${info.color} font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                          {isLoading ? 'Connecting...' : 'Connect'}
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
          <li>Click Connect to authorize access</li>
          <li>Grant permissions in the provider's app</li>
          <li>Your fitness data will sync automatically</li>
        </ol>
        <p className="text-xs text-purple-600 mt-3">
          Note: API credentials must be configured in environment variables for OAuth to work.
        </p>
      </div>
    </div>
  );
}
