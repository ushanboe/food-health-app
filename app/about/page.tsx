"use client";

import { motion } from "framer-motion";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import {
  Info,
  Heart,
  Github,
  Twitter,
  Instagram,
  Star,
  Sparkles,
  Leaf,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const features = [
  { icon: Sparkles, label: "AI Food Analysis", color: "text-purple-500" },
  { icon: Leaf, label: "Nutrition Tracking", color: "text-emerald-500" },
  { icon: Zap, label: "Quick Logging", color: "text-amber-500" },
  { icon: Shield, label: "Privacy First", color: "text-blue-500" },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader icon={Info} title="About" subtitle="Learn about FitFork" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* App Logo & Info */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            {/* Nutri Mascot */}
            <motion.div
              className="relative w-24 h-24 mx-auto mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg" />
              {/* Eyes */}
              <div className="absolute top-7 left-5 w-4 h-4 bg-white rounded-full">
                <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800 rounded-full" />
              </div>
              <div className="absolute top-7 right-5 w-4 h-4 bg-white rounded-full">
                <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800 rounded-full" />
              </div>
              {/* Smile */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-5 border-b-[3px] border-white rounded-b-full" />
              {/* Blush */}
              <div className="absolute top-12 left-3 w-3 h-2 bg-pink-300 rounded-full opacity-60" />
              <div className="absolute top-12 right-3 w-3 h-2 bg-pink-300 rounded-full opacity-60" />
              {/* Leaf */}
              <motion.div
                className="absolute -top-2 left-1/2 -translate-x-1/2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-4 h-5 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full transform rotate-45" />
              </motion.div>
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900">FitFork</h1>
            <p className="text-gray-500 mt-1">Your AI-Powered Nutrition Companion</p>

            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                Version 2.1.0
              </span>
            </div>
          </motion.div>

          {/* Mission */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
              <div className="text-center">
                <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-2">Our Mission</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We believe everyone deserves access to simple, intelligent nutrition tracking. 
                  FitFork combines cutting-edge AI with beautiful design to make healthy eating 
                  effortless and enjoyable.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Key Features</p>
            <Card className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <feature.icon size={20} className={feature.color} />
                    <span className="text-sm text-gray-700">{feature.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Tech Stack */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Built With</p>
            <Card className="mb-4">
              <div className="flex flex-wrap gap-2">
                {["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Supabase", "OpenAI"].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Credits */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Acknowledgments</p>
            <Card className="mb-4">
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Nutrition Data:</span> Powered by Spoonacular API
                </p>
                <p>
                  <span className="font-medium text-gray-900">Recipe Database:</span> TheMealDB
                </p>
                <p>
                  <span className="font-medium text-gray-900">AI Analysis:</span> OpenAI GPT-4 Vision
                </p>
                <p>
                  <span className="font-medium text-gray-900">Icons:</span> Lucide Icons
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Connect With Us</p>
            <Card className="mb-4">
              <div className="flex justify-center gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Twitter size={22} className="text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Instagram size={22} className="text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Github size={22} className="text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Globe size={22} className="text-gray-600" />
                </a>
              </div>
            </Card>
          </motion.div>

          {/* Rate App */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={24} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="font-medium text-gray-900">Enjoying FitFork?</p>
                <p className="text-sm text-gray-600 mt-1">Rate us on the App Store!</p>
              </div>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="mb-8">
            <Card className="bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                Made with 💚 by the FitFork Team
              </p>
              <p className="text-xs text-gray-400 mt-1">
                © 2026 FitFork. All rights reserved.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
