// Fitness Sync Hooks - Coming Soon
// All integrations temporarily disabled

export function useFitnessConnections() {
  return {
    connections: [],
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
}

export function useFitnessActivities() {
  return {
    activities: [],
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
}

export function useFitnessSync() {
  return {
    sync: async () => {},
    isLoading: false,
    error: null,
  };
}
