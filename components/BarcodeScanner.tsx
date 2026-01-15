"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Flashlight } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

// Check if native BarcodeDetector is available
const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

// Minimum valid barcode length (EAN-8 is 8 digits)
const MIN_BARCODE_LENGTH = 8;

export function BarcodeScanner({ onScan, onClose, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const zxingReaderRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const scanStartTimeRef = useRef<number>(0);
  const hasScannedRef = useRef(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scannerType, setScannerType] = useState<'native' | 'zxing' | null>(null);

  // Validate barcode format
  const isValidBarcode = (code: string): boolean => {
    if (!code || code.length < MIN_BARCODE_LENGTH) return false;
    // Must be mostly numeric for food barcodes
    const numericRatio = (code.match(/\d/g) || []).length / code.length;
    return numericRatio >= 0.8;
  };

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (zxingReaderRef.current) {
      try { 
        zxingReaderRef.current.stopContinuousDecode();
        zxingReaderRef.current.reset(); 
      } catch (e) {}
      zxingReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsReady(false);
    setTorchOn(false);
    hasScannedRef.current = false;
  }, []);

  // Handle successful scan
  const handleSuccessfulScan = useCallback((barcode: string) => {
    if (hasScannedRef.current) return; // Prevent double scans
    
    // Validate barcode
    if (!isValidBarcode(barcode)) {
      console.log("❌ Invalid barcode rejected:", barcode);
      return;
    }

    // Ensure minimum time has passed since scanner started (1.5 seconds)
    const elapsed = Date.now() - scanStartTimeRef.current;
    if (elapsed < 1500) {
      console.log("⏳ Too soon, waiting...", elapsed, "ms");
      return;
    }

    hasScannedRef.current = true;
    console.log("✅ Valid barcode detected:", barcode);
    setLastScanned(barcode);
    
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    // Small delay before triggering callback to show success state
    setTimeout(() => {
      if (mountedRef.current) {
        onScan(barcode);
      }
    }, 300);
  }, [onScan]);

  // Native BarcodeDetector scanning loop
  const scanWithNative = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current || !mountedRef.current || hasScannedRef.current) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanWithNative);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const barcodes = await detectorRef.current.detect(canvas);
      if (barcodes.length > 0 && mountedRef.current && !hasScannedRef.current) {
        const barcode = barcodes[0].rawValue;
        handleSuccessfulScan(barcode);
        if (hasScannedRef.current) return; // Stop if scan was successful
      }
    } catch (err) {
      // Detection error, continue
    }

    if (mountedRef.current && !hasScannedRef.current) {
      animationRef.current = requestAnimationFrame(scanWithNative);
    }
  }, [handleSuccessfulScan]);

  // ZXing fallback - using continuous decode from video element
  const startZxingScanning = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, 300);
      zxingReaderRef.current = reader;

      // Use decodeFromVideoElementContinuously with callback
      await reader.decodeFromVideoElementContinuously(videoRef.current, (result, error) => {
        if (result && mountedRef.current && !hasScannedRef.current) {
          handleSuccessfulScan(result.getText());
        }
        // Errors are expected when no barcode is found, so we ignore them
      });
    } catch (err) {
      console.error("ZXing init failed:", err);
    }
  }, [handleSuccessfulScan]);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !isActive || !mountedRef.current) return;

    stopScanning();
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!mountedRef.current) return;

    try {
      setError(null);
      setIsScanning(true);
      hasScannedRef.current = false;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) setHasTorch(true);

      videoRef.current.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return resolve();
        const video = videoRef.current;
        if (video.readyState >= 2) return resolve();
        video.onloadeddata = () => resolve();
      });

      if (!mountedRef.current) return;

      try {
        await videoRef.current?.play();
      } catch (e: any) {
        if (e.name !== 'AbortError') throw e;
      }

      // Record start time for minimum delay check
      scanStartTimeRef.current = Date.now();
      
      // Wait a moment for camera to stabilize before starting detection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mountedRef.current) return;
      setIsReady(true);

      if (hasNativeBarcodeDetector) {
        console.log("🚀 Using native BarcodeDetector");
        setScannerType('native');
        try {
          // @ts-ignore - BarcodeDetector is not in TypeScript types yet
          detectorRef.current = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
          });
          scanWithNative();
        } catch (e) {
          console.log("Native detector failed, falling back to ZXing");
          setScannerType('zxing');
          startZxingScanning();
        }
      } else {
        console.log("📱 Using ZXing library");
        setScannerType('zxing');
        startZxingScanning();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (mountedRef.current) {
        setError(err.name === 'NotAllowedError' ? "Camera permission denied" :
                 err.name === 'NotFoundError' ? "No camera found" : "Camera access failed");
        setIsScanning(false);
      }
    }
  }, [isActive, stopScanning, scanWithNative, startZxingScanning]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Torch failed:", err);
    }
  }, [torchOn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isActive) startScanning();
    else stopScanning();
    return () => stopScanning();
  }, [isActive, startScanning, stopScanning]);

  useEffect(() => {
    if (lastScanned) {
      const timer = setTimeout(() => setLastScanned(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScanned]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm h-28">
          <div className="absolute inset-0 bg-transparent" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
          <div className="absolute inset-0 border-2 border-white/80 rounded-xl" />
          
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />

          {isReady && !lastScanned && (
            <motion.div
              className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full shadow-lg shadow-green-400/50"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className="absolute top-[20%] left-0 right-0 text-center px-4">
          <p className="text-white text-lg font-semibold drop-shadow-lg">📦 Scan Barcode</p>
          <p className="text-white/70 text-sm mt-1">
            {!isReady ? "Starting camera..." : "Position barcode inside the frame"}
          </p>
          {scannerType && isReady && (
            <p className="text-green-400/80 text-xs mt-2">
              {scannerType === 'native' ? '⚡ Fast mode active' : '📱 Compatible mode'}
            </p>
          )}
        </div>

        <div className="absolute bottom-[22%] left-0 right-0 flex justify-center">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-full"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-mono">{lastScanned}</span>
              </motion.div>
            ) : isReady ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full"
              >
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">Scanning...</span>
              </motion.div>
            ) : (
              <motion.div
                key="starting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full"
              >
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">Starting...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 left-4 safe-top w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur rounded-full text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {hasTorch && (
        <button
          onClick={toggleTorch}
          className={`absolute top-4 right-4 safe-top w-11 h-11 flex items-center justify-center backdrop-blur rounded-full z-10 transition-all ${
            torchOn ? "bg-yellow-400 text-black" : "bg-black/60 text-white"
          }`}
        >
          <Flashlight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
