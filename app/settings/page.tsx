"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore, Theme } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import FitnessConnections from "@/components/fitness/FitnessConnections";
import {
  Key,
  Bell,
  Moon,
  Sun,
  Monitor,
  Globe,
  Shield,
  HelpCircle,
  BookOpen,
  FileText,
  LogOut,
  ChevronRight,
  Palette,
  Database,
  Smartphone,
  Info,
  Check,
  X,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const themeOptions: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  { value: "light", label: "Light", icon: Sun, description: "Always use light theme" },
  { value: "dark", label: "Dark", icon: Moon, description: "Always use dark theme" },
  { value: "system", label: "System", icon: Monitor, description: "Match device settings" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile, theme, setTheme } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  );

  const getThemeLabel = () => {
    const option = themeOptions.find(o => o.value === theme);
    return option?.label || "Light";
  };

  return (
    <PageContainer>
      <Header variant="green" title="Settings" showLogo />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Preferences Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 px-1">Preferences</p>
            <Card padding="none" className="dark:bg-gray-800">
              <ListItem
                icon={<Bell size={20} className="text-blue-500" />}
                title="Notifications"
                subtitle="Meal reminders & updates"
                value={<Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />}
              />
              <ListItem
                icon={<Palette size={20} className="text-purple-500" />}
                title="Theme"
                subtitle={getThemeLabel()}
                showArrow
                onClick={() => setShowThemeModal(true)}
              />
              <ListItem
                icon={<Globe size={20} className="text-emerald-500" />}
                title="Language"
                subtitle="English"
                showArrow
                onClick={() => {}}
              />
            </Card>
          </motion.div>

          {/* Fitness Connections */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 px-1">Fitness Connections</p>
            <FitnessConnections />
          </motion.div>

          {/* API Configuration */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 px-1">Developer</p>
            <Card padding="none" className="dark:bg-gray-800">
              <ListItem
                icon={<Key size={20} className="text-purple-500" />}
                title="API Settings"
                subtitle="Configure API keys for AI & sync"
                showArrow
                onClick={() => router.push("/settings/api")}
              />
            </Card>
          </motion.div>

          {/* Data & Privacy Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 px-1">Data & Privacy</p>
            <Card padding="none" className="dark:bg-gray-800">
              <ListItem
                icon={<Database size={20} className="text-amber-500" />}
                title="Export Data"
                subtitle="Download your data"
                showArrow
                onClick={() => router.push("/export")}
              />
              <ListItem
                icon={<Shield size={20} className="text-red-500" />}
                title="Privacy"
                subtitle="Manage your data"
                showArrow
                onClick={() => router.push("/privacy")}
              />
              <ListItem
                icon={<Smartphone size={20} className="text-gray-500" />}
                title="Connected Devices"
                subtitle="Manage devices"
                showArrow
                onClick={() => router.push("/devices")}
              />
            </Card>
          </motion.div>

          {/* Support Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 px-1">Support</p>
            <Card padding="none" className="dark:bg-gray-800">
              <ListItem
                icon={<HelpCircle size={20} className="text-blue-500" />}
                title="Help Center"
                subtitle="FAQs & guides"
                showArrow
                onClick={() => router.push("/help")}
              />
              <ListItem
                icon={<BookOpen size={20} className="text-emerald-500" />}
                title="User Guide"
                subtitle="Complete app manual"
                showArrow
                onClick={() => router.push("/guide")}
              />
              <ListItem
                icon={<FileText size={20} className="text-gray-500" />}
                title="Terms of Service"
                showArrow
                onClick={() => router.push("/terms")}
              />
              <ListItem
                icon={<Info size={20} className="text-gray-500" />}
                title="About"
                subtitle="Version 2.1.0"
                showArrow
                onClick={() => router.push("/about")}
              />
            </Card>
          </motion.div>

          {/* Sign Out */}
          <motion.div variants={fadeUp}>
            <Card
              onClick={() => {}}
              className="cursor-pointer dark:bg-gray-800"
            >
              <div className="flex items-center justify-center gap-2 text-red-500">
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Theme Selection Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowThemeModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose Theme</h2>
                <button
                  onClick={() => setShowThemeModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeModal(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${
                          isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                        }`}>
                          {option.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check size={18} className="text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Theme changes apply immediately across the app
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </PageContainer>
  );
}
