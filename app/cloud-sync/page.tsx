"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Cloud, CloudOff, Upload, Download, RefreshCw,
  User, Mail, Lock, Eye, EyeOff, LogOut, Trash2, Check,
  AlertCircle, Loader2, Settings, Shield, Smartphone,
  ChevronRight, Database, Clock, X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { syncService, SyncResult } from '@/lib/supabase/sync-service';
import { resetSupabaseClient } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup';
type ViewMode = 'main' | 'auth' | 'config';

function CloudSyncPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { aiSettings, updateAISettings, dailyLogs, recipes } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState(aiSettings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(aiSettings.supabaseAnonKey || '');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isConfigured = !!(aiSettings.supabaseUrl && aiSettings.supabaseAnonKey);

  useEffect(() => {
    checkAuth();
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam === 'auth_failed' ? 'Authentication failed. Please try again.' : errorParam);
    }
  }, [aiSettings.supabaseUrl, aiSettings.supabaseAnonKey]);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const currentUser = await syncService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setError('Please enter both Supabase URL and Anon Key');
      return;
    }
    updateAISettings({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
    });
    resetSupabaseClient();
    setSuccess('Supabase configured successfully!');
    setViewMode('main');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await syncService.signIn(email, password);
      await checkAuth();
      setViewMode('main');
      setSuccess('Signed in successfully!');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await syncService.signUp(email, password, displayName);
      setSuccess('Account created! Please check your email to verify.');
      setAuthMode('signin');
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'github') => {
    setIsLoading(true);
    setError('');
    try {
      await syncService.signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || 'OAuth sign in failed');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await syncService.signOut();
      setUser(null);
      setSuccess('Signed out successfully');
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const result = await syncService.uploadToCloud();
      setSyncResult(result);
      if (result.success) {
        setLastSynced(new Date().toISOString());
        setSuccess(`Uploaded ${result.uploaded || 0} items to cloud`);
      } else {
        setError(result.errors?.join(', ') || result.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const result = await syncService.downloadFromCloud();
      setSyncResult(result);
      if (result.success) {
        setLastSynced(new Date().toISOString());
        setSuccess(`Downloaded ${result.downloaded || 0} items from cloud`);
      } else {
        setError(result.message || 'Download failed');
      }
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const result = await syncService.fullSync();
      setSyncResult(result);
      if (result.success) {
        setLastSynced(new Date().toISOString());
        setSuccess('Full sync completed!');
      } else {
        setError(result.errors?.join(', ') || result.message || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your cloud data.')) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await syncService.deleteAccount();
      if (result.success) {
        setUser(null);
        setSuccess('Account deleted successfully');
      } else {
        setError(result.message || 'Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-lg z-10 px-4 py-4 flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Cloud Sync</h1>
        {isConfigured && (
          <button onClick={() => setViewMode('config')} className="ml-auto p-2 text-gray-400 hover:text-white">
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')}><X size={18} className="text-red-400" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3"
          >
            <Check className="text-green-400 flex-shrink-0" size={20} />
            <p className="text-green-200 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')}><X size={18} className="text-green-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-6">
        {/* Not Configured State */}
        {!isConfigured && viewMode === 'main' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudOff size={40} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Set Up Cloud Sync</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Connect to Supabase to sync your food diary and recipes across devices.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('config')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold"
            >
              Configure Supabase
            </motion.button>
            <div className="mt-8 p-4 bg-gray-900 rounded-xl text-left">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database size={18} className="text-blue-400" />
                How to get Supabase credentials
              </h3>
              <ol className="text-sm text-gray-400 space-y-2">
                <li>1. Go to <a href="https://supabase.com" target="_blank" className="text-blue-400 underline">supabase.com</a> and create a free account</li>
                <li>2. Create a new project</li>
                <li>3. Go to Settings → API</li>
                <li>4. Copy the Project URL and anon/public key</li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* Configuration View */}
        {viewMode === 'config' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Supabase Configuration</h2>
              <button onClick={() => setViewMode('main')} className="text-gray-400"><X size={24} /></button>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Anon / Public Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveConfig}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-xl font-semibold"
            >
              Save Configuration
            </motion.button>
            <p className="text-xs text-gray-500 text-center">
              Your credentials are stored locally and never sent to our servers.
            </p>
          </motion.div>
        )}

        {/* Auth View */}
        {viewMode === 'auth' && isConfigured && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
              <button onClick={() => setViewMode('main')} className="text-gray-400"><X size={24} /></button>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="w-full bg-white text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full bg-gray-800 py-3 rounded-xl font-semibold flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </motion.button>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-gray-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={20} /> Please wait...</>
              ) : (
                authMode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </motion.button>

            <p className="text-center text-gray-400">
              {authMode === 'signin' ? (
                <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-blue-400">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setAuthMode('signin')} className="text-blue-400">Sign in</button></>
              )}
            </p>
          </motion.div>
        )}

        {/* Main View - Logged Out */}
        {viewMode === 'main' && isConfigured && !user && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cloud size={40} />
            </div>
            <h2 className="text-xl font-bold mb-2">Cloud Sync Ready</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Sign in to sync your food diary and recipes across all your devices.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold"
            >
              Sign In / Sign Up
            </motion.button>
            <div className="mt-8 p-4 bg-gray-900 rounded-xl">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Smartphone size={18} className="text-green-400" />
                Local Data
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-400">{dailyLogs.reduce((acc, log) => acc + log.meals.length, 0)}</p>
                  <p className="text-gray-400">Diary Entries</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-400">{recipes.length}</p>
                  <p className="text-gray-400">Recipes</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main View - Logged In */}
        {viewMode === 'main' && isConfigured && user && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={28} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user.user_metadata?.display_name || 'User'}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-white">
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                Sync Status
              </h3>
              <p className="text-gray-400 text-sm">
                {lastSynced ? `Last synced: ${new Date(lastSynced).toLocaleString()}` : 'Not synced yet'}
              </p>
            </div>

            <div className="bg-gray-900 rounded-2xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Database size={18} className="text-green-400" />
                Your Data
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{dailyLogs.reduce((acc, log) => acc + log.meals.length, 0)}</p>
                  <p className="text-gray-400 text-sm">Diary Entries</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">{recipes.length}</p>
                  <p className="text-gray-400 text-sm">Recipes</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFullSync}
                disabled={isSyncing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-4 rounded-xl font-semibold flex items-center justify-center gap-3"
              >
                {isSyncing ? (
                  <><Loader2 className="animate-spin" size={20} /> Syncing...</>
                ) : (
                  <><RefreshCw size={20} /> Full Sync</>
                )}
              </motion.button>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpload}
                  disabled={isSyncing}
                  className="bg-gray-800 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Upload
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  disabled={isSyncing}
                  className="bg-gray-800 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download
                </motion.button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield size={18} className="text-green-400" />
                Security
              </h3>
              <p className="text-gray-400 text-sm">
                Your data is encrypted in transit and at rest. Only you can access your data.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-900/50 rounded-2xl p-4">
              <h3 className="font-semibold mb-2 text-red-400">Danger Zone</h3>
              <p className="text-gray-400 text-sm mb-3">Permanently delete your account and all cloud data.</p>
              <button
                onClick={handleDeleteAccount}
                className="text-red-400 text-sm flex items-center gap-2 hover:text-red-300"
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </motion.div>
        )}

        {isLoading && viewMode === 'main' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-400" size={40} />
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function CloudSyncPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CloudSyncPageContent />
    </Suspense>
  );
}
