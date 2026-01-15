"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Flashlight } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export function BarcodeScanner({ onScan, onClose, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch (e) {
        // Ignore reset errors
      }
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !isActive || !mountedRef.current) return;

    // Stop any existing scanning first
    stopScanning();

    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!mountedRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Configure hints for faster scanning - focus on common food barcodes
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,      // Most common for food products
        BarcodeFormat.EAN_8,       // Smaller food items
        BarcodeFormat.UPC_A,       // US products
        BarcodeFormat.UPC_E,       // Compressed UPC
        BarcodeFormat.CODE_128,    // Some food products
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, 300);
      readerRef.current = reader;

      // Get camera with optimal settings for barcode scanning
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) {
        setHasTorch(true);
      }

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not found"));
            return;
          }
          
          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(e);
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // If already loaded
          if (video.readyState >= 1) {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          }
        });

        if (!mountedRef.current) return;

        // Play video with error handling
        try {
          await videoRef.current.play();
        } catch (playError: any) {
          // AbortError is common and usually harmless - ignore it
          if (playError.name !== 'AbortError') {
            throw playError;
          }
          console.log("Play interrupted, continuing...");
        }
      }

      if (!mountedRef.current || !videoRef.current) return;

      // Start continuous decoding
      let lastBarcode = "";
      reader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result && mountedRef.current) {
          const barcode = result.getText();
          if (barcode && barcode !== lastBarcode) {
            lastBarcode = barcode;
            console.log("✅ Barcode detected:", barcode);
            setLastScanned(barcode);
            // Vibrate on successful scan
            if (navigator.vibrate) {
              navigator.vibrate([50, 30, 50]);
            }
            onScan(barcode);
          }
        }
        // Ignore NotFoundException - it's normal when no barcode in view
      });

    } catch (err: any) {
      console.error("Failed to start barcode scanner:", err);
      if (mountedRef.current) {
        if (err.name === 'NotAllowedError') {
          setError("Camera permission denied");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found");
        } else {
          setError("Camera access failed");
        }
        setIsScanning(false);
      }
    }
  }, [isActive, onScan, stopScanning]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Torch toggle failed:", err);
    }
  }, [torchOn]);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Start/stop scanning based on isActive
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

  // Reset lastScanned after delay to allow re-scanning same barcode
  useEffect(() => {
    if (lastScanned) {
      const timer = setTimeout(() => setLastScanned(null), 2000);
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
        autoPlay
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Darkened areas */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Clear scanning area - wider for barcodes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32">
          <div className="absolute inset-0 bg-transparent" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />

          {/* Scanning frame */}
          <div className="absolute inset-0 border-2 border-white/80 rounded-lg" />

          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />

          {/* Scanning line animation */}
          <motion.div
            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
            animate={{ top: ["20%", "80%", "20%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Instructions */}
        <div className="absolute top-1/4 left-0 right-0 text-center px-4">
          <p className="text-white text-base font-medium drop-shadow-lg">
            📦 Point at barcode
          </p>
          <p className="text-white/70 text-xs mt-1">
            Hold steady • Good lighting helps
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
        className="absolute top-4 left-4 safe-top w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white pointer-events-auto z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Torch button (if available) */}
      {hasTorch && (
        <button
          onClick={toggleTorch}
          className={`absolute top-4 right-4 safe-top w-10 h-10 flex items-center justify-center backdrop-blur-sm rounded-full pointer-events-auto z-10 transition-colors ${
            torchOn ? "bg-yellow-500 text-black" : "bg-black/50 text-white"
          }`}
        >
          <Flashlight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
