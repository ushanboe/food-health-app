"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  useLogo?: boolean;
  rightAction?: ReactNode;
}

export function PageHeader({ 
  icon: Icon, 
  iconColor = "text-white",
  title, 
  subtitle,
  useLogo = false,
  rightAction
}: PageHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            {useLogo ? (
              <Image
                src="/icons/icon.svg"
                alt="FitFork"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            ) : Icon ? (
              <Icon size={32} className={iconColor} />
            ) : null}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          {rightAction && (
            <div className="flex items-center">
              {rightAction}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
