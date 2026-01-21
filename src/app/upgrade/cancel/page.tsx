'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UpgradeCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
        >
          <XCircle className="w-10 h-10 text-gray-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upgrade Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          No worries! You can upgrade anytime when you're ready.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full py-6 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to App
          </Button>

          <Button
            onClick={() => router.push('/profile')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-xl"
          >
            <Crown className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Questions? Contact us at help@fitfork.app
        </p>
      </motion.div>
    </div>
  );
}
