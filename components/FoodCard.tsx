"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FoodIdentification } from "@/lib/ai-vision";
import { Tag, Scale, Info, Sparkles } from "lucide-react";
import Image from "next/image";

interface FoodCardProps {
  food: FoodIdentification;
  imageData?: string;
  className?: string;
}

export function FoodCard({ food, imageData, className }: FoodCardProps) {
  const confidencePercent = Math.round(food.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-lg",
        className
      )}
    >
      {/* Image section */}
      {imageData && (
        <div className="relative h-48 w-full">
          <Image
            src={imageData}
            alt={food.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Confidence badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-gray-800">
              {confidencePercent}% match
            </span>
          </motion.div>

          {/* Food name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              {food.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                {food.category}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-4">
        {!imageData && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-1">{food.name}</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {food.category}
              </span>
              <span className="text-xs text-gray-500">
                {confidencePercent}% confidence
              </span>
            </div>
          </>
        )}

        {/* Description */}
        {food.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {food.description}
          </p>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Portion estimate */}
          {food.portionEstimate && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
              <Scale className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500 block">Portion</span>
                <span className="text-sm font-medium text-gray-700">
                  {food.portionEstimate}
                </span>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
            <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <span className="text-xs text-gray-500 block">Category</span>
              <span className="text-sm font-medium text-gray-700">
                {food.category}
              </span>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {food.ingredients && food.ingredients.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ingredients
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {food.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
