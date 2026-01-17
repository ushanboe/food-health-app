'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud, CloudOff, LogOut, RefreshCw, CheckCircle, User, Shield, AlertCircle } from 'lucide-react';
import AuthModal from './AuthModal';
import { saveSyncRecord, getSyncStatus, formatRelativeTime, SyncRecord } from '@/lib/syncStatus';

export default function CloudSyncCard() {
  const { user, loading, isConfigured, signOut, supabase } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'failed' | 'partial' | 'never'>('never');
  const [syncMessage, setSyncMessage] = useState<string>('');

  useEffect(() => {
    const status = getSyncStatus();
    setLastSyncTime(status.lastSync);
    setLastSyncStatus(status.lastSyncStatus);
  }, [syncing]);

  const handleSignOut = async () => {
    if (confirm('Sign out? Your local data will be kept, but won\'t sync until you sign in again.')) {
      await signOut();
    }
  };

  const handleManualSync = async () => {
    if (!supabase || !user) return;
    
    setSyncing(true);
    setSyncMessage('Starting sync...');
    const startTime = Date.now();
    
    const syncDetails = {
      foodDiary: { uploaded: 0, downloaded: 0 },
      weightEntries: { uploaded: 0, downloaded: 0 },
      goals: { uploaded: 0, downloaded: 0 },
      recipes: { uploaded: 0, downloaded: 0 },
      profile: { synced: false },
    };
    
    let hasError = false;
    let errorMessage = '';

    try {
      // Sync Food History
      setSyncMessage('Syncing food diary...');
      try {
        const localFoodHistory = JSON.parse(localStorage.getItem('foodHistory') || '[]');
        
        // Upload local data
        if (localFoodHistory.length > 0) {
          for (const item of localFoodHistory) {
            const { error } = await supabase
              .from('food_history')
              .upsert({
                id: item.id,
                user_id: user.id,
                timestamp: item.timestamp,
                food_name: item.foodName || item.name,
                category: item.category || 'Unknown',
                health_score: item.healthScore || 0,
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fat: item.fat || 0,
                fiber: item.fiber || 0,
                verdict: item.verdict || '',
                description: item.description || '',
                alternatives: item.alternatives || [],
              }, { onConflict: 'id' });
            
            if (!error) syncDetails.foodDiary.uploaded++;
          }
        }

        // Download cloud data
        const { data: cloudFood } = await supabase
          .from('food_history')
          .select('*')
          .eq('user_id', user.id);
        
        if (cloudFood && cloudFood.length > 0) {
          syncDetails.foodDiary.downloaded = cloudFood.length;
        }
      } catch (e) {
        console.error('Food sync error:', e);
      }

      // Sync Weight Entries
      setSyncMessage('Syncing weight entries...');
      try {
        const localWeight = JSON.parse(localStorage.getItem('weightHistory') || '[]');
        
        if (localWeight.length > 0) {
          for (const item of localWeight) {
            const { error } = await supabase
              .from('weight_history')
              .upsert({
                id: item.id || `weight-${item.date}`,
                user_id: user.id,
                date: item.date,
                weight: item.weight,
                note: item.note || '',
              }, { onConflict: 'id' });
            
            if (!error) syncDetails.weightEntries.uploaded++;
          }
        }

        const { data: cloudWeight } = await supabase
          .from('weight_history')
          .select('*')
          .eq('user_id', user.id);
        
        if (cloudWeight && cloudWeight.length > 0) {
          syncDetails.weightEntries.downloaded = cloudWeight.length;
        }
      } catch (e) {
        console.error('Weight sync error:', e);
      }

      // Sync Goals/Profile
      setSyncMessage('Syncing profile & goals...');
      try {
        const localGoals = localStorage.getItem('userGoals');
        const localStats = localStorage.getItem('userStats');
        
        if (localGoals || localStats) {
          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              daily_goals: localGoals ? JSON.parse(localGoals) : {},
              user_stats: localStats ? JSON.parse(localStats) : {},
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          
          if (!error) {
            syncDetails.profile.synced = true;
            syncDetails.goals.uploaded = 1;
          }
        }

        const { data: cloudProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (cloudProfile) {
          syncDetails.goals.downloaded = 1;
          syncDetails.profile.synced = true;
        }
      } catch (e) {
        console.error('Profile sync error:', e);
      }

      // Sync Recipes
      setSyncMessage('Syncing recipes...');
      try {
        const localRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        
        if (localRecipes.length > 0) {
          for (const recipe of localRecipes) {
            const { error } = await supabase
              .from('recipes')
              .upsert({
                id: recipe.id,
                user_id: user.id,
                name: recipe.name,
                servings: recipe.servings || 1,
                ingredients: recipe.ingredients || [],
                instructions: recipe.instructions || '',
              }, { onConflict: 'id' });
            
            if (!error) syncDetails.recipes.uploaded++;
          }
        }

        const { data: cloudRecipes } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id);
        
        if (cloudRecipes && cloudRecipes.length > 0) {
          syncDetails.recipes.downloaded = cloudRecipes.length;
        }
      } catch (e) {
        console.error('Recipe sync error:', e);
      }

      setSyncMessage('Sync complete!');

    } catch (error: any) {
      hasError = true;
      errorMessage = error.message || 'Unknown error';
      setSyncMessage('Sync failed: ' + errorMessage);
    }

    const duration = Date.now() - startTime;
    
    // Determine status
    const totalItems = 
      syncDetails.foodDiary.uploaded + syncDetails.foodDiary.downloaded +
      syncDetails.weightEntries.uploaded + syncDetails.weightEntries.downloaded +
      syncDetails.goals.uploaded + syncDetails.goals.downloaded +
      syncDetails.recipes.uploaded + syncDetails.recipes.downloaded;
    
    let status: 'success' | 'failed' | 'partial' = 'success';
    if (hasError && totalItems === 0) {
      status = 'failed';
    } else if (hasError) {
      status = 'partial';
    }

    // Save sync record
    const record: SyncRecord = {
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'full',
      status,
      details: syncDetails,
      duration,
      error: hasError ? errorMessage : undefined,
    };
    
    saveSyncRecord(record);
    
    // Update UI
    setLastSyncTime(record.timestamp);
    setLastSyncStatus(status);
    
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage('');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-300 dark:bg-gray-700 rounded-full">
            <CloudOff className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Cloud Sync Unavailable</h3>
            <p className="text-sm text-gray-500">Cloud features are not configured</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 shadow-lg ${
          user
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
            : 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30'
        }`}
      >
        {user ? (
          // Logged in state
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-green-800 dark:text-green-300">Cloud Sync Active</h3>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Sync Status */}
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last sync</span>
                <span className={`font-medium flex items-center gap-1 ${
                  lastSyncStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                  lastSyncStatus === 'failed' ? 'text-red-600 dark:text-red-400' :
                  lastSyncStatus === 'partial' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {lastSyncStatus === 'failed' && <AlertCircle className="w-3 h-3" />}
                  {lastSyncTime ? formatRelativeTime(lastSyncTime) : 'Never'}
                </span>
              </div>
              {syncMessage && (
                <div className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                  {syncMessage}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={handleSignOut}
                className="py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Benefits */}
            <div className="pt-2 border-t border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Your data is encrypted and secure
              </p>
            </div>
          </div>
        ) : (
          // Logged out state
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-full">
                <CloudOff className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">Enable Cloud Sync</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Sync your data across all devices
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Backup your food diary & progress</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Access from phone, tablet & computer</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Never lose your data again</span>
              </div>
            </div>

            {/* Sign Up/Login Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign Up Free
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </motion.div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
