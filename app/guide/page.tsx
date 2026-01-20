"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import {
  Rocket,
  Sparkles,
  Camera,
  BookOpen,
  Scale,
  Target,
  Cloud,
  Link,
  Download,
  Lightbulb,
  Wrench,
  ChevronRight,
  ChevronDown,
  Utensils,
  Star,
  Droplets,
  Smartphone,
  Key,
  Zap,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

interface Section {
  id: string;
  title: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  content: React.ReactNode;
}

const QuickStartStep = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      {number}
    </div>
    <div>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const FeatureRow = ({ icon: Icon, iconColor, title, description }: { icon: any; iconColor: string; title: string; description: string }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`}>
      <Icon size={16} className={iconColor} />
    </div>
    <div>
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

const ServiceCard = ({ name, description, steps, free }: { name: string; description: string; steps: string[]; free?: boolean }) => (
  <div className="bg-gray-50 rounded-xl p-4 mb-3">
    <div className="flex items-center justify-between mb-2">
      <p className="font-semibold text-gray-900">{name}</p>
      {free && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Free</span>}
    </div>
    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <div className="space-y-1">
      {steps.map((step, i) => (
        <p key={i} className="text-xs text-gray-500 flex items-start gap-2">
          <span className="text-emerald-500 font-bold">{i + 1}.</span> {step}
        </p>
      ))}
    </div>
  </div>
);

const TipCard = ({ emoji, title, tip }: { emoji: string; title: string; tip: string }) => (
  <div className="bg-amber-50 rounded-xl p-3 mb-2 flex items-start gap-3">
    <span className="text-xl">{emoji}</span>
    <div>
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-600">{tip}</p>
    </div>
  </div>
);

const TroubleshootItem = ({ problem, solutions }: { problem: string; solutions: string[] }) => (
  <div className="mb-4 pb-4 border-b border-gray-100 last:border-0">
    <p className="font-medium text-gray-900 text-sm mb-2">❌ {problem}</p>
    <div className="space-y-1 pl-4">
      {solutions.map((sol, i) => (
        <p key={i} className="text-xs text-gray-600 flex items-start gap-2">
          <span className="text-emerald-500">✓</span> {sol}
        </p>
      ))}
    </div>
  </div>
);

export default function UserGuidePage() {
  const [openSection, setOpenSection] = useState<string | null>("quickstart");

  const sections: Section[] = [
    {
      id: "quickstart",
      title: "Quick Start Guide",
      icon: Rocket,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
      content: (
        <div>
          <p className="text-sm text-gray-600 mb-4">Get up and running with FitFork in just 5 minutes!</p>
          <QuickStartStep 
            number={1} 
            title="Set Up Your Profile" 
            description="Open Profile, enter your info (name, age, height, weight), and set your activity level."
          />
          <QuickStartStep 
            number={2} 
            title="Configure API Keys" 
            description="Go to Settings → API Settings. Add your Google Gemini key for AI food scanning."
          />
          <QuickStartStep 
            number={3} 
            title="Start Tracking!" 
            description="Scan food with camera 📷, log meals in diary 📝, track weight ⚖️, browse recipes 🍳"
          />
          <QuickStartStep 
            number={4} 
            title="Enable Cloud Sync (Optional)" 
            description="Settings → Cloud Sync to backup and sync across devices."
          />
        </div>
      ),
    },
    {
      id: "features",
      title: "Key Features",
      icon: Sparkles,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100",
      content: (
        <div>
          <FeatureRow icon={Camera} iconColor="text-blue-500" title="AI Food Scanner" description="Point camera at food for instant nutrition analysis" />
          <FeatureRow icon={Utensils} iconColor="text-orange-500" title="Food Diary" description="Log meals, track calories and macros daily" />
          <FeatureRow icon={BookOpen} iconColor="text-red-500" title="Recipe Browser" description="Discover recipes from Spoonacular & TheMealDB" />
          <FeatureRow icon={Star} iconColor="text-yellow-500" title="Recipe Ratings" description="Rate and save your favorite recipes" />
          <FeatureRow icon={Scale} iconColor="text-purple-500" title="Weight Tracker" description="Monitor progress with visual charts" />
          <FeatureRow icon={Target} iconColor="text-emerald-500" title="Smart Goals" description="Set personalized calorie and macro targets" />
          <FeatureRow icon={Droplets} iconColor="text-cyan-500" title="Water Tracking" description="Monitor daily water intake" />
          <FeatureRow icon={Cloud} iconColor="text-indigo-500" title="Cloud Sync" description="Backup and sync across devices" />
          <FeatureRow icon={Download} iconColor="text-gray-500" title="Data Export" description="Export data in JSON or CSV format" />
        </div>
      ),
    },
    {
      id: "scanner",
      title: "AI Food Scanner",
      icon: Camera,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      content: (
        <div>
          <p className="text-sm text-gray-600 mb-4">FitFork uses Google Gemini AI to analyze food photos.</p>

          <p className="font-medium text-gray-900 text-sm mb-2">How to Use:</p>
          <ol className="text-sm text-gray-600 space-y-1 mb-4 pl-4">
            <li>1. Tap the camera icon 📷</li>
            <li>2. Take a clear photo of your food</li>
            <li>3. Wait 2-5 seconds for AI analysis</li>
            <li>4. Review and adjust nutrition values</li>
            <li>5. Add to diary</li>
          </ol>

          <p className="font-medium text-gray-900 text-sm mb-2">Tips for Best Results:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <p className="text-emerald-700">✓ Good lighting</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <p className="text-emerald-700">✓ Full plate in frame</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <p className="text-emerald-700">✓ Shoot from above</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <p className="text-emerald-700">✓ Steady camera</p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <p className="text-red-600">✗ Blurry photos</p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <p className="text-red-600">✗ Dark lighting</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "recipes",
      title: "Recipe Management",
      icon: BookOpen,
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
      content: (
        <div>
          <p className="text-sm text-gray-600 mb-4">Browse, save, and rate recipes from multiple sources.</p>

          <p className="font-medium text-gray-900 text-sm mb-2">Recipe Sources:</p>
          <div className="space-y-2 mb-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="font-medium text-orange-800 text-sm">Spoonacular</p>
              <p className="text-xs text-orange-600">5,000+ recipes with full nutrition data (API key required)</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="font-medium text-yellow-800 text-sm">TheMealDB</p>
              <p className="text-xs text-yellow-600">Free recipes by category (no key needed)</p>
            </div>
          </div>

          <p className="font-medium text-gray-900 text-sm mb-2">Features:</p>
          <ul className="text-sm text-gray-600 space-y-1 pl-4">
            <li>• Save recipes to your collection</li>
            <li>• Rate recipes 1-5 stars ⭐</li>
            <li>• Swipe through saved recipes</li>
            <li>• Log recipes as meals</li>
            <li>• Create custom recipes</li>
          </ul>
        </div>
      ),
    },
    {
      id: "services",
      title: "Connecting Services",
      icon: Link,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-100",
      content: (
        <div>
          <ServiceCard 
            name="Google Gemini (AI Scanner)" 
            description="Powers AI food recognition"
            steps={[
              "Visit makersuite.google.com",
              "Sign in with Google account",
              "Click the Create API Key button",
              "Copy key to Settings → API Settings"
            ]}
            free
          />
          <ServiceCard 
            name="Spoonacular (Recipes)" 
            description="Access 5,000+ recipes with nutrition"
            steps={[
              "Visit spoonacular.com/food-api",
              "Create free account",
              "Get API key from dashboard",
              "Add to Settings → API Settings"
            ]}
            free
          />
          <ServiceCard 
            name="Supabase (Cloud Sync)" 
            description="Backup and sync across devices"
            steps={[
              "Visit supabase.com",
              "Create free project",
              "Copy URL and anon key",
              "Add to Settings → API Settings"
            ]}
            free
          />
          <ServiceCard 
            name="Strava (Fitness)" 
            description="Import workouts and activities"
            steps={[
              "Go to Settings → Connected Devices",
              "Tap Connect Strava button",
              "Sign in and authorize"
            ]}
            free
          />
        </div>
      ),
    },
    {
      id: "tips",
      title: "Tips & Tricks",
      icon: Lightbulb,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
      content: (
        <div>
          <TipCard emoji="📷" title="Faster Logging" tip="Use the camera for quick logging - faster than manual entry!" />
          <TipCard emoji="🍽️" title="Save Frequent Meals" tip="Save meals you eat often as recipes for one-tap logging." />
          <TipCard emoji="⏰" title="Log As You Eat" tip="Don't wait until end of day - log meals right away for accuracy." />
          <TipCard emoji="⚖️" title="Use a Food Scale" tip="For precise portions, weigh your food and adjust values." />
          <TipCard emoji="📊" title="Focus on Trends" tip="Don't stress single days - weekly averages matter more!" />
          <TipCard emoji="🎯" title="Realistic Goals" tip="Small calorie deficits are more sustainable long-term." />
        </div>
      ),
    },
    {
      id: "troubleshoot",
      title: "Troubleshooting",
      icon: Wrench,
      iconColor: "text-gray-500",
      iconBg: "bg-gray-200",
      content: (
        <div>
          <TroubleshootItem 
            problem="Camera not working" 
            solutions={[
              "Check browser camera permissions",
              "Ensure no other app is using camera",
              "On iOS, use Safari instead of Chrome",
              "Try refreshing the page"
            ]}
          />
          <TroubleshootItem 
            problem="AI scan fails" 
            solutions={[
              "Check Gemini API key is valid",
              "Ensure internet connection",
              "Try a clearer, well-lit photo",
              "Check API quota hasn't been exceeded"
            ]}
          />
          <TroubleshootItem 
            problem="Cloud sync not working" 
            solutions={[
              "Check internet connection",
              "Verify Supabase credentials",
              "Try manual sync in Settings",
              "Ensure signed in on both devices"
            ]}
          />
          <TroubleshootItem 
            problem="Recipes not loading" 
            solutions={[
              "Check Spoonacular API key",
              "Try TheMealDB tab (no key needed)",
              "Check internet connection"
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader icon={BookOpen} title="User Guide" subtitle="Learn how to use FitFork" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Hero */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">FitFork User Guide</h2>
            <p className="text-gray-500 mt-1">Everything you need to know</p>
          </motion.div>

          {/* Sections */}
          <motion.div variants={fadeUp} className="space-y-3">
            {sections.map((section) => {
              const Icon = section.icon;
              const isOpen = openSection === section.id;

              return (
                <Card key={section.id} className="overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isOpen ? null : section.id)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={section.iconColor} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{section.title}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown size={20} className="text-gray-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="pt-4 mt-4 border-t border-gray-100">
                          {section.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </motion.div>

          {/* Download Full Guide */}
          <motion.div variants={fadeUp} className="mt-6">
            <a 
              href="/USER_GUIDE.pdf" 
              download="FitFork_User_Guide.md"
              className="block"
            >
              <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Download Full Guide</p>
                    <p className="text-sm text-white/80">Complete PDF with all details</p>
                  </div>
                  <ChevronRight size={20} className="text-white/60" />
                </div>
              </Card>
            </a>
          </motion.div>

          {/* Version */}
          <motion.div variants={fadeUp} className="text-center mt-6 text-xs text-gray-400">
            <p>FitFork v1.0 • Last updated January 2026</p>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
