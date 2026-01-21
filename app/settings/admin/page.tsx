"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { usePremium } from "@/lib/subscription";
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
  Lock,
  KeyRound,
  Crown,
  ToggleLeft,
  ToggleRight,
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

const PIN_STORAGE_KEY = "fitfork_admin_pin";
const PIN_LENGTH = 6;

// PIN Entry Component
function PinEntry({ 
  onSuccess, 
  isSettingPin 
}: { 
  onSuccess: () => void; 
  isSettingPin: boolean;
}) {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinChange = (index: number, value: string, isConfirmField: boolean = false) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newValue = value.slice(-1); // Take only last character
    const currentPin = isConfirmField ? [...confirmPin] : [...pin];
    currentPin[index] = newValue;

    if (isConfirmField) {
      setConfirmPin(currentPin);
    } else {
      setPin(currentPin);
    }
    setError("");

    // Auto-focus next input
    if (newValue && index < PIN_LENGTH - 1) {
      const refs = isConfirmField ? confirmInputRefs : inputRefs;
      refs.current[index + 1]?.focus();
    }

    // Check if PIN is complete
    if (index === PIN_LENGTH - 1 && newValue) {
      const enteredPin = currentPin.join("");

      if (isSettingPin) {
        if (!isConfirming && !isConfirmField) {
          // First entry complete, move to confirm
          setTimeout(() => {
            setIsConfirming(true);
            setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
          }, 200);
        } else if (isConfirmField) {
          // Confirm entry complete, check match
          const originalPin = pin.join("");
          if (enteredPin === originalPin) {
            localStorage.setItem(PIN_STORAGE_KEY, enteredPin);
            onSuccess();
          } else {
            setError("PINs don't match. Try again.");
            setShake(true);
            setTimeout(() => {
              setShake(false);
              setConfirmPin(Array(PIN_LENGTH).fill(""));
              confirmInputRefs.current[0]?.focus();
            }, 500);
          }
        }
      } else {
        // Verifying existing PIN
        const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
        if (enteredPin === storedPin) {
          onSuccess();
        } else {
          setError("Incorrect PIN");
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setPin(Array(PIN_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
          }, 500);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirmField: boolean = false) => {
    if (e.key === "Backspace") {
      const currentPin = isConfirmField ? confirmPin : pin;
      const refs = isConfirmField ? confirmInputRefs : inputRefs;

      if (!currentPin[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const renderPinInputs = (pinArray: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, isConfirmField: boolean = false) => (
    <motion.div 
      className="flex gap-3 justify-center"
      animate={shake && ((isConfirmField && isConfirming) || (!isConfirmField && !isConfirming)) ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {pinArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(index, e.target.value, isConfirmField)}
          onKeyDown={(e) => handleKeyDown(index, e, isConfirmField)}
          className="w-12 h-14 text-center text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />
      ))}
    </motion.div>
  );

  return (
    <PageContainer>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <Card className="text-center p-8">
            {/* Lock Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Lock size={40} className="text-amber-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSettingPin 
                ? (isConfirming ? "Confirm PIN" : "Set Admin PIN") 
                : "Enter Admin PIN"}
            </h1>
            <p className="text-gray-500 mb-8">
              {isSettingPin 
                ? (isConfirming 
                    ? "Re-enter your 6-digit PIN to confirm" 
                    : "Create a 6-digit PIN to protect admin settings")
                : "Enter your 6-digit PIN to access admin settings"}
            </p>

            {/* PIN Input */}
            <AnimatePresence mode="wait">
              {isSettingPin && isConfirming ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderPinInputs(confirmPin, confirmInputRefs, true)}
                </motion.div>
              ) : (
                <motion.div
                  key="enter"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {renderPinInputs(pin, inputRefs)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-sm mt-4"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Progress Dots for Setting PIN */}
            {isSettingPin && (
              <div className="flex justify-center gap-2 mt-6">
                <div className={`w-2 h-2 rounded-full transition-colors ${!isConfirming ? "bg-amber-500" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${isConfirming ? "bg-amber-500" : "bg-gray-300"}`} />
              </div>
            )}

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="w-full mt-8"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Settings
            </Button>
          </Card>

          {/* Security Note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 PIN is stored locally on your device
          </p>
        </motion.div>
      </div>
    </PageContainer>
  );
}

// Main Admin Page Component
function AdminSettingsContent() {
  const router = useRouter();
  const { aiSettings, updateAISettings } = useAppStore();
  const { isPremium, devModeEnabled, setDevMode } = usePremium();
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
    setConfig({
      supabaseUrl: aiSettings.supabaseUrl || "",
      supabaseAnonKey: aiSettings.supabaseAnonKey || "",
    });
    setStatus({
      supabaseUrl: aiSettings.supabaseUrl ? "valid" : "unchecked",
      supabaseAnonKey: aiSettings.supabaseAnonKey ? "valid" : "unchecked",
    });
    if (aiSettings.supabaseUrl || aiSettings.supabaseAnonKey) {
      setSaved(true);
    }
  }, [aiSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      updateAISettings({
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
      });
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

  const handleResetPin = () => {
    if (confirm("Are you sure you want to reset your admin PIN? You will need to set a new one.")) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      window.location.reload();
    }
  };

  const toggleDevPremium = () => {
    setDevMode(!devModeEnabled);
  };

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
                    These settings are for app administrators only. Incorrect configuration may affect app functionality.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Dev Premium Toggle */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Testing Mode</p>
            <Card
              className={`flex items-center gap-3 cursor-pointer transition-all ${devModeEnabled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
              onClick={toggleDevPremium}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${devModeEnabled ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gray-200'}`}>
                <Crown size={20} className={devModeEnabled ? 'text-white' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {devModeEnabled ? 'Premium Mode Active' : 'Free Mode Active'}
                </p>
                <p className="text-xs text-gray-500">
                  Toggle to test premium features without subscription
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={devModeEnabled ? 'success' : 'default'}>
                  {devModeEnabled ? 'ON' : 'OFF'}
                </Badge>
                {devModeEnabled ? (
                  <ToggleRight size={28} className="text-amber-500" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-400" />
                )}
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
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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

          {/* Reset PIN */}
          <motion.div variants={fadeUp} className="mt-4">
            <Button
              variant="outline"
              onClick={handleResetPin}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <KeyRound size={18} className="mr-2" />
              Reset Admin PIN
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

// Main Export with PIN Gate
export default function AdminSettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if PIN exists
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedPin) {
      setIsSettingPin(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PinEntry 
        onSuccess={() => setIsAuthenticated(true)} 
        isSettingPin={isSettingPin}
      />
    );
  }

  return <AdminSettingsContent />;
}
