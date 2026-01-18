"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { ListItem, ListGroup } from "@/components/ui/ListItem";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Target,
  Scale,
  TrendingUp,
  Settings,
  Cloud,
  Award,
  Calendar,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, dailyGoals, getDailyTotals } = useAppStore();
  const { user, isConfigured } = useAuth();
  const [streak, setStreak] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyTotals = getDailyTotals(todayStr);

  useEffect(() => {
    // Calculate streak (simplified)
    const savedStreak = localStorage.getItem("fitfork_streak");
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const isCloudConnected = user && isConfigured;

  const stats = [
    { label: "Current Streak", value: `${streak} days`, icon: Flame, color: "text-orange-500" },
    { label: "Calories Today", value: Math.round(dailyTotals.calories).toString(), icon: Zap, color: "text-emerald-500" },
    { label: "Goal Progress", value: `${Math.round((dailyTotals.calories / dailyGoals.calories) * 100)}%`, icon: Target, color: "text-blue-500" },
  ];

  return (
    <PageContainer>
      {/* Profile Header */}
      <div className="bg-white">
        <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {userProfile.name || "Your Profile"}
              </h1>
              <p className="text-sm text-gray-500">
                {user?.email || "Set up your profile"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Stats Row */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center py-4">
                    <Icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Cloud Sync Status */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card onClick={() => router.push("/cloud-sync")}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isCloudConnected ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  <Cloud size={24} className={isCloudConnected ? "text-emerald-600" : "text-gray-400"} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Cloud Backup</p>
                  <p className="text-sm text-gray-500">
                    {isCloudConnected ? "Connected & syncing" : "Not connected"}
                  </p>
                </div>
                <Badge variant={isCloudConnected ? "success" : "default"}>
                  {isCloudConnected ? "Active" : "Setup"}
                </Badge>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            </Card>
          </motion.div>

          {/* Menu Items */}
          <motion.div variants={fadeUp}>
            <ListGroup title="Health & Goals" className="mb-6">
              <ListItem
                icon={<Target size={20} />}
                title="Nutrition Goals"
                subtitle="Calories, macros, and more"
                showArrow
                onClick={() => router.push("/goals")}
              />
              <ListItem
                icon={<Scale size={20} />}
                title="Weight Tracking"
                subtitle="Log and track your weight"
                showArrow
                onClick={() => router.push("/weight")}
              />
              <ListItem
                icon={<TrendingUp size={20} />}
                title="Progress & Stats"
                subtitle="View your journey"
                showArrow
                onClick={() => router.push("/progress")}
              />
            </ListGroup>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ListGroup title="Account" className="mb-6">
              <ListItem
                icon={<User size={20} />}
                title="Edit Profile"
                subtitle="Name, email, preferences"
                showArrow
                onClick={() => router.push("/profile/edit")}
              />
              <ListItem
                icon={<Settings size={20} />}
                title="Settings"
                subtitle="App preferences"
                showArrow
                onClick={() => router.push("/settings")}
              />
            </ListGroup>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-gray-900">Achievements</p>
                <button className="text-sm text-emerald-600 font-medium">
                  View all
                </button>
              </div>
              <div className="flex gap-3">
                {["🔥", "💪", "🎯", "⭐"].map((emoji, index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      index < 2 ? "bg-amber-100" : "bg-gray-100 opacity-50"
                    }`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      <BottomNav />
    </PageContainer>
  );
}
