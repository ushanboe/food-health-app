"use client";

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { usePremium, SUBSCRIPTION_PLANS, PremiumFeature, PREMIUM_FEATURES } from '@/lib/subscription';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallback?: ReactNode;
  showLockIcon?: boolean;
}

// Component to wrap premium-only content
export function PremiumGate({
  feature,
  children,
  fallback,
  showLockIcon = true
}: PremiumGateProps) {
  const { hasFeature, isPremium } = usePremium();
  const [showModal, setShowModal] = useState(false);
  
  const hasAccess = hasFeature(feature);
  const featureInfo = PREMIUM_FEATURES[feature];
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Show fallback or locked state
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative w-full"
      >
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        {showLockIcon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-3 rounded-full shadow-lg">
              <Lock size={24} className="text-white" />
            </div>
          </div>
        )}
      </button>
      
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={featureInfo.name}
      />
    </>
  );
}

// Premium badge component
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold rounded-full ${className}`}>
      <Crown size={12} />
      PRO
    </span>
  );
}

// Upgrade modal component
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const { user } = useAuth();
  const monthlyPlan = SUBSCRIPTION_PLANS.monthly;
  const annualPlan = SUBSCRIPTION_PLANS.annual;
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUpgrade = async () => {
    if (!user) {
      setError('Please sign in to upgrade to Premium');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
          userEmail: user.email,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-6 text-center rounded-t-2xl">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
              {feature && (
                <p className="text-white/90 text-sm">
                  Unlock {feature} and all premium features
                </p>
              )}
            </div>
            
            {/* Plan selection */}
            <div className="p-6">
              {/* Sign in prompt if not logged in */}
              {!user && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-amber-800 text-sm">
                    Please <a href="/cloud-sync" className="font-semibold underline">sign in</a> first to upgrade to Premium
                  </p>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                {/* Annual Plan */}
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                    selectedPlan === 'annual'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {annualPlan.savings && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      {annualPlan.savings}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{annualPlan.name}</p>
                      <p className="text-sm text-gray-500">Billed annually</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${annualPlan.price}</p>
                      <p className="text-xs text-gray-500">per year</p>
                    </div>
                  </div>
                </button>
                
                {/* Monthly Plan */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === 'monthly'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{monthlyPlan.name}</p>
                      <p className="text-sm text-gray-500">Billed monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${monthlyPlan.price}</p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Features list */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Premium includes:</p>
                <ul className="space-y-2">
                  {monthlyPlan.features.slice(1).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* CTA Button */}
              <Button
                onClick={handleUpgrade}
                disabled={isLoading || !user}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Continue with {selectedPlan === 'annual' ? 'Annual' : 'Monthly'}
                  </>
                )}
              </Button>
              
              {/* Terms */}
              <p className="text-xs text-gray-400 text-center mt-4">
                Cancel anytime. By subscribing, you agree to our{' '}
                <a href="/terms" className="underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Standalone upgrade button
export function UpgradeButton({ className = '' }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);
  const { isPremium } = usePremium();
  
  if (isPremium) return null;
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${className}`}
      >
        <Crown size={18} />
        Upgrade
      </button>
      <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
