"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import FitnessConnections from "@/components/fitness/FitnessConnections";
import {
  PageWrapper,
  Card3D,
  Button3D,
  SectionHeader,
  BottomNavV2,
  staggerItem,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/components/ui";

type AIProvider = "demo" | "gemini" | "openai";

const providerOptions: { id: AIProvider; name: string; icon: string; desc: string; color: string }[] = [
  { id: "demo", name: "Demo Mode", icon: "👁️", desc: "Try without API key", color: "from-gray-500 to-gray-600" },
  { id: "gemini", name: "Google Gemini", icon: "✨", desc: "Fast & accurate", color: "from-blue-500 to-cyan-500" },
  { id: "openai", name: "OpenAI GPT-4o", icon: "⚡", desc: "Most capable", color: "from-emerald-500 to-green-500" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  const {
    aiSettings,
    updateAISettings,
    userProfile,
    updateUserProfile,
    dailyGoals,
    updateDailyGoals,
  } = useAppStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleProviderSelect = (provider: AIProvider) => {
    hapticMedium();
    updateAISettings({ provider });
    if (provider !== "demo") {
      const currentKey = provider === "gemini" ? aiSettings.geminiApiKey : aiSettings.openaiApiKey;
      setTempApiKey(currentKey || "");
      setShowApiKeyModal(true);
    }
  };

  const handleSaveApiKey = () => {
    hapticSuccess();
    if (aiSettings.provider === "gemini") {
      updateAISettings({ geminiApiKey: tempApiKey });
    } else if (aiSettings.provider === "openai") {
      updateAISettings({ openaiApiKey: tempApiKey });
    }
    setShowApiKeyModal(false);
  };

  const currentProvider = providerOptions.find(p => p.id === aiSettings.provider) || providerOptions[0];
  const hasApiKey = aiSettings.provider === "demo" || 
    (aiSettings.provider === "gemini" && !!aiSettings.geminiApiKey) ||
    (aiSettings.provider === "openai" && !!aiSettings.openaiApiKey);

  return (
    <PageWrapper className="pb-24">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            ⚙️ Settings
          </h1>
          <p className="text-gray-400 mt-1">Customize your experience</p>
        </motion.div>

        {/* AI Provider Section */}
        <SectionHeader title="AI Provider" icon="🤖" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="luxury" glowColor="rgba(168, 85, 247, 0.3)">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentProvider.color} flex items-center justify-center text-2xl shadow-lg`}>
                {currentProvider.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{currentProvider.name}</h3>
                <p className="text-sm text-gray-400">
                  {hasApiKey ? "✓ Configured" : "⚠️ API key needed"}
                </p>
              </div>
              {aiSettings.provider !== "demo" && (
                <Button3D
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempApiKey(
                      aiSettings.provider === "gemini" 
                        ? aiSettings.geminiApiKey || "" 
                        : aiSettings.openaiApiKey || ""
                    );
                    setShowApiKeyModal(true);
                  }}
                >
                  Edit
                </Button3D>
              )}
            </div>

            {/* Provider Options */}
            <div className="grid grid-cols-3 gap-2">
              {providerOptions.map((provider) => (
                <motion.button
                  key={provider.id}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    aiSettings.provider === provider.id
                      ? `bg-gradient-to-br ${provider.color} shadow-lg`
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => handleProviderSelect(provider.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl">{provider.icon}</span>
                  <span className="text-xs text-white font-medium">{provider.name.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </Card3D>
        </motion.div>

        {/* Fitness Connections */}
        <SectionHeader title="Fitness Connections" icon="💪" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="glass">
            <FitnessConnections />
          </Card3D>
        </motion.div>

        {/* User Profile */}
        <SectionHeader title="Profile" icon="👤" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="glass">
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={userProfile.name || ""}
                  onChange={(e) => updateUserProfile({ name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Health Goals</label>
                <p className="text-gray-500 text-sm">{userProfile.healthGoals?.join(", ") || "Not set"}</p>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* Daily Goals */}
        <SectionHeader title="Daily Goals" icon="🎯" />
        <motion.div variants={staggerItem} initial="initial" animate="animate" className="mb-6">
          <Card3D variant="glass">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Calories</label>
                <input
                  type="number"
                  value={dailyGoals?.calories || ""}
                  onChange={(e) => updateDailyGoals({ calories: parseInt(e.target.value) || 2000 })}
                  placeholder="2000"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Carbs (g)</label>
                <input
                  type="number"
                  value={dailyGoals?.carbs || ""}
                  onChange={(e) => updateDailyGoals({ carbs: parseInt(e.target.value) || 250 })}
                  placeholder="250"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Protein (g)</label>
                <input
                  type="number"
                  value={dailyGoals?.protein || ""}
                  onChange={(e) => updateDailyGoals({ protein: parseInt(e.target.value) || 150 })}
                  placeholder="150"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Fat (g)</label>
                <input
                  type="number"
                  value={dailyGoals?.fat || ""}
                  onChange={(e) => updateDailyGoals({ fat: parseInt(e.target.value) || 65 })}
                  placeholder="65"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* App Info */}
        <SectionHeader title="About" icon="ℹ️" />
        <Card3D variant="glass">
          <div className="text-center">
            <span className="text-4xl mb-2 block">🍴</span>
            <h3 className="font-bold text-white text-lg">FitFork</h3>
            <p className="text-gray-400 text-sm">Version 2.0</p>
            <p className="text-gray-500 text-xs mt-2">AI-powered nutrition tracking</p>
          </div>
        </Card3D>
      </div>

      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowApiKeyModal(false)}
            />
            <motion.div
              className="relative w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {aiSettings.provider === "gemini" ? "✨ Gemini API Key" : "⚡ OpenAI API Key"}
              </h2>
              
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
              />
              
              <p className="text-gray-400 text-sm mb-4">
                {aiSettings.provider === "gemini" 
                  ? "Get your key from Google AI Studio"
                  : "Get your key from OpenAI Platform"
                }
              </p>
              
              <div className="flex gap-3">
                <Button3D
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  fullWidth
                  onClick={handleSaveApiKey}
                >
                  Save Key
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavV2 />
    </PageWrapper>
  );
}
