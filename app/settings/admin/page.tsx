"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usePremium } from "@/lib/subscription";
import {
  Shield,
  AlertTriangle,
  ArrowLeft,
  Lock,
  KeyRound,
  Crown,
  ToggleLeft,
  ToggleRight,
  Database,
  CheckCircle,
  Users,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

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
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinChange = (index: number, value: string, isConfirmField: boolean = false) => {
    if (!/^\d*$/.test(value)) return;

    const newValue = value.slice(-1);
    const currentPin = isConfirmField ? [...confirmPin] : [...pin];
    currentPin[index] = newValue;

    if (isConfirmField) {
      setConfirmPin(currentPin);
    } else {
      setPin(currentPin);
    }
    setError("");

    if (newValue && index < PIN_LENGTH - 1) {
      const refs = isConfirmField ? confirmInputRefs : inputRefs;
      refs.current[index + 1]?.focus();
    }

    if (index === PIN_LENGTH - 1 && newValue) {
      const enteredPin = currentPin.join("");

      if (isSettingPin) {
        if (!isConfirming && !isConfirmField) {
          setTimeout(() => {
            setIsConfirming(true);
            setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
          }, 200);
        } else if (isConfirmField) {
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Lock size={40} className="text-amber-600" />
            </div>

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

            {isSettingPin && (
              <div className="flex justify-center gap-2 mt-6">
                <div className={`w-2 h-2 rounded-full transition-colors ${!isConfirming ? "bg-amber-500" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${isConfirming ? "bg-amber-500" : "bg-gray-300"}`} />
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="w-full mt-8"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Settings
            </Button>
          </Card>

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
  const { isPremium, devModeEnabled, setDevMode } = usePremium();

  const handleResetPin = () => {
    if (confirm("Are you sure you want to reset your admin PIN? You will need to set a new one.")) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      window.location.reload();
    }
  };

  const toggleDevPremium = () => {
    setDevMode(!devModeEnabled);
  };

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
                    These settings are for app administrators only. Changes here affect testing and development.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Dev Premium Toggle */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">🧪 Testing Mode</p>
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

          {/* Environment Status */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">🔧 Environment Status</p>
            <Card className="bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-emerald-500" />
                    <span className="text-sm text-gray-700">Supabase</span>
                  </div>
                  <Badge variant="success">
                    <CheckCircle size={12} className="mr-1" />
                    Connected via Vercel
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-700">Premium Status</span>
                  </div>
                  <Badge variant={isPremium ? 'success' : 'default'}>
                    {isPremium ? 'Premium' : 'Free'}
                    {devModeEnabled && ' (Dev)'}
                  </Badge>
                </div>
              </div>
            </Card>
            <p className="text-xs text-gray-400 mt-2 px-1">
              💡 Supabase & Stripe keys are configured in Vercel environment variables
            </p>
          </motion.div>

          {/* Testing Premium Users Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">👥 Testing Premium Users</p>
            <Card className="bg-blue-50 border border-blue-200">
              <div className="space-y-3">
                <p className="text-sm text-blue-800 font-medium">How to test premium features:</p>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li><strong>Dev Toggle (above)</strong> - Quick local testing</li>
                  <li><strong>Supabase Dashboard</strong> - Set user's subscription status directly in the database</li>
                  <li><strong>Stripe Test Mode</strong> - Use test cards for payment flow testing</li>
                </ol>
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">🔐 Security</p>
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
          <motion.div variants={fadeUp}>
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
                  <p className="text-sm font-medium text-gray-700">Production Architecture</p>
                  <p className="text-sm text-gray-500 mt-1">
                    API keys are stored as environment variables in Vercel, not in the app. This ensures all users connect to your Supabase instance automatically.
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
