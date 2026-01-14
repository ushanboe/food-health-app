"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Sparkles, TrendingUp, History, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { scanHistory } = useAppStore();
  const recentScans = scanHistory.slice(0, 3);

  return (
    <div className="min-h-full px-5 py-6 safe-top">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Nutri<span className="text-green-500">Scan</span>
        </h1>
        <p className="text-gray-500 mt-1">Your personal food health analyzer</p>
      </motion.div>

      {/* Main CTA Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 mb-6 shadow-xl"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-green-100 text-sm font-medium">AI-Powered Analysis</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Scan Your Food
          </h2>
          <p className="text-green-100 text-sm mb-6 leading-relaxed">
            Take a photo of any food and get instant nutritional information, health scores, and healthier alternatives.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/camera")}
            className="w-full flex items-center justify-center gap-3 bg-white text-green-600 font-semibold py-4 px-6 rounded-2xl shadow-lg btn-press"
          >
            <Camera className="w-6 h-6" />
            <span>Start Scanning</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Health Score</h3>
          <p className="text-xs text-gray-500 mt-1">Get instant health ratings for your food</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Smart Tips</h3>
          <p className="text-xs text-gray-500 mt-1">Discover healthier alternatives</p>
        </div>
      </motion.div>

      {/* Recent Scans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Recent Scans</h3>
          {recentScans.length > 0 && (
            <button
              onClick={() => router.push("/history")}
              className="text-green-600 text-sm font-medium flex items-center gap-1"
            >
              See all
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentScans.length > 0 ? (
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {scan.imageData && (
                    <img
                      src={scan.imageData}
                      alt={scan.foodIdentification.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">
                    {scan.foodIdentification.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scan.healthScore >= 60 ? "bg-green-100 text-green-700" :
                    scan.healthScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {scan.healthScore}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No scans yet</p>
            <p className="text-gray-400 text-xs mt-1">Start by scanning your first food item!</p>
          </div>
        )}
      </motion.div>

      {/* Bottom spacing for nav */}
      <div className="h-4" />
    </div>
  );
}
