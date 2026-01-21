"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { getSyncHistory, SyncRecord, saveSyncRecord } from "@/lib/syncStatus";
import { fullSync } from "@/lib/supabase/sync-service";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/Modal";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  LogIn,
  Upload,
  Download,
  Database,
  Utensils,
  Scale,
  ChefHat,
  Target,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Crown,
} from "lucide-react";
import { usePremium } from "@/lib/subscription";
import { UpgradeModal } from "@/components/PremiumGate";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Nutri celebration component

// Nutri floating toast notification
const NutriSyncToast = ({ show, uploaded, downloaded, onClose }: { 
  show: boolean; 
  uploaded: number; 
  downloaded: number;
  onClose: () => void;
}) => {
  // Auto-close after 4 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-24 right-4 z-50 flex items-end gap-2"
        >
          {/* Speech bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white rounded-2xl shadow-lg border border-emerald-100 p-3 max-w-[200px]"
          >
            {/* Bubble tail */}
            <div className="absolute -right-2 bottom-4 w-4 h-4 bg-white border-r border-b border-emerald-100 transform rotate-[-45deg]" />
            
            <div className="flex items-center gap-2 mb-1">
              <Cloud size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-gray-800">Sync Complete!</span>
            </div>
            
            <div className="flex gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Upload size={12} className="text-emerald-500" />
                {uploaded}
              </span>
              <span className="flex items-center gap-1">
                <Download size={12} className="text-blue-500" />
                {downloaded}
              </span>
            </div>
          </motion.div>

          {/* Nutri mascot */}
          <motion.div
            className="relative w-14 h-14 flex-shrink-0"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg" />
            {/* Eyes - happy closed */}
            <div className="absolute top-4 left-2.5 w-2.5 h-1 bg-gray-800 rounded-full transform rotate-12" />
            <div className="absolute top-4 right-2.5 w-2.5 h-1 bg-gray-800 rounded-full transform -rotate-12" />
            {/* Big smile */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-7 h-3.5 border-b-[3px] border-white rounded-b-full" />
            {/* Blush */}
            <div className="absolute top-6 left-1.5 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
            <div className="absolute top-6 right-1.5 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
            {/* Leaf */}
            <motion.div
              className="absolute -top-1 left-1/2 -translate-x-1/2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-3 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full transform rotate-45" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default function CloudSyncPage() {
  const router = useRouter();
  const { user, isConfigured, signIn, signUp, signOut, loading } = useAuth();
  const { isPremium } = usePremium();
  const { dailyLogs, recipes, weightHistory, userProfile, dailyGoals } = useAppStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState({ uploaded: 0, downloaded: 0 });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isConnected = user && isConfigured;

  // Calculate data stats
  const dataStats = {
    diaryEntries: dailyLogs.reduce((acc, log) => acc + log.meals.length, 0),
    recipes: recipes.length,
    weightEntries: weightHistory.length,
    hasProfile: userProfile?.name ? 1 : 0,
    hasGoals: dailyGoals?.calories ? 1 : 0,
  };
  const totalItems = dataStats.diaryEntries + dataStats.recipes + dataStats.weightEntries;

  useEffect(() => {
    const history = getSyncHistory();
    setSyncHistory(history);
  }, []);

  const handleSync = async () => {
    if (!isConnected) {
      setShowLoginModal(true);
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    const startTime = Date.now();

    try {
      const result = await fullSync();
      const duration = Date.now() - startTime;

      if (result.success) {
        const uploaded = result.uploaded || 0;
        const downloaded = result.downloaded || 0;

        // Save sync record
        const record: SyncRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: "full",
          status: "success",
          duration: duration,
          details: {
            foodDiary: { uploaded, downloaded: 0 },
            weightEntries: { uploaded: 0, downloaded },
            goals: { uploaded: 0, downloaded: 0 },
            recipes: { uploaded: 0, downloaded: 0 },
            profile: { synced: true }
          },
        };
        saveSyncRecord(record);
        setSyncHistory((prev) => [record, ...prev].slice(0, 10));

        // Show celebration
        setLastSyncResult({ uploaded, downloaded });
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        const errorMsg = result.errors?.join(", ") || result.message || "Sync failed. Please try again.";
        setSyncError(errorMsg);
        const record: SyncRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: "full",
          status: "failed",
          duration: Date.now() - startTime,
          error: errorMsg,
          details: {
            foodDiary: { uploaded: 0, downloaded: 0 },
            weightEntries: { uploaded: 0, downloaded: 0 },
            goals: { uploaded: 0, downloaded: 0 },
            recipes: { uploaded: 0, downloaded: 0 },
            profile: { synced: false }
          },
        };
        saveSyncRecord(record);
        setSyncHistory((prev) => [record, ...prev].slice(0, 10));
      }
    } catch (error: any) {
      setSyncError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setAuthError("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
        if (!result.error) {
          setAuthError(null);
          setShowLoginModal(false);
          setEmail("");
          setPassword("");
          setIsSignUp(false);
          // Note: User may need to verify email depending on Supabase settings
          setSyncError("Account created! Please check your email to verify, then sign in.");
        }
      } else {
        result = await signIn(email, password);
        if (!result.error) {
          setShowLoginModal(false);
          setEmail("");
          setPassword("");
          setAuthError(null);
        }
      }

      if (result.error) {
        // Parse common Supabase errors into user-friendly messages
        const errorMessage = result.error.message || "Authentication failed";
        if (errorMessage.includes("Invalid login credentials")) {
          setAuthError("Invalid email or password. Please try again.");
        } else if (errorMessage.includes("Email not confirmed")) {
          setAuthError("Please verify your email before signing in.");
        } else if (errorMessage.includes("User already registered")) {
          setAuthError("This email is already registered. Try signing in instead.");
        } else if (errorMessage.includes("Password")) {
          setAuthError("Password must be at least 6 characters.");
        } else {
          setAuthError(errorMessage);
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An unexpected error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const resetAuthModal = () => {
    setShowLoginModal(false);
    setEmail("");
    setPassword("");
    setAuthError(null);
    setIsSignUp(false);
    setShowPassword(false);
  };

  // Premium gate for cloud sync feature
  if (!isPremium) {
    return (
      <PageContainer>
        <PageHeader icon={Cloud} title="Cloud Backup" subtitle="Sync your data securely" />
        <PageContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Premium Feature</h2>
            <p className="text-gray-500 text-center mb-6 max-w-sm">
              Cloud Backup keeps your data safe and synced across all your devices. Never lose your progress with automatic backups.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </button>
          </motion.div>
        </PageContent>
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature="cloudSync" />
        <BottomNav />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader icon={Cloud} title="Cloud Backup" subtitle="Sync your data securely" />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="animate-spin text-emerald-500" />
          </div>
        </PageContent>
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader icon={Cloud} title="Cloud Backup" subtitle="Sync your data securely" />

      {/* Nutri Celebration */}
      <NutriSyncToast
        show={showCelebration}
        uploaded={lastSyncResult.uploaded}
        downloaded={lastSyncResult.downloaded}
        onClose={() => setShowCelebration(false)}
      />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Connection Status */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isConnected ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {isConnected ? (
                    <Cloud size={28} className="text-emerald-600" />
                  ) : (
                    <CloudOff size={28} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {isConnected ? "Connected" : "Not Connected"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? user?.email
                      : "Sign in to backup your data"}
                  </p>
                </div>
                <Badge variant={isConnected ? "success" : "default"}>
                  {isConnected ? "Active" : "Offline"}
                </Badge>
              </div>

              {syncError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{syncError}</p>
                </motion.div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                {isConnected ? (
                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw size={18} className="animate-spin mr-2" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} className="mr-2" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={signOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button fullWidth onClick={() => setShowLoginModal(true)}>
                    <LogIn size={18} className="mr-2" />
                    Sign In to Backup
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Data Summary */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Database size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Your Data</h3>
                  <p className="text-sm text-gray-500">All your health data in one place</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Utensils size={18} className="text-orange-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{dataStats.diaryEntries}</p>
                    <p className="text-xs text-gray-500">Food Entries</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <ChefHat size={18} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{dataStats.recipes}</p>
                    <p className="text-xs text-gray-500">Recipes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Scale size={18} className="text-purple-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{dataStats.weightEntries}</p>
                    <p className="text-xs text-gray-500">Weight Logs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Target size={18} className="text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{dataStats.hasGoals ? "Set" : "Not Set"}</p>
                    <p className="text-xs text-gray-500">Goals</p>
                  </div>
                </div>
              </div>

              {!isConnected && totalItems > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    You have {totalItems} items not backed up. Sign in to protect your data!
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Sync History */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sync History</h3>
                  <p className="text-sm text-gray-500">
                    {syncHistory.length > 0
                      ? `${syncHistory.length} sync${syncHistory.length > 1 ? "s" : ""} recorded`
                      : "No syncs yet"}
                  </p>
                </div>
              </div>

              {syncHistory.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Cloud size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sync history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncHistory.slice(0, 5).map((record) => (
                    <motion.div
                      key={record.id}
                      className="p-3 bg-gray-50 rounded-xl cursor-pointer"
                      onClick={() =>
                        setExpandedRecord(
                          expandedRecord === record.id ? null : record.id
                        )
                      }
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {record.status === "success" ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Check size={16} className="text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <AlertCircle size={16} className="text-red-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {record.status === "success" ? "Sync Complete" : "Sync Failed"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(record.timestamp)}
                            </p>
                          </div>
                        </div>
                        {expandedRecord === record.id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>

                      <AnimatePresence>
                        {expandedRecord === record.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                              {record.error ? (
                                <p className="text-sm text-red-600">{record.error}</p>
                              ) : (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="text-gray-900">{record.duration}ms</span>
                                  </div>
                                  {Object.entries(record.details || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <span className="text-gray-900">
                                        {key === 'profile' 
                                          ? ((value as { synced: boolean })?.synced ? '✓ Synced' : '✗ Not synced')
                                          : `↑${(value as { uploaded: number; downloaded: number })?.uploaded || 0} ↓${(value as { uploaded: number; downloaded: number })?.downloaded || 0}`
                                        }
                                      </span>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Security Info */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Shield size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                  <p className="text-sm text-gray-500">
                    Your data is encrypted and stored securely
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Login/Signup Modal */}
      <BottomSheet
        isOpen={showLoginModal}
        onClose={resetAuthModal}
        title={isSignUp ? "Create Account" : "Sign In to Backup"}
      >
        <div className="space-y-4 pb-6">
          {/* Header */}
          <div className="text-center mb-2">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isSignUp ? "bg-blue-100" : "bg-emerald-100"
            }`}>
              {isSignUp ? (
                <UserPlus size={32} className="text-blue-600" />
              ) : (
                <Cloud size={32} className="text-emerald-600" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {isSignUp 
                ? "Create an account to backup your data"
                : `Sign in to securely backup your ${totalItems} items`
              }
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
              >
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{authError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAuthError(null);
                }}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            fullWidth 
            onClick={handleAuth}
            disabled={authLoading || !email || !password}
          >
            {authLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              <>
                {isSignUp ? (
                  <><UserPlus size={18} className="mr-2" />Create Account</>
                ) : (
                  <><LogIn size={18} className="mr-2" />Sign In & Backup</>
                )}
              </>
            )}
          </Button>

          {/* Toggle Sign In / Sign Up */}
          <p className="text-center text-sm text-gray-500 pb-4">
            {isSignUp ? (
              <>Already have an account?{" "}
                <button 
                  onClick={() => {
                    setIsSignUp(false);
                    setAuthError(null);
                  }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>Don't have an account?{" "}
                <button 
                  onClick={() => {
                    setIsSignUp(true);
                    setAuthError(null);
                  }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>
      </BottomSheet>

      <BottomNav />
    </PageContainer>
  );
}
