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
import { AIProvider } from "@/lib/ai-vision";

const AI_PROVIDERS = [
  {
    id: "demo" as AIProvider,
    name: "Demo Mode",
    description: "Try the app with sample data",
    icon: Eye,
    color: "bg-gray-500",
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
    color: "bg-blue-500",
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
    color: "bg-emerald-500",
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
      <div className="main-content hide-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 safe-top">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">AI Settings</h1>
              <p className="text-green-100 text-sm">Choose your food recognition AI</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Current Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${selectedProvider?.color} rounded-xl flex items-center justify-center`}>
                {selectedProvider && <selectedProvider.icon className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Currently using</p>
                <p className="font-semibold text-gray-800">{selectedProvider?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="font-medium text-green-600">{selectedProvider?.accuracy}</p>
              </div>
            </div>
          </motion.div>

          {/* Provider Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Select AI Provider</h2>
            <div className="space-y-3">
              {AI_PROVIDERS.map((provider, index) => (
                <motion.button
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                    aiSettings.provider === provider.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 ${provider.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <provider.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                        {provider.recommended && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{provider.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">Cost: <span className="text-gray-600 font-medium">{provider.cost}</span></span>
                        <span className="text-xs text-gray-400">Accuracy: <span className="text-gray-600 font-medium">{provider.accuracy}</span></span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      aiSettings.provider === provider.id
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}>
                      {aiSettings.provider === provider.id && (
                        <Check className="w-4 h-4 text-white" />
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
              <h2 className="text-lg font-semibold text-gray-800">API Key Configuration</h2>
              
              {/* Gemini Key */}
              {aiSettings.provider === "gemini" && (
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-medium text-gray-700">Gemini API Key</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      Get free key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Stored locally on your device only
                  </p>
                </div>
              )}

              {/* OpenAI Key */}
              {aiSettings.provider === "openai" && (
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-medium text-gray-700">OpenAI API Key</label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      Get key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Stored locally on your device only
                  </p>
                </div>
              )}

              {/* Save Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveKeys}
                className="w-full py-4 bg-green-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
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
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Recipe API Keys</h2>
            </div>
            
            <div className="space-y-4">
              {/* Spoonacular Key */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-medium text-gray-700">Spoonacular API Key</label>
                  <a
                    href="https://spoonacular.com/food-api/console#Dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 flex items-center gap-1"
                  >
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={spoonacularKey}
                  onChange={(e) => setSpoonacularKey(e.target.value)}
                  placeholder="Enter Spoonacular API key..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-2">Optional - enables Spoonacular recipe search (150 free requests/day)</p>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveKeys}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
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
              className="bg-gray-50 rounded-2xl p-4"
            >
              <h3 className="font-medium text-gray-700 mb-3">Features</h3>
              <ul className="space-y-2">
                {selectedProvider.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Cloud Sync Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/cloud-sync')}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">Cloud Sync</h2>
                <p className="text-gray-500 text-sm">Backup & sync across devices</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">💡 How to get started</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Select your preferred AI provider above</li>
              <li>Click the link to get your free API key</li>
              <li>Paste the key and tap Save</li>
              <li>Start scanning food!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
