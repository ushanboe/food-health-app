"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export function BarcodeScanner({ onScan, onClose, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !isActive) return;

    try {
      setError(null);
      setIsScanning(true);

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const videoInputDevices = await reader.listVideoInputDevices();

      // Prefer back camera
      const backCamera = videoInputDevices.find(
        (device) => device.label.toLowerCase().includes("back") || 
                    device.label.toLowerCase().includes("rear") ||
                    device.label.toLowerCase().includes("environment")
      );

      const deviceId = backCamera?.deviceId || videoInputDevices[0]?.deviceId;

      if (!deviceId) {
        setError("No camera found");
        setIsScanning(false);
        return;
      }

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            if (barcode !== lastScanned) {
              setLastScanned(barcode);
              // Vibrate on successful scan if supported
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
              onScan(barcode);
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Barcode scan error:", err);
          }
        }
      );
    } catch (err) {
      console.error("Failed to start barcode scanner:", err);
      setError("Failed to access camera");
      setIsScanning(false);
    }
  }, [isActive, lastScanned, onScan]);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, startScanning, stopScanning]);

  // Reset lastScanned after a delay to allow re-scanning same barcode
  useEffect(() => {
    if (lastScanned) {
      const timer = setTimeout(() => setLastScanned(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScanned]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-black">
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Darkened areas */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Clear scanning area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40">
          {/* Cut out the scanning area */}
          <div className="absolute inset-0 bg-transparent" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />

          {/* Scanning frame */}
          <div className="absolute inset-0 border-2 border-white/70 rounded-lg" />

          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />

          {/* Scanning line animation */}
          <motion.div
            className="absolute left-2 right-2 h-0.5 bg-green-500 shadow-lg shadow-green-500/50"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Instructions */}
        <div className="absolute top-1/4 left-0 right-0 text-center">
          <p className="text-white text-sm font-medium drop-shadow-lg">
            Align barcode within frame
          </p>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-1/4 left-0 right-0 flex justify-center">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/90 rounded-full"
              >
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm">{error}</span>
              </motion.div>
            ) : lastScanned ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/90 rounded-full"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-mono">{lastScanned}</span>
              </motion.div>
            ) : isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
              >
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">Scanning...</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 safe-top w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
