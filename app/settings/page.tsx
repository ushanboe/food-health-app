"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { Badge } from "@/components/ui/Badge";
import FitnessConnections from "@/components/fitness/FitnessConnections";
import { usePremium } from "@/lib/subscription";
import { PremiumGate } from "@/components/PremiumGate";
import { useAuth } from "@/contexts/AuthContext";
import {
  Key,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  BookOpen,
  FileText,
  LogOut,
  Database,
  Smartphone,
  Info,
  Settings,
  Cloud,
  Crown,
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
  const { user, isConfigured } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const isCloudConnected = user && isConfigured;

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
      <PageHeader icon={Settings} title="Settings" subtitle="Customize your experience" />

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
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Fitness Connections</p>
            <PremiumGate feature="stravaSync">
              <FitnessConnections />
            </PremiumGate>
          </motion.div>

          {/* API Configuration */}
          <motion.div variants={fadeUp} className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Developer</p>
            <Card padding="none">
              <ListItem
                icon={<Key size={20} className="text-purple-500" />}
                title="API Settings"
                subtitle="Configure API keys for AI features"
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
                icon={<Cloud size={20} className={isCloudConnected ? "text-emerald-500" : "text-blue-500"} />}
                title="Cloud Backup"
                subtitle={isCloudConnected ? "Connected & syncing" : "Sign in to backup your data"}
                showArrow
                onClick={() => router.push("/cloud-sync")}
                value={isCloudConnected ? <Badge variant="success">Active</Badge> : null}
              />
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
                icon={<Crown size={20} className="text-amber-500" />}
                title="Admin"
                subtitle="Developer settings"
                showArrow
                onClick={() => router.push("/settings/admin")}
              />
              <ListItem
                icon={<Info size={20} className="text-gray-400" />}
                title="About"
                subtitle="Version 2.1.0"
                showArrow
                onClick={() => router.push("/about")}
              />
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      <BottomNav />
    </PageContainer>
  );
}
