"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import {
  HelpCircle,
  ChevronDown,
  Camera,
  Utensils,
  Scale,
  Cloud,
  Target,
  Smartphone,
  Mail,
  MessageCircle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

interface FAQItem {
  question: string;
  answer: string;
  icon: any;
  iconColor: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I scan food with the camera?",
    answer: "Tap the camera icon on the home screen or diary page. Point your camera at any food item and tap the capture button. Our AI will analyze the food and provide nutritional information. For best results, ensure good lighting and capture the entire food item in frame.",
    icon: Camera,
    iconColor: "text-blue-500",
  },
  {
    question: "How accurate is the nutrition data?",
    answer: "FitFork uses advanced AI combined with comprehensive nutrition databases to provide accurate estimates. While we strive for accuracy, actual nutritional values may vary based on portion sizes, preparation methods, and specific ingredients. For precise tracking, you can manually adjust values after scanning.",
    icon: Utensils,
    iconColor: "text-orange-500",
  },
  {
    question: "How do I track my weight?",
    answer: "Navigate to the Weight page from the bottom navigation. Tap the '+' button to add a new weight entry. You can view your progress over time in the chart and set weight goals in your profile settings.",
    icon: Scale,
    iconColor: "text-purple-500",
  },
  {
    question: "What is Cloud Sync and how does it work?",
    answer: "Cloud Sync allows you to backup your data to the cloud and access it across multiple devices. Go to Settings > Cloud Sync to sign in or create an account. Once enabled, your food diary, recipes, and weight history will automatically sync.",
    icon: Cloud,
    iconColor: "text-emerald-500",
  },
  {
    question: "How do I set my nutrition goals?",
    answer: "Go to your Profile page and tap on 'Daily Goals'. You can set custom targets for calories, protein, carbs, fat, fiber, and sugar. FitFork can also calculate recommended goals based on your age, weight, height, and activity level.",
    icon: Target,
    iconColor: "text-red-500",
  },
  {
    question: "Can I use FitFork offline?",
    answer: "Yes! FitFork stores your data locally on your device, so you can log meals and view your history offline. However, AI food scanning and cloud sync features require an internet connection. Your data will sync automatically when you're back online.",
    icon: Smartphone,
    iconColor: "text-gray-500",
  },
];

const FAQAccordion = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  const Icon = item.icon;
  return (
    <Card className="mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={item.iconColor} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 pr-8">{item.question}</p>
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
            <p className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-100 leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageContainer>
      <Header title="Help Center" showBack />

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <HelpCircle size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">How can we help?</h2>
            <p className="text-gray-500 mt-1">Find answers to common questions</p>
          </motion.div>

          {/* FAQs */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Frequently Asked Questions</p>
            {faqs.map((faq, index) => (
              <FAQAccordion
                key={index}
                item={faq}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div variants={fadeUp} className="mt-6">
            <p className="text-sm text-gray-500 font-medium mb-3 px-1">Still need help?</p>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-sm text-gray-500">We typically respond within 24 hours</p>
                </div>
              </div>
              <a
                href="mailto:support@fitfork.app"
                className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-center font-medium text-gray-700 transition-colors block"
              >
                support@fitfork.app
              </a>
            </Card>
          </motion.div>

          {/* App Info */}
          <motion.div variants={fadeUp} className="mt-6 mb-8">
            <Card className="bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                FitFork v2.1.0 • Made with 💚
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
