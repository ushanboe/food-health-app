"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  PageWrapper,
  Card3D,
  Button3D,
  StatCard,
  SectionHeader,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { analysisHistory, userProfile, aiSettings, clearHistory, dailyLogs } = useAppStore();
  const { user, isConfigured } = useAuth();
  const cloudConnected = !!(user && isConfigured);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalScans = analysisHistory.length;
  const avgScore = totalScans > 0
    ? Math.round(analysisHistory.reduce((sum, a) => sum + a.healthScore, 0) / totalScans)
    : 0;
  const healthyCount = analysisHistory.filter(a => a.verdict === "healthy").length;
  const totalMeals = dailyLogs.reduce((sum, log) => sum + (log.meals?.length || 0), 0);

  const getProviderInfo = () => {
    switch (aiSettings.provider) {
      case "gemini":
        return { name: "Google Gemini", icon: "✨", color: "blue", hasKey: !!aiSettings.geminiApiKey };
      case "openai":
        return { name: "OpenAI GPT-4o", icon: "⚡", color: "green", hasKey: !!aiSettings.openaiApiKey };
      default:
        return { name: "Demo Mode", icon: "👁️", color: "purple", hasKey: true };
    }
  };

  const providerInfo = getProviderInfo();

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasLog = dailyLogs.some(log => log.date === dateStr && log.meals && log.meals.length > 0);
      if (hasLog) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const streak = calculateStreak();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Profile Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar */}
          <motion.div
            className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-4xl">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "👤"}
            </div>
          </motion.div>
          
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {userProfile.name || "Food Explorer"}
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Health-conscious eater
          </motion.p>

          {/* Streak Badge */}
          {streak > 0 && (
            <motion.div
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-xl">🔥</span>
              <span className="text-amber-400 font-semibold">{streak} day streak!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon="📊"
            label="Total Scans"
            value={totalScans}
            color="purple"
            onClick={() => { hapticLight(); router.push('/history'); }}
          />
          <StatCard
            icon="💚"
            label="Avg Score"
            value={avgScore}
            subValue="/ 100"
            color="green"
          />
          <StatCard
            icon="🥗"
            label="Healthy Picks"
            value={healthyCount}
            color="blue"
          />
          <StatCard
            icon="🍽️"
            label="Meals Logged"
            value={totalMeals}
            color="orange"
            onClick={() => { hapticLight(); router.push('/diary'); }}
          />
        </div>

        {/* AI Provider Card */}
        <SectionHeader title="AI Provider" icon="🤖" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D
            variant="glass"
            onClick={() => { hapticLight(); router.push('/settings'); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
                  {providerInfo.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{providerInfo.name}</p>
                  <p className="text-sm text-gray-400">
                    {providerInfo.hasKey ? "✓ Configured" : "⚠️ API key needed"}
                  </p>
                </div>
              </div>
              <span className="text-gray-500">→</span>
            </div>
          </Card3D>
        </motion.div>

        {/* Cloud Sync Card */}
        <SectionHeader title="Cloud Sync" icon="☁️" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D
            variant={cloudConnected ? "luxury" : "glass"}
            glowColor={cloudConnected ? "rgba(16, 185, 129, 0.3)" : "rgba(168, 85, 247, 0.2)"}
            onClick={() => { hapticLight(); router.push('/cloud-sync'); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  cloudConnected 
                    ? 'bg-gradient-to-br from-emerald-600 to-green-600' 
                    : 'bg-gradient-to-br from-gray-700 to-gray-800'
                }`}>
                  {cloudConnected ? "✅" : "☁️"}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {cloudConnected ? "Connected" : "Not Connected"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {cloudConnected ? "Data synced to cloud" : "Tap to set up backup"}
                  </p>
                </div>
              </div>
              <span className="text-gray-500">→</span>
            </div>
          </Card3D>
        </motion.div>

        {/* Quick Links */}
        <SectionHeader title="Quick Links" icon="⚡" />
        <div className="space-y-3 mb-6">
          {[
            { icon: "⚙️", label: "Settings", desc: "App preferences", path: "/settings" },
            { icon: "🎯", label: "Goals", desc: "Nutrition targets", path: "/goals" },
            { icon: "⚖️", label: "Weight", desc: "Track progress", path: "/weight" },
            { icon: "📖", label: "Recipes", desc: "Meal ideas", path: "/recipes" },
            { icon: "📜", label: "History", desc: "Past scans", path: "/history" },
          ].map((item, index) => (
            <motion.div
              key={item.path}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.05 }}
            >
              <Card3D
                variant="glass"
                intensity="subtle"
                onClick={() => { hapticLight(); router.push(item.path); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-gray-500">→</span>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Danger Zone */}
        <SectionHeader title="Data Management" icon="⚠️" />
        <Card3D variant="glass" className="border-red-500/20">
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Clear all your scan history and start fresh. This action cannot be undone.
            </p>
            <Button3D
              variant="danger"
              fullWidth
              icon="🗑️"
              onClick={() => {
                if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
                  hapticSuccess();
                  clearHistory();
                }
              }}
            >
              Clear All History
            </Button3D>
          </div>
        </Card3D>
      </div>

      <BottomNavV2 />
    </PageWrapper>
  );
}
