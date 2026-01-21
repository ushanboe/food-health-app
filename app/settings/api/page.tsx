"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import {
  Key,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Utensils,
  ThumbsUp,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

interface ApiConfig {
  openaiKey: string;
  spoonacularKey: string;
}

// Floating Nutri mascot that floats past when saving
const NutriCelebration = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: [null, window.innerWidth / 2 - 40, window.innerWidth + 100], opacity: [0, 1, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2.5, ease: "easeInOut", times: [0, 0.3, 0.8, 1] }}
        className="fixed top-1/3 z-50 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -15, 0, -10, 0], rotate: [0, -5, 5, -3, 0] }}
          transition={{ duration: 1.2, repeat: 2, ease: "easeInOut" }}
          className="relative"
        >
          {/* Nutri Face */}
          <div className="relative w-20 h-20">
            {/* Face background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg" />

            {/* Eyes */}
            <motion.div
              className="absolute top-5 left-3.5 w-3.5 h-3.5 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, delay: 0.4, repeat: 2, repeatDelay: 0.6 }}
            >
              <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-gray-800 rounded-full" />
            </motion.div>
            <motion.div
              className="absolute top-5 right-3.5 w-3.5 h-3.5 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, delay: 0.4, repeat: 2, repeatDelay: 0.6 }}
            >
              <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-gray-800 rounded-full" />
            </motion.div>

            {/* Happy mouth */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-4 border-b-[3px] border-white rounded-b-full" />

            {/* Blush */}
            <div className="absolute top-9 left-2 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-60" />
            <div className="absolute top-9 right-2 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-60" />

            {/* Leaf on top */}
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <div className="w-3 h-4 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full transform rotate-45" />
            </motion.div>
          </div>

          {/* Sparkles around Nutri */}
          <motion.div
            className="absolute -top-2 -right-2 text-yellow-400"
            animate={{ scale: [0, 1, 0], rotate: [0, 180] }}
            transition={{ duration: 0.6, repeat: 3, repeatDelay: 0.3 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute -bottom-1 -left-2 text-yellow-400"
            animate={{ scale: [0, 1, 0], rotate: [0, -180] }}
            transition={{ duration: 0.6, delay: 0.2, repeat: 3, repeatDelay: 0.3 }}
          >
            ✨
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ApiSettingsPage() {
  const router = useRouter();
  const { aiSettings, updateAISettings } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<ApiConfig>({
    openaiKey: "",
    spoonacularKey: "",
  });
  const [status, setStatus] = useState<Record<string, "valid" | "invalid" | "unchecked">>({
    openaiKey: "unchecked",
    spoonacularKey: "unchecked",
  });

  useEffect(() => {
    // Load from app store (aiSettings) - this is the source of truth
    setConfig({
      openaiKey: aiSettings.openaiApiKey || "",
      spoonacularKey: aiSettings.spoonacularApiKey || "",
    });

    // Update status based on existing values
    setStatus({
      openaiKey: aiSettings.openaiApiKey ? "valid" : "unchecked",
      spoonacularKey: aiSettings.spoonacularApiKey ? "valid" : "unchecked",
    });

    // Check if any APIs are already saved
    const hasAnySaved = aiSettings.openaiApiKey || aiSettings.spoonacularApiKey;
    if (hasAnySaved) {
      setSaved(true);
    }
  }, [aiSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update the app store - this is the main storage
      updateAISettings({
        openaiApiKey: config.openaiKey,
        spoonacularApiKey: config.spoonacularKey,
      });

      // Also save to legacy localStorage for backward compatibility
      localStorage.setItem("fitfork_api_config", JSON.stringify(config));

      // Update status
      const newStatus: Record<string, "valid" | "invalid" | "unchecked"> = {
        openaiKey: config.openaiKey ? "valid" : "unchecked",
        spoonacularKey: config.spoonacularKey ? "valid" : "unchecked",
      };
      setStatus(newStatus);

      // Show celebration
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowCelebration(true);
      setSaved(true);

      // Hide celebration after 2.5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 2500);

    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count configured APIs
  const configuredCount = [
    config.openaiKey,
    config.spoonacularKey,
  ].filter(Boolean).length;

  const ApiKeyInput = ({
    id,
    label,
    description,
    icon: Icon,
    iconColor,
    placeholder,
    helpUrl,
    helpText,
  }: {
    id: keyof ApiConfig;
    label: string;
    description: string;
    icon: any;
    iconColor: string;
    placeholder: string;
    helpUrl?: string;
    helpText?: string;
  }) => (
    <Card className="mb-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{label}</p>
            <Badge variant={status[id] === "valid" ? "success" : status[id] === "invalid" ? "error" : "default"}>
              {status[id] === "valid" ? "Configured" : status[id] === "invalid" ? "Invalid" : "Not Set"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="relative">
        <input
          type={showKeys[id] ? "text" : "password"}
          value={config[id]}
          onChange={(e) => {
            setConfig({ ...config, [id]: e.target.value });
            setSaved(false); // Reset saved state when editing
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => toggleShowKey(id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showKeys[id] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {helpUrl && (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-emerald-600 mt-2 hover:underline"
        >
          <ExternalLink size={14} />
          {helpText || "Get API Key"}
        </a>
      )}
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader icon={Key} title="API Settings" subtitle="Configure your integrations" />

      {/* Nutri Celebration Overlay */}
      <NutriCelebration show={showCelebration} />

      <PageContent>
        <motion.div initial="initial" animate="animate">
          {/* Info Banner */}
          <motion.div variants={fadeUp}>
            <Card className={`mb-6 ${saved ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"}`}>
              <div className="flex gap-3">
                {saved ? (
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${saved ? "text-emerald-800" : "text-blue-800"}`}>
                    {saved ? `${configuredCount} API(s) Configured! ✨` : "API Keys Required"}
                  </p>
                  <p className={`text-sm mt-1 ${saved ? "text-emerald-600" : "text-blue-600"}`}>
                    {saved
                      ? "Your API keys are saved and ready to use."
                      : "Configure your API keys to enable AI food analysis and nutrition data features."
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* AI Vision API */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">AI Food Analysis</p>
            <ApiKeyInput
              id="openaiKey"
              label="OpenAI API Key"
              description="Powers AI food recognition and analysis"
              icon={Sparkles}
              iconColor="bg-gradient-to-br from-purple-500 to-pink-500"
              placeholder="sk-..."
              helpUrl="https://platform.openai.com/api-keys"
              helpText="Get OpenAI API Key"
            />
          </motion.div>

          {/* Nutrition API */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Nutrition Data</p>
            <ApiKeyInput
              id="spoonacularKey"
              label="Spoonacular API Key"
              description="Provides detailed nutrition information"
              icon={Utensils}
              iconColor="bg-gradient-to-br from-orange-500 to-red-500"
              placeholder="Enter your Spoonacular API key"
              helpUrl="https://spoonacular.com/food-api/console#Dashboard"
              helpText="Get Spoonacular API Key"
            />
          </motion.div>

          {/* Save Button */}
          <motion.div variants={fadeUp} className="mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`w-full transition-all duration-300 ${
                saved
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                  : ""
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saved ? (
                <motion.span
                  className="flex items-center justify-center gap-2"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <CheckCircle size={18} />
                  API(s) Saved ✨
                </motion.span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save size={18} />
                  Save API Settings
                </span>
              )}
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.div variants={fadeUp} className="mt-6">
            <Card className="bg-gray-50">
              <div className="flex gap-3">
                <ThumbsUp size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Your keys are stored locally</p>
                  <p className="text-sm text-gray-500 mt-1">
                    API keys are saved securely on your device and never sent to our servers.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
