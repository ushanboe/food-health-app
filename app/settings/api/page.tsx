"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

export default function ApiSettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
    // Load saved API keys from localStorage
    const saved = localStorage.getItem("fitfork_api_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        // Check which keys are configured
        const newStatus: Record<string, "valid" | "invalid" | "unchecked"> = {};
        Object.keys(parsed).forEach(key => {
          newStatus[key] = parsed[key] ? "valid" : "unchecked";
        });
        setStatus(newStatus);
      } catch (e) {
        console.error("Failed to parse API config", e);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("fitfork_api_config", JSON.stringify(config));
      // Update status
      const newStatus: Record<string, "valid" | "invalid" | "unchecked"> = {};
      Object.keys(config).forEach(key => {
        newStatus[key] = config[key as keyof ApiConfig] ? "valid" : "unchecked";
      });
      setStatus(newStatus);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
          onChange={(e) => setConfig({ ...config, [id]: e.target.value })}
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

      <PageContent>
        <motion.div initial="initial" animate="animate">
          {/* Info Banner */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6 bg-blue-50 border border-blue-200">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">API Keys Required</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Configure your API keys to enable AI food analysis, nutrition data, and cloud sync features.
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
              className="w-full"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
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
