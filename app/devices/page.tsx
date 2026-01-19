"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import {
  Smartphone,
  Monitor,
  Tablet,
  Cloud,
  CloudOff,
  CheckCircle,
  AlertCircle,
  Link2,
  Unlink,
  RefreshCw,
  LogOut,
  Activity,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop";
  name: string;
  browser: string;
  os: string;
  lastSync?: string;
  isCurrent: boolean;
}

export default function DevicesPage() {
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Detect current device info
    const detectDevice = () => {
      const ua = navigator.userAgent;
      let type: "mobile" | "tablet" | "desktop" = "desktop";
      let os = "Unknown";
      let browser = "Unknown";

      // Detect OS
      if (/Windows/.test(ua)) os = "Windows";
      else if (/Mac/.test(ua)) os = "macOS";
      else if (/Linux/.test(ua)) os = "Linux";
      else if (/Android/.test(ua)) os = "Android";
      else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

      // Detect browser
      if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
      else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
      else if (/Firefox/.test(ua)) browser = "Firefox";
      else if (/Edg/.test(ua)) browser = "Edge";

      // Detect device type
      if (/iPhone|Android.*Mobile/.test(ua)) type = "mobile";
      else if (/iPad|Android(?!.*Mobile)/.test(ua)) type = "tablet";

      setCurrentDevice({
        type,
        name: type === "mobile" ? "Mobile Device" : type === "tablet" ? "Tablet" : "Computer",
        browser,
        os,
        lastSync: cloudSyncEnabled ? new Date().toISOString() : undefined,
        isCurrent: true,
      });
    };

    detectDevice();
  }, [cloudSyncEnabled]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Monitor;
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSyncing(false);
  };

  const DeviceIcon = currentDevice ? getDeviceIcon(currentDevice.type) : Monitor;

  return (
    <PageContainer>
      <Header title="Connected Devices" showBack />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Smartphone size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Devices</h2>
            <p className="text-gray-500 mt-1">Manage devices and sync status</p>
          </motion.div>

          {/* Current Device */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">This Device</p>
            <Card className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <DeviceIcon size={28} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {currentDevice?.name || "Loading..."}
                    </p>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentDevice?.browser} on {currentDevice?.os}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cloud Sync Status */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Cloud Sync</p>
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    cloudSyncEnabled ? "bg-emerald-100" : "bg-gray-100"
                  }`}
                >
                  {cloudSyncEnabled ? (
                    <Cloud size={24} className="text-emerald-500" />
                  ) : (
                    <CloudOff size={24} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {cloudSyncEnabled ? "Sync Enabled" : "Sync Disabled"}
                    </p>
                    {cloudSyncEnabled && (
                      <CheckCircle size={16} className="text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {cloudSyncEnabled
                      ? "Your data syncs across all devices"
                      : "Enable in Settings to sync data"}
                  </p>
                </div>
              </div>

              {cloudSyncEnabled && (
                <Button
                  onClick={handleSync}
                  variant="secondary"
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  disabled={syncing}
                >
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
              )}
            </Card>
          </motion.div>

          {/* Connected Apps */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Connected Apps</p>

            {/* Strava */}
            <Card className="mb-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Activity size={24} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Strava</p>
                  <p className="text-sm text-gray-500">Fitness tracking</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    Not connected
                  </span>
                </div>
              </div>
            </Card>

            {/* Google Fit */}
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity size={24} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Google Fit</p>
                  <p className="text-sm text-gray-500">Health data sync</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    Not connected
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          {cloudSyncEnabled && (
            <motion.div variants={fadeUp}>
              <p className="text-sm text-gray-500 font-medium mb-3 px-1">Security</p>
              <Card className="mb-4 bg-red-50 border border-red-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <LogOut size={24} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Sign Out Everywhere</p>
                    <p className="text-sm text-gray-600">
                      Sign out from all devices except this one
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-100"
                >
                  Sign Out All Devices
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Info */}
          <motion.div variants={fadeUp} className="mb-8">
            <Card className="bg-gray-50">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  FitFork is a Progressive Web App (PWA). Your data is stored locally on each 
                  device. Enable Cloud Sync to keep your data synchronized across all your devices.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
