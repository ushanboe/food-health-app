"use client";

import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import {
  Shield,
  Database,
  Eye,
  Lock,
  Trash2,
  Cloud,
  Smartphone,
  Cookie,
  Mail,
  CheckCircle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const Section = ({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) => (
  <Card className="mb-4">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center`}>
        <Icon size={20} className={iconColor} />
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </Card>
);

const PrivacyPoint = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
    <span>{text}</span>
  </div>
);

export default function PrivacyPage() {
  return (
    <PageContainer>
      <Header variant="green" title="Privacy Policy" showLogo />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Privacy Policy</h2>
            <p className="text-gray-500 mt-1">Last updated: January 2026</p>
          </motion.div>

          {/* Privacy First Banner */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4 bg-emerald-50 border border-emerald-200">
              <div className="text-center">
                <p className="text-sm font-medium text-emerald-800">
                  🔒 Your privacy is our priority
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  FitFork is designed with privacy-first principles. Your data stays on your device unless you choose to sync.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Sections */}
          <motion.div variants={fadeUp}>
            <Section title="Data We Collect" icon={Database} iconColor="text-blue-500">
              <p className="font-medium text-gray-800 mb-2">Information you provide:</p>
              <ul className="list-disc list-inside ml-2 space-y-1 mb-3">
                <li>Food diary entries and meal photos</li>
                <li>Weight and body measurements</li>
                <li>Nutrition goals and preferences</li>
                <li>Recipes you save or create</li>
                <li>Account information (if using cloud sync)</li>
              </ul>
              <p className="font-medium text-gray-800 mb-2">Automatically collected:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>App usage analytics (anonymized)</li>
                <li>Crash reports for improving stability</li>
                <li>Device type and OS version</li>
              </ul>
            </Section>

            <Section title="How We Use Your Data" icon={Eye} iconColor="text-purple-500">
              <PrivacyPoint text="Provide personalized nutrition insights and recommendations" />
              <PrivacyPoint text="Sync your data across devices (if enabled)" />
              <PrivacyPoint text="Improve our AI food recognition accuracy" />
              <PrivacyPoint text="Send important app updates and notifications" />
              <PrivacyPoint text="Analyze usage patterns to improve the app" />
              <p className="mt-3 text-gray-500 italic">
                We never sell your personal data to third parties.
              </p>
            </Section>

            <Section title="Data Storage" icon={Lock} iconColor="text-amber-500">
              <p className="font-medium text-gray-800 mb-2">Local Storage (Default):</p>
              <p className="mb-3">
                By default, all your data is stored locally on your device. This means your food diary, 
                recipes, and weight history never leave your phone unless you enable cloud sync.
              </p>
              <p className="font-medium text-gray-800 mb-2">Cloud Storage (Optional):</p>
              <p>
                If you enable cloud sync, your data is securely stored on Supabase servers with 
                end-to-end encryption. You can delete your cloud data at any time.
              </p>
            </Section>

            <Section title="Third-Party Services" icon={Cloud} iconColor="text-cyan-500">
              <p className="mb-2">FitFork uses the following third-party services:</p>
              <ul className="space-y-2">
                <li>
                  <span className="font-medium">OpenAI</span> - For AI food analysis. Food images are 
                  processed but not stored by OpenAI.
                </li>
                <li>
                  <span className="font-medium">Spoonacular</span> - For nutrition database lookups. 
                  Only food names are shared, not personal data.
                </li>
                <li>
                  <span className="font-medium">Supabase</span> - For cloud sync and authentication 
                  (if enabled).
                </li>
                <li>
                  <span className="font-medium">Strava/Google Fit</span> - For fitness data sync 
                  (if connected).
                </li>
              </ul>
            </Section>

            <Section title="Your Rights" icon={Smartphone} iconColor="text-indigo-500">
              <p className="mb-2">You have the right to:</p>
              <PrivacyPoint text="Access all data we have about you" />
              <PrivacyPoint text="Export your data in a portable format" />
              <PrivacyPoint text="Delete your account and all associated data" />
              <PrivacyPoint text="Opt out of analytics and tracking" />
              <PrivacyPoint text="Revoke third-party app connections" />
            </Section>

            <Section title="Data Deletion" icon={Trash2} iconColor="text-red-500">
              <p className="mb-3">
                You can delete your data at any time:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Local data:</strong> Clear app data in your device settings or use the in-app reset option</li>
                <li><strong>Cloud data:</strong> Go to Settings → Cloud Sync → Delete All Cloud Data</li>
                <li><strong>Account:</strong> Contact us to permanently delete your account</li>
              </ul>
              <p className="mt-3 text-gray-500">
                Deleted data cannot be recovered. Please export your data first if needed.
              </p>
            </Section>

            <Section title="Cookies & Tracking" icon={Cookie} iconColor="text-orange-500">
              <p>
                FitFork is a mobile-first PWA and uses minimal cookies. We use local storage for 
                app functionality and optional analytics cookies to understand app usage. You can 
                disable analytics in Settings → Privacy.
              </p>
            </Section>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp} className="mt-6 mb-8">
            <Card className="bg-gray-50">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">
                    Questions about privacy? Contact our Data Protection Officer:
                  </p>
                  <a href="mailto:privacy@fitfork.app" className="text-emerald-600 font-medium text-sm">
                    privacy@fitfork.app
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
