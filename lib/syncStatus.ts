// Sync status tracking for cloud sync visibility

export interface SyncRecord {
  id: string;
  timestamp: string;
  type: 'upload' | 'download' | 'full';
  status: 'success' | 'failed' | 'partial';
  details: {
    foodDiary: { uploaded: number; downloaded: number };
    weightEntries: { uploaded: number; downloaded: number };
    goals: { uploaded: number; downloaded: number };
    recipes: { uploaded: number; downloaded: number };
    profile: { synced: boolean };
  };
  duration: number; // milliseconds
  error?: string;
}

export interface SyncStatus {
  lastSync: string | null;
  lastSyncStatus: 'success' | 'failed' | 'partial' | 'never';
  syncHistory: SyncRecord[];
  isSyncing: boolean;
  totalItemsSynced: number;
}

const SYNC_HISTORY_KEY = 'fitfork_sync_history';
const MAX_HISTORY_ITEMS = 20;

// Get sync history from localStorage
export function getSyncHistory(): SyncRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SYNC_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save sync record
export function saveSyncRecord(record: SyncRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getSyncHistory();
    history.unshift(record); // Add to beginning
    // Keep only last N records
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save sync record:', e);
  }
}

// Get current sync status
export function getSyncStatus(): SyncStatus {
  const history = getSyncHistory();
  const lastRecord = history[0];
  
  let totalItemsSynced = 0;
  history.forEach(record => {
    if (record.status === 'success' || record.status === 'partial') {
      const d = record.details;
      totalItemsSynced += 
        d.foodDiary.uploaded + d.foodDiary.downloaded +
        d.weightEntries.uploaded + d.weightEntries.downloaded +
        d.goals.uploaded + d.goals.downloaded +
        d.recipes.uploaded + d.recipes.downloaded +
        (d.profile.synced ? 1 : 0);
    }
  });

  return {
    lastSync: lastRecord?.timestamp || null,
    lastSyncStatus: lastRecord?.status || 'never',
    syncHistory: history,
    isSyncing: false,
    totalItemsSynced,
  };
}

// Format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return then.toLocaleDateString();
}

// Clear sync history
export function clearSyncHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_HISTORY_KEY);
}
