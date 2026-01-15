'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Cloud, CloudOff, RefreshCw, Check, AlertCircle,
  User, LogOut, Settings, Database, Shield, Smartphone,
  Loader2, Trash2, Upload
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import AuthModal from '@/components/AuthModal';
import { 
  initSupabase, signIn, signUp, signOut, 
  getCurrentUser, resetPassword, signInWithGoogle, signInWithApple 
} from '@/lib/supabase';
import { performFullSync } from '@/lib/supabase-sync';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function CloudSyncPage() {
  const router = useRouter();
  const store = useAppStore();
  
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_key');
    const savedLastSync = localStorage.getItem('last_sync');
    
    if (savedUrl && savedKey) {
      setSupabaseUrl(savedUrl);
      setSupabaseKey(savedKey);
      setIsConfigured(true);
      initSupabase(savedUrl, savedKey);
      getCurrentUser().then(user => setCurrentUser(user));
    }
    if (savedLastSync) setLastSync(savedLastSync);
  }, []);

  const handleSaveConfig = () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncError('Please enter both URL and API key');
      return;
    }
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    initSupabase(supabaseUrl, supabaseKey);
    setIsConfigured(true);
    setShowConfig(false);
    setSyncError(null);
  };

  const handleClearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    localStorage.removeItem('last_sync');
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsConfigured(false);
    setCurrentUser(null);
    setLastSync(null);
  };

  const handleSignIn = async (email: string, password: string) => {
    const { user } = await signIn(email, password);
    setCurrentUser(user);
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
  };

  const handleSync = async () => {
    if (!currentUser) {
      setSyncError('Please sign in to sync');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      // Extract all meals from dailyLogs
      const allMeals = store.dailyLogs.flatMap(log => 
        log.meals.map(meal => ({ ...meal, date: log.date }))
      );
      
      await performFullSync(currentUser.id, {
        history: store.analysisHistory,
        meals: allMeals,
        weights: store.weightHistory,
        recipes: store.recipes,
        dailyGoals: store.dailyGoals,
        userStats: store.userStats,
        preferences: store.userProfile.dietaryPreferences,
        allergies: store.userProfile.allergies,
        goals: store.userProfile.healthGoals,
      });
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('last_sync', now);
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 bg-black/80 backdrop-blur-lg z-10 px-4 py-4 flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Cloud Sync</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isConfigured && currentUser ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <CloudOff className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{isConfigured && currentUser ? 'Connected' : 'Not Connected'}</h2>
                <p className="text-gray-400 text-sm">{currentUser ? currentUser.email : 'Sign in to sync'}</p>
              </div>
            </div>
            {isConfigured && currentUser && (
              <button onClick={handleSync} disabled={syncing}
                className="p-3 bg-green-500/20 rounded-full hover:bg-green-500/30 disabled:opacity-50">
                {syncing ? <Loader2 className="w-6 h-6 text-green-400 animate-spin" /> : <RefreshCw className="w-6 h-6 text-green-400" />}
              </button>
            )}
          </div>
          {lastSync && <div className="flex items-center gap-2 text-sm text-gray-400"><Check className="w-4 h-4 text-green-400" />Last synced: {formatLastSync(lastSync)}</div>}
          {syncError && <div className="flex items-center gap-2 text-sm text-red-400 mt-2"><AlertCircle className="w-4 h-4" />{syncError}</div>}
        </motion.div>

        {/* Sign In Button */}
        {isConfigured && !currentUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2">
              <User className="w-5 h-5" />Sign In / Create Account
            </button>
          </motion.div>
        )}

        {/* User Actions */}
        {currentUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <button onClick={handleSync} disabled={syncing}
              className="w-full bg-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-750">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center"><Upload className="w-5 h-5 text-blue-400" /></div>
              <div className="flex-1 text-left"><p className="font-medium">Sync Now</p><p className="text-sm text-gray-400">Upload & download data</p></div>
              {syncing && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </button>
            <button onClick={handleSignOut} className="w-full bg-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-750">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center"><LogOut className="w-5 h-5 text-red-400" /></div>
              <div className="flex-1 text-left"><p className="font-medium">Sign Out</p><p className="text-sm text-gray-400">Disconnect from cloud</p></div>
            </button>
          </motion.div>
        )}

        {/* Config Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 rounded-2xl overflow-hidden">
          <button onClick={() => setShowConfig(!showConfig)} className="w-full p-4 flex items-center gap-4 hover:bg-gray-800">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center"><Settings className="w-5 h-5 text-purple-400" /></div>
            <div className="flex-1 text-left"><p className="font-medium">Supabase Configuration</p><p className="text-sm text-gray-400">{isConfigured ? 'Connected' : 'Set up your project'}</p></div>
          </button>
          {showConfig && (
            <div className="p-4 pt-0 space-y-4">
              <div><label className="block text-sm text-gray-400 mb-2">Project URL</label>
                <input type="url" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="https://xxxxx.supabase.co"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Anon Key</label>
                <input type="password" value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" /></div>
              <div className="flex gap-3">
                <button onClick={handleSaveConfig} className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-xl">Save</button>
                {isConfigured && <button onClick={handleClearConfig} className="p-3 bg-red-500/20 text-red-400 rounded-xl"><Trash2 className="w-5 h-5" /></button>}
              </div>
            </div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4">
            <Database className="w-6 h-6 text-blue-400 mt-1" />
            <div><p className="font-medium">What gets synced?</p><p className="text-sm text-gray-400 mt-1">Food history, meals, weight, recipes, goals & preferences.</p></div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4">
            <Shield className="w-6 h-6 text-green-400 mt-1" />
            <div><p className="font-medium">Your data is secure</p><p className="text-sm text-gray-400 mt-1">Encrypted and stored in your own Supabase project.</p></div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4">
            <Smartphone className="w-6 h-6 text-purple-400 mt-1" />
            <div><p className="font-medium">Multi-device access</p><p className="text-sm text-gray-400 mt-1">Access from any device. Changes sync automatically.</p></div>
          </div>
        </motion.div>

        {/* Setup Guide */}
        {!isConfigured && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4">📋 Quick Setup</h3>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3"><span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">1</span>Create account at <a href="https://supabase.com" target="_blank" className="text-purple-400 underline">supabase.com</a></li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">2</span>Create a new project</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">3</span>Copy URL & anon key from Settings → API</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">4</span>Run the database SQL setup</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">5</span>Paste credentials above!</li>
            </ol>
          </motion.div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn} onSignUp={handleSignUp}
        onGoogleSignIn={async () => { await signInWithGoogle(); }} onAppleSignIn={async () => { await signInWithApple(); }}
        onForgotPassword={async (email: string) => { await resetPassword(email); }} />
    </div>
  );
}
