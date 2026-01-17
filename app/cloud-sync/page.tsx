"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Cloud, Smartphone, Laptop, Tablet, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import CloudSyncCard from "@/components/auth/CloudSyncCard";
import { FloatingNutri } from "@/components/FloatingNutri";
import BottomNav from "@/components/BottomNav";

export default function CloudSyncPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-gray-50 dark:bg-gray-900">
      {/* Floating Nutri mascot */}
      <FloatingNutri interval={25} duration={5} position="bottom-left" />
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white p-6 safe-top">
          <div className="flex items-center gap-4 mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cloud Sync</h1>
              <p className="text-blue-100 text-sm font-medium">Backup & sync your data</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-24">
          {/* Cloud Sync Card */}
          <CloudSyncCard />

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              How Cloud Sync Works
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Create an account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sign up with your email or Google account</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your data syncs automatically</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Food diary, weight, goals - everything stays in sync</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Access anywhere</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Log in on any device to see your data</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Devices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Access on All Devices</h2>
            
            <div className="flex justify-around">
              <div className="text-center">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-2">
                  <Smartphone className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-2">
                  <Tablet className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tablet</span>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-2">
                  <Laptop className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Computer</span>
              </div>
            </div>
          </motion.div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Your Data is Safe
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Only you can access your data</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Secure cloud infrastructure</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Delete your data anytime</span>
              </div>
            </div>
          </motion.div>

          {/* Offline Mode Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-300">Works Offline Too!</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  FitFork works without internet. Your data syncs automatically when you're back online.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
