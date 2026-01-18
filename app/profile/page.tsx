"use client";

import { motion } from "framer-motion";
import {
  User,
  Settings,
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  Trash2,
  Cloud
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { analysisHistory, userProfile, aiSettings, clearHistory } = useAppStore();
    const { user, isConfigured } = useAuth();
  const cloudConnected = !!(user && isConfigured);

  const totalScans = analysisHistory.length;
  const avgScore = totalScans > 0
    ? Math.round(analysisHistory.reduce((sum, a) => sum + a.healthScore, 0) / totalScans)
    : 0;
  const healthyCount = analysisHistory.filter(a => a.verdict === "healthy").length;

  const getProviderInfo = () => {
    switch (aiSettings.provider) {
      case "gemini":
        return { name: "Google Gemini", icon: Sparkles, color: "text-blue-500", hasKey: !!aiSettings.geminiApiKey };
      case "openai":
        return { name: "OpenAI GPT-4o", icon: Zap, color: "text-emerald-500", hasKey: !!aiSettings.openaiApiKey };
      default:
        return { name: "Demo Mode", icon: Eye, color: "text-gray-500", hasKey: true };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <div className="app-container">
      <div className="main-content hide-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 safe-top">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {userProfile.name || "Food Explorer"}
              </h1>
              <p className="text-green-100">Health-conscious eater</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 -mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{totalScans}</p>
                <p className="text-xs text-gray-500">Total Scans</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{avgScore}</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{healthyCount}</p>
                <p className="text-xs text-gray-500">Healthy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* API Settings Card */}
        <div className="px-4 pb-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push("/settings")}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <providerInfo.icon className={`w-6 h-6 ${providerInfo.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI Provider</p>
                  <p className="font-semibold text-gray-800">{providerInfo.name}</p>
                  {!providerInfo.hasKey && aiSettings.provider !== "demo" && (
                    <p className="text-xs text-orange-500">⚠️ API key not set</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.button>
        </div>

        {/* Cloud Sync Card */}
        <div className="px-4 pb-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push("/cloud-sync")}
            className={`w-full rounded-2xl p-4 border text-left ${
              cloudConnected 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <Cloud className={`w-6 h-6 ${cloudConnected ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cloud Backup</p>
                  <p className="font-semibold text-gray-800">
                    {cloudConnected ? 'Connected' : 'Not Connected'}
                  </p>
                  {!cloudConnected && (
                    <p className="text-xs text-blue-500">Tap to set up sync</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.button>
        </div>

        {/* Menu Items */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Settings</h2>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push("/settings")}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">API Settings</p>
                <p className="text-sm text-gray-500">Choose AI provider & API keys</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => router.push("/cloud-sync")}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Cloud Sync</p>
                <p className="text-sm text-gray-500">Backup & sync your data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              if (confirm("Are you sure you want to clear all scan history?")) {
                clearHistory();
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Clear History</p>
                <p className="text-sm text-gray-500">Delete all scan records</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        </div>

        {/* App Info */}
        <div className="p-4 mt-6">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">🥗</p>
            <p className="font-semibold text-gray-800">FitFork</p>
            <p className="text-sm text-gray-500">Version 1.1.0</p>
            <p className="text-xs text-gray-400 mt-2">
              AI-powered food health analysis
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
