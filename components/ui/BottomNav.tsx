"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Book, Camera, Dumbbell, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/diary", icon: Book, label: "Diary" },
  { href: "/camera", icon: Camera, label: "Scan" },
  { href: "/fitness", icon: Dumbbell, label: "Fitness" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show nav on camera or analysis pages
  if (pathname === "/camera" || pathname === "/analysis") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className="flex flex-col items-center py-2 px-3 rounded-xl"
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className={`p-2 rounded-xl transition-colors duration-200 ${
                        isActive ? "bg-emerald-100" : ""
                      }`}
                      animate={isActive ? { scale: 1 } : { scale: 1 }}
                    >
                      <Icon
                        size={22}
                        className={`transition-colors duration-200 ${
                          isActive ? "text-emerald-600" : "text-gray-400"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </motion.div>
                    <span
                      className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                        isActive ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white/90" />
    </nav>
  );
}
