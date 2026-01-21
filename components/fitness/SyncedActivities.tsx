// ============================================================
// Synced Activities Component - Coming Soon
// Fitness sync integrations temporarily disabled
// ============================================================

'use client';

import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SyncedActivitiesProps {
  date?: string;
}

export function SyncedActivities({ date }: SyncedActivitiesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-sm text-gray-500 font-medium">Synced Activities</p>
      </div>
      
      <Card padding="md" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800">Coming Soon</h4>
            <p className="text-sm text-amber-600">
              Fitness App Integration
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SyncedActivities;
