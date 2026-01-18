"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getSyncHistory, SyncRecord } from "@/lib/syncStatus";
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
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function CloudSyncPage() {
  const router = useRouter();
  const { user, isConfigured, signIn, signOut, loading } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const isConnected = user && isConfigured;

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
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    
    // Refresh history
    const history = getSyncHistory();
    setSyncHistory(history);
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
        <Header title="Cloud Sync" showBack />
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
      <Header title="Cloud Sync" showBack />

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
                      : "Sign in to sync your data"}
                  </p>
                </div>
                <Badge variant={isConnected ? "success" : "default"}>
                  {isConnected ? "Active" : "Offline"}
                </Badge>
              </div>

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
                    Sign In
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Features</p>
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center py-4">
                <Smartphone size={24} className="mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium text-gray-900">Multi-Device</p>
                <p className="text-xs text-gray-500">Sync across devices</p>
              </Card>
              <Card className="text-center py-4">
                <Shield size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-gray-900">Secure</p>
                <p className="text-xs text-gray-500">End-to-end encrypted</p>
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
                description={isConnected ? "Tap Sync Now to start" : "Sign in to sync your data"}
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
                          {record.status === "success" ? "Sync Complete" : "Sync Failed"}
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
                              <span className="text-gray-500 capitalize">{key}</span>
                              <span className="text-gray-900">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                        {record.duration && (
                          <p className="text-xs text-gray-400 mt-2">
                            Duration: {record.duration}ms
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
        title="Sign In"
      >
        <div className="space-y-4">
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
            Sign In
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
