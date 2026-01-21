"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import {
  Shield,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Cloud,
  Key,
  ArrowLeft,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

interface AdminConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { aiSettings, updateAISettings } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<AdminConfig>({
    supabaseUrl: "",
    supabaseAnonKey: "",
  });
  const [status, setStatus] = useState<Record<string, "valid" | "invalid" | "unchecked">>({
    supabaseUrl: "unchecked",
    supabaseAnonKey: "unchecked",
  });

  useEffect(() => {
    // Load from app store
    setConfig({
      supabaseUrl: aiSettings.supabaseUrl || "",
      supabaseAnonKey: aiSettings.supabaseAnonKey || "",
    });

    // Update status based on existing values
    setStatus({
      supabaseUrl: aiSettings.supabaseUrl ? "valid" : "unchecked",
      supabaseAnonKey: aiSettings.supabaseAnonKey ? "valid" : "unchecked",
    });

    // Check if already saved
    if (aiSettings.supabaseUrl || aiSettings.supabaseAnonKey) {
      setSaved(true);
    }
  }, [aiSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update the app store
      updateAISettings({
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
      });

      // Update status
      setStatus({
        supabaseUrl: config.supabaseUrl ? "valid" : "unchecked",
        supabaseAnonKey: config.supabaseAnonKey ? "valid" : "unchecked",
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isConfigured = config.supabaseUrl && config.supabaseAnonKey;

  const AdminKeyInput = ({
    id,
    label,
    description,
    icon: Icon,
    iconColor,
    placeholder,
    helpUrl,
    helpText,
  }: {
    id: keyof AdminConfig;
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
            setSaved(false);
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono text-sm"
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
          className="flex items-center gap-1 text-sm text-amber-600 mt-2 hover:underline"
        >
          <ExternalLink size={14} />
          {helpText || "Get Credentials"}
        </a>
      )}
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader 
        icon={Shield} 
        title="Admin Settings" 
        subtitle="Developer configuration"
        iconColor="text-amber-500"
      />

      <PageContent>
        <motion.div initial="initial" animate="animate">
          {/* Warning Banner */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6 bg-amber-50 border border-amber-200">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">⚠️ Developer Settings</p>
                  <p className="text-sm mt-1 text-amber-600">
                    These settings are for app administrators only. Incorrect configuration may affect cloud sync functionality.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cloud Sync Section */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Cloud Sync (Supabase)</p>
            <AdminKeyInput
              id="supabaseUrl"
              label="Supabase URL"
              description="Your Supabase project URL"
              icon={Cloud}
              iconColor="bg-gradient-to-br from-emerald-500 to-teal-500"
              placeholder="https://xxxxx.supabase.co"
              helpUrl="https://supabase.com/dashboard"
              helpText="Get Supabase Credentials"
            />
            <AdminKeyInput
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
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
                  Settings Saved
                </motion.span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save size={18} />
                  Save Admin Settings
                </span>
              )}
            </Button>
          </motion.div>

          {/* Back to Settings */}
          <motion.div variants={fadeUp} className="mt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="w-full"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Settings
            </Button>
          </motion.div>

          {/* Info */}
          <motion.div variants={fadeUp} className="mt-6">
            <Card className="bg-gray-50">
              <div className="flex gap-3">
                <Shield size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Secure Storage</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Admin credentials are stored locally on your device. For production apps, use environment variables instead.
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
