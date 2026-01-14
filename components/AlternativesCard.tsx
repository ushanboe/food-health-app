"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lightbulb, ArrowRight, Leaf } from "lucide-react";

interface AlternativesCardProps {
  currentFood: string;
  alternatives: string[];
  className?: string;
}

export function AlternativesCard({ currentFood, alternatives, className }: AlternativesCardProps) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(
        "bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 shadow-lg border border-emerald-100",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Healthier Alternatives</h3>
          <p className="text-xs text-gray-500">Try these instead of {currentFood}</p>
        </div>
      </div>

      {/* Alternatives list */}
      <div className="space-y-2">
        {alternatives.map((alternative, index) => (
          <motion.div
            key={alternative}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 flex-1">
              {alternative}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-white/50 rounded-xl">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium text-emerald-600">💡 Tip:</span> Swapping to healthier alternatives can help reduce calories, increase nutrients, and improve overall health.
        </p>
      </div>
    </motion.div>
  );
}
