// ============================================================
// Fitness Connections Component - Coming Soon
// All fitness integrations temporarily disabled
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export function FitnessConnections() {
  return (
    <div className="space-y-3">
      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Coming Soon</h3>
            <p className="text-sm text-amber-600">
              Fitness App Integration
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default FitnessConnections;
