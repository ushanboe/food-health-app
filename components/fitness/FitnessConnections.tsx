// ============================================================
// Fitness Connections Component - Coming Soon
// All fitness integrations temporarily disabled
// ============================================================

'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Watch,
  Bike,
  Heart,
  Clock,
} from 'lucide-react';

// Provider display info
const PROVIDERS = [
  {
    id: 'strava',
    name: 'Strava',
    icon: <Bike className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Running, cycling & swimming',
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Activities & health data',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: <Watch className="w-5 h-5" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: 'Activities & health metrics',
  },
  {
    id: 'google_fit',
    name: 'Google Fit',
    icon: <Activity className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Steps, workouts & calories',
  },
];

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
              Fitness integrations are being rebuilt for better reliability
            </p>
          </div>
        </div>
      </motion.div>

      {/* Provider Cards - All Disabled */}
      {PROVIDERS.map((provider, index) => (
        <motion.div
          key={provider.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/60 rounded-xl p-4 border border-gray-100 opacity-60"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${provider.bgColor} rounded-lg ${provider.color}`}>
                {provider.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{provider.name}</h4>
                <p className="text-sm text-gray-500">{provider.description}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
              Coming Soon
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default FitnessConnections;
