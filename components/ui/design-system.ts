// FitFork v2.0 Design System
// Luxury, Emotive, Premium UI

export const colors = {
  // Primary gradient palette
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Luxury gold accents
  gold: {
    light: '#fcd34d',
    main: '#f59e0b',
    dark: '#d97706',
    shimmer: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)',
  },
  // Glass morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.25)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const gradients = {
  // Main app gradient
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  // Luxury purple
  luxury: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  // Card backgrounds
  card: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  // Glow effects
  glow: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
  // Success
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  // Gold shimmer
  gold: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 25%, #f59e0b 50%, #fcd34d 75%, #f59e0b 100%)',
  // Sunset
  sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // Ocean
  ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  // Night
  night: 'linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 50%, #2d1b4e 100%)',
};

export const shadows = {
  // Soft shadows
  soft: '0 4px 20px rgba(0, 0, 0, 0.1)',
  medium: '0 8px 30px rgba(0, 0, 0, 0.15)',
  heavy: '0 15px 50px rgba(0, 0, 0, 0.25)',
  // Glow shadows
  glow: '0 0 30px rgba(168, 85, 247, 0.3)',
  glowStrong: '0 0 50px rgba(168, 85, 247, 0.5)',
  // Gold glow
  goldGlow: '0 0 30px rgba(245, 158, 11, 0.4)',
  // Inset
  inset: 'inset 0 2px 10px rgba(0, 0, 0, 0.1)',
  // 3D effect
  card3d: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
};

export const animations = {
  // Timing functions
  spring: { type: 'spring', stiffness: 300, damping: 20 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 15 },
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  // Common variants
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  },
  slideIn: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  pop: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  },
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
