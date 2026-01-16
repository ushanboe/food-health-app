"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Utensils,
  Settings,
  Sparkles,
  Zap,
  Eye,
  Check,
  ExternalLink,
  Shield,
  ChevronRight,
  ArrowLeft,
  Cloud
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import FitnessConnections from "@/components/fitness/FitnessConnections";
import { FloatingNutri } from "@/components/FloatingNutri";
import { AIProvider } from "@/lib/ai-vision";

const AI_PROVIDERS = [
  {
    id: "demo" as AIProvider,
    name: "Demo Mode",
    description: "Try the app with sample data",
    icon: Eye,
    color: "bg-gradient-to-br from-gray-400 to-gray-600",
    cost: "Free",
    accuracy: "N/A",
    features: ["No API key needed", "Random sample foods", "Test app features"],
    setupUrl: null,
  },
  {
    id: "gemini" as AIProvider,
    name: "Google Gemini",
    description: "Fast & accurate, generous free tier",
    icon: Sparkles,
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    cost: "Free",
    accuracy: "~90%",
    features: ["15 requests/minute free", "1,500 requests/day", "No credit card needed"],
    setupUrl: "https://aistudio.google.com/app/apikey",
    recommended: true,
  },
  {
    id: "openai" as AIProvider,
    name: "OpenAI GPT-4o",
    description: "Best accuracy, pay per use",
    icon: Zap,
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    cost: "~$0.01/scan",
    accuracy: "~95%",
    features: ["Highest accuracy", "Best for complex dishes", "Reads food labels"],
    setupUrl: "https://platform.openai.com/api-keys",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { aiSettings, updateAISettings } = useAppStore();
  const [geminiKey, setGeminiKey] = useState(aiSettings.geminiApiKey);
  const [openaiKey, setOpenaiKey] = useState(aiSettings.openaiApiKey);
  const [spoonacularKey, setSpoonacularKey] = useState(aiSettings.spoonacularApiKey);
  const [saved, setSaved] = useState(false);

  const handleProviderSelect = (providerId: AIProvider) => {
    updateAISettings({ provider: providerId });
  };

  const handleSaveKeys = () => {
    updateAISettings({
      geminiApiKey: geminiKey,
      openaiApiKey: openaiKey,
      spoonacularApiKey: spoonacularKey,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.id === aiSettings.provider);

  return (
    <div className="app-container">
      {/* Floating Nutri mascot */}
      <FloatingNutri interval={20} duration={6} position="bottom-right" />
      
      <div className="main-content hide-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white p-6 safe-top">
          <div className="flex items-center gap-4 mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
              <p className="text-green-50 text-sm font-medium mt-1">Configure your food recognition & recipes</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6 pb-24">
          {/* Current Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-5 border-2 border-green-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${selectedProvider?.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                {selectedProvider && <selectedProvider.icon className="w-7 h-7 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currently Active</p>
                <p className="font-bold text-gray-900 text-lg">{selectedProvider?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accuracy</p>
                <p className="font-bold text-green-600 text-lg">{selectedProvider?.accuracy}</p>
              </div>
            </div>
          </motion.div>

          {/* Provider Selection */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">AI Provider</h2>
            <div className="space-y-3">
              {AI_PROVIDERS.map((provider, index) => (
                <motion.button
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`w-full p-5 rounded-3xl border-2 transition-all text-left shadow-sm ${
                    aiSettings.provider === provider.id
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${provider.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <provider.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{provider.name}</h3>
                        {provider.recommended && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            ⭐ Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium mb-3">{provider.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-500">Cost: <span className="text-gray-900">{provider.cost}</span></span>
                        <span className="text-xs font-semibold text-gray-500">Accuracy: <span className="text-gray-900">{provider.accuracy}</span></span>
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      aiSettings.provider === provider.id
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}>
                      {aiSettings.provider === provider.id && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* API Key Configuration */}
          {aiSettings.provider !== "demo" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">API Key Configuration</h2>
              
              {/* Gemini Key */}
              {aiSettings.provider === "gemini" && (
                <div className="bg-white rounded-3xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <label className="font-bold text-gray-900 text-base">Gemini API Key</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 flex items-center gap-1.5 hover:text-blue-700"
                    >
                      Get free key <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5 font-medium">
                    <Shield className="w-4 h-4" /> Stored locally on your device only
                  </p>
                </div>
              )}

              {/* OpenAI Key */}
              {aiSettings.provider === "openai" && (
                <div className="bg-white rounded-3xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <label className="font-bold text-gray-900 text-base">OpenAI API Key</label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 flex items-center gap-1.5 hover:text-blue-700"
                    >
                      Get key <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5 font-medium">
                    <Shield className="w-4 h-4" /> Stored locally on your device only
                  </p>
                </div>
              )}

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveKeys}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg text-base"
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved Successfully!
                  </>
                ) : (
                  "Save API Key"
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Recipe API Keys */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recipe API</h2>
            </div>
            
            <div className="space-y-4">
              {/* Spoonacular Key */}
              <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-bold text-gray-900 text-base">Spoonacular API Key</label>
                  <a
                    href="https://spoonacular.com/food-api/console#Dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-teal-600 flex items-center gap-1.5 hover:text-teal-700"
                  >
                    Get key <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <input
                  type="password"
                  value={spoonacularKey}
                  onChange={(e) => setSpoonacularKey(e.target.value)}
                  placeholder="Enter Spoonacular API key..."
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-3 font-medium">Optional - enables recipe search (150 free requests/day)</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveKeys}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  "Save Recipe API Key"
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Features List */}
          {selectedProvider && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-5 border-2 border-gray-200"
            >
              <h3 className="font-bold text-gray-900 mb-4 text-lg">✨ Features</h3>
              <ul className="space-y-3">
                {selectedProvider.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Fitness Connections Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100"
          >
            <FitnessConnections />
          </motion.div>

          {/* Cloud Sync Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/cloud-sync')}
            className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cloud Sync</h2>
                <p className="text-gray-600 text-sm font-medium mt-0.5">Backup & sync across devices</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </motion.div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">💡 Quick Start Guide</h3>
            <ol className="text-sm text-blue-800 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>Select your preferred AI provider above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>Click the link to get your free API key</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Paste the key and tap Save</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>Start scanning food!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
