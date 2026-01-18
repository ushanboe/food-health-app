
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { getSyncHistory, SyncRecord, saveSyncRecord } from "@/lib/syncStatus";
import { fullSync, syncService } from "@/lib/supabase/sync-service";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BottomSheet } from "@/components/ui/Modal";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Smartphone,
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
  User,
  Dumbbell,
  Droplets,
  HardDrive,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Nutri celebration component
const NutriSyncSuccess = ({ show, uploaded, downloaded }: { show: boolean; uploaded: number; downloaded: number }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 50 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full"
        >
          {/* Nutri Face */}
          <motion.div
            className="relative w-24 h-24 mx-auto mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1, repeat: 2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg" />
            {/* Eyes */}
            <motion.div
              className="absolute top-6 left-4 w-4 h-4 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.3, delay: 0.5, repeat: 1, repeatDelay: 1 }}
            >
              <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-gray-800 rounded-full" />
            </motion.div>
            <motion.div
              className="absolute top-6 right-4 w-4 h-4 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.3, delay: 0.5, repeat: 1, repeatDelay: 1 }}
            >
              <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-gray-800 rounded-full" />
            </motion.div>
            {/* Happy mouth */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-5 border-b-4 border-white rounded-b-full" />
            {/* Blush */}
            <div className="absolute top-11 left-2 w-3 h-1.5 bg-pink-300 rounded-full opacity-60" />
            <div className="absolute top-11 right-2 w-3 h-1.5 bg-pink-300 rounded-full opacity-60" />
            {/* Leaf */}
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-3 h-5 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full transform rotate-45" />
            </motion.div>
          </motion.div>

          {/* Cloud icon with checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <Cloud size={48} className="text-emerald-500" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check size={14} className="text-white" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-center text-gray-900 mb-2"
          >
            Sync Complete! 🎉
          </motion.h3>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-emerald-600">
              <Upload size={16} />
              <span>{uploaded} uploaded</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Download size={16} />
              <span>{downloaded} downloaded</span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-gray-500 text-sm mt-3"
          >
            Your data is safe in the cloud! ☁️
          </motion.p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function CloudSyncPage() {
  const router = useRouter();
  const { user, isConfigured, signIn, signOut, loading } = useAuth();
  const { dailyLogs, recipes, weightHistory, userProfile, dailyGoals } = useAppStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState({ uploaded: 0, downloaded: 0 });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

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

      // Record sync in history
      saveSyncRecord({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'full',
        status: result.success ? "success" : "failed",
        duration,
        details: {
          foodDiary: { uploaded: dataStats.diaryEntries, downloaded: result.downloaded || 0 },
          weightEntries: { uploaded: dataStats.weightEntries, downloaded: 0 },
          goals: { uploaded: dataStats.hasGoals, downloaded: 0 },
          recipes: { uploaded: dataStats.recipes, downloaded: 0 },
          profile: { synced: dataStats.hasProfile > 0 },
        },
      });

      if (result.success) {
        setLastSyncResult({
          uploaded: result.uploaded || 0,
          downloaded: result.downloaded || 0,
        });
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        setSyncError(result.message || "Sync failed");
      }

      // Refresh history
      const history = getSyncHistory();
      setSyncHistory(history);
    } catch (error: any) {
      setSyncError(error.message || "Sync failed");
      saveSyncRecord({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'full',
        status: "failed",
        duration: Date.now() - startTime,
        details: {
          foodDiary: { uploaded: 0, downloaded: 0 },
          weightEntries: { uploaded: 0, downloaded: 0 },
          goals: { uploaded: 0, downloaded: 0 },
          recipes: { uploaded: 0, downloaded: 0 },
          profile: { synced: false },
        },
        error: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (!result.error) {
      setShowLoginModal(false);
      setEmail("");
      setPassword("");
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

  if (loading) {
    return (
      <PageContainer>
        <Header title="Cloud Backup" showBack />
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
      <Header title="Cloud Backup" showBack />

      {/* Nutri Celebration */}
      <NutriSyncSuccess 
        show={showCelebration} 
        uploaded={lastSyncResult.uploaded} 
        downloaded={lastSyncResult.downloaded} 
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
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{syncError}</p>
                </div>
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

          {/* Your Data Summary */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">Your Data</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <HardDrive size={12} />
                <span>{totalItems} items</span>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Database size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Data to Backup</p>
                  <p className="text-sm text-gray-500">All your health data in one place</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Utensils size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{dataStats.diaryEntries}</p>
                    <p className="text-xs text-gray-500">Food Entries</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <ChefHat size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{dataStats.recipes}</p>
                    <p className="text-xs text-gray-500">Recipes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Scale size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{dataStats.weightEntries}</p>
                    <p className="text-xs text-gray-500">Weight Logs</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Target size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{dataStats.hasGoals ? "Set" : "—"}</p>
                    <p className="text-xs text-gray-500">Goals</p>
                  </div>
                </div>
              </div>

              {!isConnected && totalItems > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    You have <strong>{totalItems} items</strong> not backed up! Sign in to protect your data.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Why Backup?</p>
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center py-4">
                <Smartphone size={24} className="mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium text-gray-900">Multi-Device</p>
                <p className="text-xs text-gray-500">Access anywhere</p>
              </Card>
              <Card className="text-center py-4">
                <Shield size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-gray-900">Secure</p>
                <p className="text-xs text-gray-500">Encrypted data</p>
              </Card>
              <Card className="text-center py-4">
                <Cloud size={24} className="mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium text-gray-900">Auto Restore</p>
                <p className="text-xs text-gray-500">Never lose data</p>
              </Card>
              <Card className="text-center py-4">
                <RefreshCw size={24} className="mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium text-gray-900">Real-time</p>
                <p className="text-xs text-gray-500">Instant sync</p>
              </Card>
            </div>
          </motion.div>

          {/* Sync History */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500 font-medium">Sync History</p>
              <span className="text-xs text-gray-400">{syncHistory.length} syncs</span>
            </div>

            {syncHistory.length === 0 ? (
              <EmptyState
                icon={<Clock size={32} />}
                title="No sync history"
                description={isConnected ? "Tap Sync Now to backup your data" : "Sign in to start backing up"}
              />
            ) : (
              <div className="space-y-2">
                {syncHistory.slice(0, 5).map((record) => (
                  <Card key={record.id} padding="sm">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedRecord(
                        expandedRecord === record.id ? null : record.id
                      )}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        record.status === "success" ? "bg-emerald-100" : "bg-red-100"
                      }`}>
                        {record.status === "success" ? (
                          <Check size={18} className="text-emerald-600" />
                        ) : (
                          <AlertCircle size={18} className="text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {record.status === "success" ? "Backup Complete" : "Backup Failed"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(record.timestamp)}
                        </p>
                      </div>
                      {expandedRecord === record.id ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>

                    {expandedRecord === record.id && record.details && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-gray-100"
                      >
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(record.details || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-gray-900 font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                        {record.duration && (
                          <p className="text-xs text-gray-400 mt-2">
                            Duration: {(record.duration / 1000).toFixed(1)}s
                          </p>
                        )}
                      </motion.div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Login Modal */}
      <BottomSheet
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign In to Backup"
      >
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
              <Cloud size={32} className="text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500">
              Sign in to securely backup your {totalItems} items to the cloud
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <Button fullWidth onClick={handleLogin}>
            <LogIn size={18} className="mr-2" />
            Sign In & Backup
          </Button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button className="text-emerald-600 font-medium">Sign Up</button>
          </p>
        </div>
      </BottomSheet>

      <BottomNav />
    </PageContainer>
  );
}
