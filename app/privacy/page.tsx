"use client";

import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Shield, Database, Eye, Share2, Lock, Trash2, Baby, Mail, Globe } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function PrivacyPage() {
  const lastUpdated = "January 21, 2026";
  
  return (
    <PageContainer>
      <Header title="Privacy Policy" showBack />
      
      <PageContent>
        <motion.div initial="initial" animate="animate" className="space-y-4">
          
          {/* Header */}
          <motion.div variants={fadeUp}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={24} />
                <h1 className="text-xl font-bold">Privacy Policy</h1>
              </div>
              <p className="text-blue-100 text-sm">Last updated: {lastUpdated}</p>
            </Card>
          </motion.div>

          {/* Introduction */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                FitFork ("we", "our", or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our mobile application and website (collectively, the "App"). Please read 
                this policy carefully. By using FitFork, you consent to the practices described herein.
              </p>
            </Card>
          </motion.div>

          {/* Information We Collect */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Database size={20} className="text-blue-500" />
                <h2 className="font-semibold text-gray-900">2. Information We Collect</h2>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">2.1 Information You Provide</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Account Information:</strong> Email address, display name, profile photo</li>
                <li><strong>Health Data:</strong> Food logs, calorie intake, water consumption, weight entries</li>
                <li><strong>Preferences:</strong> Dietary preferences, allergies, health goals</li>
                <li><strong>Payment Information:</strong> Processed securely by Stripe (we do not store card details)</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Features used, time spent in app, interaction patterns</li>
                <li><strong>Log Data:</strong> IP address, browser type, access times, pages viewed</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">2.3 Third-Party Data</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Strava:</strong> Activity data (with your explicit permission)</li>
                <li><strong>Authentication Providers:</strong> Basic profile info if using social login</li>
              </ul>
            </Card>
          </motion.div>

          {/* How We Use Your Information */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={20} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">3. How We Use Your Information</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">We use your information to:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Provide and maintain the App's functionality</li>
                <li>Track and display your nutrition and health data</li>
                <li>Sync your data across devices (Premium feature)</li>
                <li>Process subscription payments</li>
                <li>Send important service notifications</li>
                <li>Improve and personalize your experience</li>
                <li>Analyze usage patterns to enhance features</li>
                <li>Respond to your support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
            </Card>
          </motion.div>

          {/* Data Storage */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={20} className="text-amber-500" />
                <h2 className="font-semibold text-gray-900">4. Data Storage & Security</h2>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.1 Local Storage</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                By default, your data is stored locally on your device using browser storage. 
                This data remains on your device and is not transmitted to our servers unless 
                you enable Cloud Sync.
              </p>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.2 Cloud Storage (Premium)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Premium users who enable Cloud Sync have their data stored securely on our servers 
                (powered by Supabase). Data is encrypted in transit (TLS) and at rest.
              </p>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.3 Security Measures</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Industry-standard encryption (AES-256)</li>
                <li>Secure HTTPS connections</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
                <li>Payment processing via PCI-compliant Stripe</li>
              </ul>
            </Card>
          </motion.div>

          {/* Data Sharing */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Share2 size={20} className="text-purple-500" />
                <h2 className="font-semibold text-gray-900">5. Data Sharing & Disclosure</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                <strong>We do not sell your personal data.</strong> We may share information only in these cases:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our App 
                  (e.g., Supabase for database, Stripe for payments, Vercel for hosting)</li>
                <li><strong>With Your Consent:</strong> Third-party integrations you explicitly authorize (e.g., Strava)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Protection:</strong> To protect our rights, privacy, safety, or property</li>
              </ul>
            </Card>
          </motion.div>

          {/* Your Rights */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">6. Your Rights & Choices</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">You have the right to:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data ("Right to be Forgotten")</li>
                <li><strong>Export:</strong> Download your data in a portable format (Premium)</li>
                <li><strong>Opt-out:</strong> Disable analytics and non-essential data collection</li>
                <li><strong>Withdraw Consent:</strong> Revoke permissions for third-party integrations</li>
              </ul>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                To exercise these rights, contact us at <span className="text-emerald-600 font-medium">privacy@fitfork.app</span>
              </p>
            </Card>
          </motion.div>

          {/* Data Retention */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Trash2 size={20} className="text-red-500" />
                <h2 className="font-semibold text-gray-900">7. Data Retention</h2>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                <li><strong>Cancelled Subscriptions:</strong> Data retained for 90 days, then deleted from cloud</li>
                <li><strong>Account Deletion:</strong> Data permanently deleted within 30 days of request</li>
                <li><strong>Local Data:</strong> Remains on your device until you clear it or uninstall the App</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
              </ul>
            </Card>
          </motion.div>

          {/* Children's Privacy */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Baby size={20} className="text-pink-500" />
                <h2 className="font-semibold text-gray-900">8. Children's Privacy</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                FitFork is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us 
                immediately at <span className="text-emerald-600 font-medium">privacy@fitfork.app</span>. 
                We will take steps to delete such information.
              </p>
            </Card>
          </motion.div>

          {/* International Users */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={20} className="text-blue-500" />
                <h2 className="font-semibold text-gray-900">9. International Users</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                FitFork is operated from the United States. If you are accessing the App from the 
                European Union, United Kingdom, or other regions with data protection laws, please 
                note that your data may be transferred to and processed in the United States. By 
                using the App, you consent to this transfer. We comply with applicable data protection 
                regulations including GDPR for EU users.
              </p>
            </Card>
          </motion.div>

          {/* Cookies & Tracking */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">10. Cookies & Tracking Technologies</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                We use the following technologies:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Local Storage:</strong> To store your preferences and data locally</li>
                <li><strong>Session Cookies:</strong> To maintain your login session</li>
                <li><strong>Analytics:</strong> Anonymous usage statistics to improve the App</li>
              </ul>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                You can disable cookies in your browser settings, but some features may not function properly.
              </p>
            </Card>
          </motion.div>

          {/* Changes to Policy */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by posting the new policy in the App and updating the "Last Updated" 
                date. Your continued use of the App after changes constitutes acceptance of the 
                updated policy.
              </p>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={20} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">12. Contact Us</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                If you have questions or concerns about this Privacy Policy or our data practices:
              </p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-sm text-gray-700"><strong>Email:</strong> privacy@fitfork.app</p>
                <p className="text-sm text-gray-700"><strong>Support:</strong> support@fitfork.app</p>
                <p className="text-sm text-gray-700"><strong>Website:</strong> https://fitfork.app</p>
              </div>
            </Card>
          </motion.div>

          {/* Footer spacing */}
          <div className="h-8" />
          
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
