"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RotateCcw, Zap, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // Check camera permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      setFlash(true);

      setTimeout(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          onCapture(imageSrc);
        }
        setIsCapturing(false);
        setFlash(false);
      }, 150);
    }
  }, [onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          onCapture(result);
        };
        reader.readAsDataURL(file);
      }
    },
    [onCapture]
  );

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };

  return (
    <div className="camera-viewfinder">
      {/* Flash effect */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-50"
          />
        )}
      </AnimatePresence>

      {/* Camera feed */}
      {hasPermission === true && (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover"
          screenshotQuality={0.92}
        />
      )}

      {/* Permission denied state */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
          <Camera className="w-16 h-16 mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
          <p className="text-gray-400 text-center mb-6">
            Please allow camera access to scan food items, or upload an image instead.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-full text-white font-medium"
          >
            <ImageIcon className="w-5 h-5" />
            Upload Image
          </button>
        </div>
      )}

      {/* Loading state */}
      {hasPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Viewfinder overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner brackets */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-l-4 border-t-4 border-white/70 rounded-tl-3xl" />
        <div className="absolute top-1/4 right-1/4 w-16 h-16 border-r-4 border-t-4 border-white/70 rounded-tr-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border-l-4 border-b-4 border-white/70 rounded-bl-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-r-4 border-b-4 border-white/70 rounded-br-3xl" />

        {/* Center guide text */}
        <div className="absolute top-1/3 left-0 right-0 text-center">
          <p className="text-white/80 text-sm font-medium drop-shadow-lg">
            Position food in frame
          </p>
        </div>
      </div>

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 safe-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white btn-press"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleCamera}
              className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white btn-press"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-bottom">
        <div className="flex items-center justify-center gap-8 pb-8 pt-4">
          {/* Gallery button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full text-white btn-press"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          {/* Capture button */}
          <motion.button
            onClick={capture}
            disabled={isCapturing || hasPermission !== true}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center btn-press",
              "bg-white border-4 border-green-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </motion.button>

          {/* Flash toggle (placeholder) */}
          <button
            className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full text-white btn-press opacity-50"
            disabled
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>

        {/* Hint text */}
        <p className="text-center text-white/60 text-xs pb-4">
          Tap the button to capture
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
