"use client";

import { useRouter } from "next/navigation";
import { CameraView } from "@/components/CameraView";
import { useAppStore } from "@/lib/store";

export default function CameraPage() {
  const router = useRouter();
  const { setCurrentImage, setIsAnalyzing } = useAppStore();

  const handleCapture = (imageData: string) => {
    setCurrentImage(imageData);
    setIsAnalyzing(true);
    router.push("/analysis");
  };

  const handleClose = () => {
    router.back();
  };

  return <CameraView onCapture={handleCapture} onClose={handleClose} />;
}
