import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "moderate";
  if (score >= 20) return "poor";
  return "bad";
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Poor";
  return "Unhealthy";
}

export function calculateHealthScore(nutrients: {
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
}): number {
  let score = 70; // Base score

  // Positive factors
  if (nutrients.protein && nutrients.protein > 10) score += 10;
  if (nutrients.fiber && nutrients.fiber > 3) score += 10;

  // Negative factors
  if (nutrients.sugar && nutrients.sugar > 15) score -= 15;
  if (nutrients.sodium && nutrients.sodium > 500) score -= 10;
  if (nutrients.saturatedFat && nutrients.saturatedFat > 5) score -= 10;
  if (nutrients.calories && nutrients.calories > 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}
