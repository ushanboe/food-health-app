"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSubscriptionStore } from '@/lib/subscription';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verified, setVerified] = useState(false);
  const syncSubscription = useSubscriptionStore(state => state.syncFromSupabase);

  useEffect(() => {
    // Sync subscription status after successful payment
    const verifyAndSync = async () => {
      if (sessionId) {
        // Give Stripe webhook a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        await syncSubscription();
        setVerified(true);
      } else {
        setVerified(true);
      }
    };
    verifyAndSync();
  }, [sessionId, syncSubscription]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Crown size={40} className="text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Welcome to Premium! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          Your upgrade was successful. You now have access to all premium features!
        </motion.p>

        {/* Features unlocked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-50 rounded-xl p-4 mb-6"
        >
          <p className="text-sm font-medium text-amber-800 mb-3">Features Unlocked:</p>
          <ul className="space-y-2 text-left">
            {[
              'Cloud Backup & Sync',
              'Advanced Analytics',
              'Unlimited Saved Recipes',
              'Full History Access',
              'Data Export',
              'Profile Photo'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                <CheckCircle size={16} className="text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all"
          >
            <Sparkles size={18} />
            Start Exploring
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <Loader2 size={40} className="animate-spin text-amber-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
