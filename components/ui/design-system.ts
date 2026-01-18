/**
 * FitFork v2.1 Design System
 * Minimalistic, Clean, Gallery-like Experience
 * Inspired by: Too Good To Go, Notion, Apple iOS
 */

// Color Palette - Clean & Minimal with warm green accent
export const colors = {
  // Backgrounds - Light & Airy
  bg: {
    primary: "#FFFFFF",
    secondary: "#F8F9FA",
    tertiary: "#F1F3F5",
  },
  
  // Text - Clear hierarchy
  text: {
    primary: "#1A1A1A",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },
  
  // Brand - Fresh green (like Too Good To Go)
  brand: {
    primary: "#00A86B",
    light: "#E6F7F1",
    dark: "#008F5B",
  },
  
  // Accent - Warm tones
  accent: {
    orange: "#FF6B35",
    amber: "#F59E0B",
    coral: "#FF8A80",
  },
  
  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

// Shadows - Soft neumorphism
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 2px 8px rgba(0, 0, 0, 0.06)",
  lg: "0 4px 16px rgba(0, 0, 0, 0.08)",
  xl: "0 8px 32px rgba(0, 0, 0, 0.10)",
};

// Border Radius - Soft & Friendly
export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
};

// Animation - Subtle & Purposeful
export const transitions = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "400ms ease",
};

// Framer Motion Variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 },
};
