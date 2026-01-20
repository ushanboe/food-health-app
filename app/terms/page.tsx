"use client";

import { motion } from "framer-motion";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FileText, Shield, AlertTriangle, Scale, Globe, Mail } from "lucide-react";

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

export default function TermsPage() {
  return (
    <PageContainer>
      <PageHeader icon={FileText} title="Terms of Service" subtitle="Our terms and conditions" />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileText size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Terms of Service</h2>
            <p className="text-gray-500 mt-1">Last updated: January 2026</p>
          </motion.div>

          {/* Introduction */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4 bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                By using FitFork, you agree to these terms. Please read them carefully before using our app.
              </p>
            </Card>
          </motion.div>

          {/* Sections */}
          <motion.div variants={fadeUp}>
            <Section title="Acceptance of Terms" icon={FileText} iconColor="text-blue-500">
              <p>
                By accessing or using FitFork ("the App"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the App.
              </p>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the App after 
                changes constitutes acceptance of the modified terms.
              </p>
            </Section>

            <Section title="Use of Service" icon={Globe} iconColor="text-emerald-500">
              <p>
                FitFork provides food tracking, nutrition analysis, and health monitoring tools for personal use. 
                You agree to use the App only for lawful purposes and in accordance with these terms.
              </p>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Use the App for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the App or servers</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use the App to transmit harmful or malicious content</li>
              </ul>
            </Section>

            <Section title="Health Disclaimer" icon={AlertTriangle} iconColor="text-amber-500">
              <p className="font-medium text-amber-700">
                FitFork is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease.
              </p>
              <p>
                The nutritional information provided by the App is for informational purposes only and should not 
                be considered medical advice. Always consult with a qualified healthcare provider before making 
                changes to your diet or exercise routine.
              </p>
              <p>
                AI-powered food analysis provides estimates and may not be 100% accurate. Users should verify 
                nutritional information for critical dietary needs.
              </p>
            </Section>

            <Section title="Privacy & Data" icon={Shield} iconColor="text-purple-500">
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect 
                your personal information. By using the App, you consent to our data practices.
              </p>
              <p>
                Data stored locally on your device remains under your control. Cloud sync features require 
                account creation and are subject to our data retention policies.
              </p>
              <p>
                You may request deletion of your account and associated data at any time through the App settings.
              </p>
            </Section>

            <Section title="Intellectual Property" icon={Scale} iconColor="text-red-500">
              <p>
                FitFork and its original content, features, and functionality are owned by FitFork and are 
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of the App without our prior 
                written consent.
              </p>
            </Section>

            <Section title="Limitation of Liability" icon={AlertTriangle} iconColor="text-gray-500">
              <p>
                To the maximum extent permitted by law, FitFork shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of the App.
              </p>
              <p>
                We do not guarantee that the App will be uninterrupted, secure, or error-free. The App is 
                provided "as is" without warranties of any kind.
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
                    Questions about these terms? Contact us at:
                  </p>
                  <a href="mailto:legal@fitfork.app" className="text-emerald-600 font-medium text-sm">
                    legal@fitfork.app
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
