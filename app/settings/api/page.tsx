
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
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
  Cloud,
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
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Nutri mascot component with thumbs up
const NutriCelebration = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 50 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center"
        >
          {/* Nutri Face */}
          <motion.div
            className="relative w-32 h-32 mb-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: 2, ease: "easeInOut" }}
          >
            {/* Face background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg" />

            {/* Eyes */}
            <motion.div
              className="absolute top-8 left-6 w-5 h-5 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.3, delay: 0.5, repeat: 1, repeatDelay: 1 }}
            >
              <div className="absolute top-1 left-1 w-3 h-3 bg-gray-800 rounded-full" />
            </motion.div>
            <motion.div
              className="absolute top-8 right-6 w-5 h-5 bg-white rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.3, delay: 0.5, repeat: 1, repeatDelay: 1 }}
            >
              <div className="absolute top-1 left-1 w-3 h-3 bg-gray-800 rounded-full" />
            </motion.div>

            {/* Happy mouth */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-6 border-b-4 border-white rounded-b-full" />

            {/* Blush */}
            <div className="absolute top-14 left-3 w-4 h-2 bg-pink-300 rounded-full opacity-60" />
            <div className="absolute top-14 right-3 w-4 h-2 bg-pink-300 rounded-full opacity-60" />

            {/* Leaf on top */}
            <motion.div
              className="absolute -top-3 left-1/2 -translate-x-1/2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-4 h-6 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full transform rotate-45" />
            </motion.div>
          </motion.div>

          {/* Double Thumbs Up */}
          <div className="flex gap-4 mb-4">
            <motion.div
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-5xl"
            >
              👍
            </motion.div>
            <motion.div
              initial={{ rotate: 30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="text-5xl"
            >
              👍
            </motion.div>
          </div>

          {/* Success message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-bold text-emerald-600"
          >
            API(s) Saved!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-500 text-sm mt-1"
          >
            You're all set! 🎉
          </motion.p>
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
    supabaseUrl: "",
    supabaseAnonKey: "",
  });
  const [status, setStatus] = useState<Record<string, "valid" | "invalid" | "unchecked">>({
    openaiKey: "unchecked",
    spoonacularKey: "unchecked",
    supabaseUrl: "unchecked",
    supabaseAnonKey: "unchecked",
  });

  useEffect(() => {
    // Load from app store (aiSettings) - this is the source of truth
    setConfig({
      openaiKey: aiSettings.openaiApiKey || "",
      spoonacularKey: aiSettings.spoonacularApiKey || "",
      supabaseUrl: aiSettings.supabaseUrl || "",
      supabaseAnonKey: aiSettings.supabaseAnonKey || "",
    });

    // Update status based on existing values
    setStatus({
      openaiKey: aiSettings.openaiApiKey ? "valid" : "unchecked",
      spoonacularKey: aiSettings.spoonacularApiKey ? "valid" : "unchecked",
      supabaseUrl: aiSettings.supabaseUrl ? "valid" : "unchecked",
      supabaseAnonKey: aiSettings.supabaseAnonKey ? "valid" : "unchecked",
    });

    // Check if any APIs are already saved
    const hasAnySaved = aiSettings.openaiApiKey || aiSettings.spoonacularApiKey || 
                        aiSettings.supabaseUrl || aiSettings.supabaseAnonKey;
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
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
      });

      // Also save to legacy localStorage for backward compatibility
      localStorage.setItem("fitfork_api_config", JSON.stringify(config));

      // Update status
      const newStatus: Record<string, "valid" | "invalid" | "unchecked"> = {
        openaiKey: config.openaiKey ? "valid" : "unchecked",
        spoonacularKey: config.spoonacularKey ? "valid" : "unchecked",
        supabaseUrl: config.supabaseUrl ? "valid" : "unchecked",
        supabaseAnonKey: config.supabaseAnonKey ? "valid" : "unchecked",
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
    config.supabaseUrl && config.supabaseAnonKey,
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
      <Header title="API Settings" showBack />

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
                      : "Configure your API keys to enable AI food analysis, nutrition data, and cloud sync features."
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

          {/* Cloud Sync */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Cloud Sync (Supabase)</p>
            <ApiKeyInput
              id="supabaseUrl"
              label="Supabase URL"
              description="Your Supabase project URL"
              icon={Cloud}
              iconColor="bg-gradient-to-br from-emerald-500 to-teal-500"
              placeholder="https://xxxxx.supabase.co"
              helpUrl="https://supabase.com/dashboard"
              helpText="Get Supabase Credentials"
            />
            <ApiKeyInput
              id="supabaseAnonKey"
              label="Supabase Anon Key"
              description="Public anonymous key for client access"
              icon={Key}
              iconColor="bg-gradient-to-br from-emerald-500 to-teal-500"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> API keys are stored locally on your device and are never sent to our servers.
                Each service may have its own pricing and usage limits.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
