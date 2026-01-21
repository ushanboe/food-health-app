"use client";

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle size={40} className="text-gray-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Upgrade Cancelled
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          No worries! You can upgrade to Premium anytime to unlock all features.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            <ArrowLeft size={18} />
            Back to App
          </Link>
          
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all"
          >
            <Crown size={18} />
            Try Premium Again
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
