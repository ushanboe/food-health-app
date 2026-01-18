"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been moved to /cloud-sync
// This redirect ensures old bookmarks and links still work
export default function CloudRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cloud-sync");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Redirecting to Cloud Sync...</p>
      </div>
    </div>
  );
}
