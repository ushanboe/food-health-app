"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";

// Dynamically import the 3D scene to avoid SSR issues with Three.js
const MascotScene = dynamic(() => import("./MascotScene"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading 3D Model...</p>
        <p className="text-gray-400 text-sm">This may take a moment (54MB)</p>
      </div>
    </div>
  ),
});

export default function MascotTestPage() {
  return (
    <PageContainer>
      <Header title="3D Mascot Test" showBack />

      <PageContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[70vh] w-full"
        >
          <MascotScene />
        </motion.div>

        <div className="p-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">🎮 Controls</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Drag</strong> to rotate the model</li>
              <li>• <strong>Pinch/Scroll</strong> to zoom in/out</li>
              <li>• Model has gentle floating animation</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 mt-3 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2">📊 Model Info</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• File: mascot.glb</li>
              <li>• Size: ~54MB</li>
              <li>• Format: glTF Binary</li>
            </ul>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
