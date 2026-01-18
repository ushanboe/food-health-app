// FitFork v2.0 Haptic Feedback System
// Provides tactile feedback for touch interactions

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
  selection: [5],
};

export const haptic = (style: HapticStyle = 'light'): void => {
  // Check if vibration API is available
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(hapticPatterns[style]);
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }
};

// Convenience functions
export const hapticLight = () => haptic('light');
export const hapticMedium = () => haptic('medium');
export const hapticHeavy = () => haptic('heavy');
export const hapticSuccess = () => haptic('success');
export const hapticWarning = () => haptic('warning');
export const hapticError = () => haptic('error');
export const hapticSelection = () => haptic('selection');

// Touch feedback with visual + haptic
export const touchFeedback = (style: HapticStyle = 'light') => {
  haptic(style);
};
