"use client";

import { useRouter } from "next/navigation";
import { CameraView } from "@/components/CameraView";
import { useAppStore } from "@/lib/store";

export default function CameraPage() {
  const router = useRouter();
  const { setCurrentImage, setIsAnalyzing, setScannedBarcode } = useAppStore();

  const handleCapture = (imageData: string) => {
    setCurrentImage(imageData);
    setScannedBarcode(null); // Clear any previous barcode
    setIsAnalyzing(true);
    router.push("/analysis");
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    setScannedBarcode(barcode);
    setCurrentImage(null); // Clear any previous image
    setIsAnalyzing(true);
    router.push("/analysis");
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <CameraView 
      onCapture={handleCapture} 
      onBarcodeScan={handleBarcodeScan}
      onClose={handleClose} 
    />
  );
}
