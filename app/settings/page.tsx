"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import FitnessConnections from "@/components/fitness/FitnessConnections";
import {
  Key,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Palette,
  Database,
  Smartphone,
  Info,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  );

  return (
    <PageContainer>
      <Header title="Settings" showBack />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Preferences Section */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Preferences</p>
            <Card padding="none">
              <ListItem
                icon={<Bell size={20} className="text-blue-500" />}
                title="Notifications"
                subtitle="Meal reminders & updates"
                value={<Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />}
              />
              <ListItem
                icon={<Moon size={20} className="text-purple-500" />}
                title="Dark Mode"
                subtitle="Reduce eye strain"
                value={<Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
              />
              <ListItem
                icon={<Globe size={20} className="text-emerald-500" />}
                title="Language"
                subtitle="English"
                showArrow
                onClick={() => {}}
              />
              <ListItem
                icon={<Palette size={20} className="text-pink-500" />}
                title="Theme"
                subtitle="Default"
                showArrow
                onClick={() => {}}
              />
            </Card>
          </motion.div>

          {/* Fitness Connections */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Fitness Connections</p>
            <FitnessConnections />
          </motion.div>

                    {/* API Configuration */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Developer</p>
            <Card padding="none">
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
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Data & Privacy</p>
            <Card padding="none">
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
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Support</p>
            <Card padding="none">
              <ListItem
                icon={<HelpCircle size={20} className="text-blue-500" />}
                title="Help Center"
                subtitle="FAQs & guides"
                showArrow
                onClick={() => router.push("/help")}
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
              className="cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2 text-red-500">
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      <BottomNav />
    </PageContainer>
  );
}
