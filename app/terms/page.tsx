"use client";

import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { FileText, CreditCard, RefreshCcw, XCircle, Shield, AlertTriangle, Mail } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function TermsPage() {
  const lastUpdated = "January 21, 2026";
  
  return (
    <PageContainer>
      <Header title="Terms of Service" showBack />
      
      <PageContent>
        <motion.div initial="initial" animate="animate" className="space-y-4">
          
          {/* Header */}
          <motion.div variants={fadeUp}>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={24} />
                <h1 className="text-xl font-bold">Terms of Service</h1>
              </div>
              <p className="text-emerald-100 text-sm">Last updated: {lastUpdated}</p>
            </Card>
          </motion.div>

          {/* Introduction */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                By accessing or using FitFork ("the App"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the App. We reserve the right to 
                modify these terms at any time, and your continued use of the App constitutes acceptance 
                of any changes.
              </p>
            </Card>
          </motion.div>

          {/* Service Description */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">2. Service Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                FitFork is a food and health tracking application that allows users to:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Log and track food intake and nutrition</li>
                <li>Monitor water consumption</li>
                <li>Track weight and fitness goals</li>
                <li>Sync with third-party fitness services (Premium)</li>
                <li>Access advanced analytics and insights (Premium)</li>
              </ul>
            </Card>
          </motion.div>

          {/* Subscription Terms */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={20} className="text-amber-500" />
                <h2 className="font-semibold text-gray-900">3. Subscription Terms</h2>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">3.1 Free Tier</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Free tier provides basic functionality at no cost. Free tier features may be 
                modified or limited at our discretion.
              </p>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">3.2 Premium Subscriptions</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                FitFork offers the following premium subscription options:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mb-3">
                <li><strong>Monthly:</strong> $4.99 per month, billed monthly</li>
                <li><strong>Annual:</strong> $29.99 per year, billed annually (save 50%)</li>
              </ul>
              <p className="text-sm text-gray-600 leading-relaxed">
                Subscriptions automatically renew at the end of each billing period unless cancelled 
                before the renewal date.
              </p>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">3.3 Billing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Payment is processed securely through Stripe. By subscribing, you authorize us to 
                charge your payment method on a recurring basis. You are responsible for keeping 
                your payment information current.
              </p>
            </Card>
          </motion.div>

          {/* Cancellation Policy */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-500" />
                <h2 className="font-semibold text-gray-900">4. Cancellation Policy</h2>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.1 How to Cancel</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You may cancel your subscription at any time through the App settings or by 
                contacting our support team. Cancellation takes effect at the end of your current 
                billing period.
              </p>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.2 Effect of Cancellation</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>You retain access to Premium features until the end of your paid period</li>
                <li>After expiration, your account reverts to the Free tier</li>
                <li>Your data is preserved and accessible under Free tier limitations</li>
                <li>You can resubscribe at any time to restore Premium access</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">4.3 No Partial Refunds</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cancellations do not entitle you to a prorated refund for the remaining period. 
                You will continue to have access until your current billing period ends.
              </p>
            </Card>
          </motion.div>

          {/* Refund Policy */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCcw size={20} className="text-blue-500" />
                <h2 className="font-semibold text-gray-900">5. Refund Policy</h2>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">5.1 Refund Eligibility</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                We offer refunds under the following circumstances:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Within 7 days:</strong> Full refund if requested within 7 days of initial purchase</li>
                <li><strong>Technical issues:</strong> If the App is unusable due to technical problems on our end</li>
                <li><strong>Duplicate charges:</strong> Accidental duplicate billing will be refunded in full</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">5.2 Non-Refundable</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Requests made after 7 days from purchase</li>
                <li>Partial month/year usage</li>
                <li>Change of mind after the 7-day period</li>
                <li>Failure to cancel before renewal</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-4 mb-2">5.3 How to Request a Refund</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Contact us at <span className="text-emerald-600 font-medium">support@fitfork.app</span> with 
                your account email and reason for the refund request. Refunds are processed within 5-10 
                business days.
              </p>
            </Card>
          </motion.div>

          {/* User Responsibilities */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={20} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">6. User Responsibilities</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">By using FitFork, you agree to:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Provide accurate information when creating your account</li>
                <li>Keep your login credentials secure</li>
                <li>Use the App only for personal, non-commercial purposes</li>
                <li>Not attempt to reverse engineer or exploit the App</li>
                <li>Not use the App for any illegal or unauthorized purpose</li>
              </ul>
            </Card>
          </motion.div>

          {/* Health Disclaimer */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} className="text-amber-500" />
                <h2 className="font-semibold text-gray-900">7. Health Disclaimer</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                FitFork is designed for informational and tracking purposes only. It is <strong>not</strong> a 
                substitute for professional medical advice, diagnosis, or treatment. Always consult with 
                a qualified healthcare provider before making changes to your diet, exercise routine, or 
                health regimen. We are not responsible for any health decisions made based on information 
                provided by the App.
              </p>
            </Card>
          </motion.div>

          {/* Limitation of Liability */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, FitFork and its operators shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, including 
                loss of data, profits, or goodwill, arising from your use of the App. Our total 
                liability shall not exceed the amount you paid for the subscription in the 12 months 
                preceding the claim.
              </p>
            </Card>
          </motion.div>

          {/* Termination */}
          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">9. Termination</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation 
                of these terms or for any other reason at our discretion. Upon termination, your 
                right to use the App ceases immediately. If we terminate your account without cause, 
                you may be entitled to a prorated refund of your subscription.
              </p>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={20} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">10. Contact Us</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700"><strong>Email:</strong> support@fitfork.app</p>
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
