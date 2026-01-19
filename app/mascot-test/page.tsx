"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";

// Loading component
function LoadingScreen() {
  return (
    <div className="h-[70vh] w-full bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading 3D Model...</p>
        <p className="text-gray-400 text-sm">This may take a moment (54MB)</p>
      </div>
    </div>
  );
}

// 3D Scene component - only rendered on client
function MascotSceneInner() {
  const { Canvas, useFrame } = require("@react-three/fiber");
  const { OrbitControls, useGLTF, Environment, Center, Html } = require("@react-three/drei");
  const THREE = require("three");

  function Mascot() {
    const { scene } = useGLTF("/mascot.glb");
    const meshRef = useRef<any>(null);

    useFrame((state: any) => {
      if (meshRef.current) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      }
    });

    return (
      <Center>
        <primitive ref={meshRef} object={scene} scale={1} />
      </Center>
    );
  }

  function LoadingSpinner() {
    return (
      <Html center>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading model...</p>
        </div>
      </Html>
    );
  }

  return (
    <div className="h-[70vh] w-full bg-gradient-to-b from-emerald-50 to-white">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        
        <Suspense fallback={<LoadingSpinner />}>
          <Mascot />
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

// Dynamically import to avoid SSR
const MascotScene = dynamic(
  () => Promise.resolve(MascotSceneInner),
  { ssr: false, loading: () => <LoadingScreen /> }
);

export default function MascotTestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PageContainer>
      <Header title="3D Mascot Test" showBack />

      <PageContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-[70vh]"
        >
          {mounted ? <MascotScene /> : <LoadingScreen />}
        </motion.div>

        <div className="p-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">🎮 Controls</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Drag</strong> to rotate the model</li>
              <li>• <strong>Pinch/Scroll</strong> to zoom in/out</li>
              <li>• Model has gentle floating animation</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 mt-3 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2">📊 Model Info</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• File: mascot.glb</li>
              <li>• Size: ~54MB</li>
              <li>• Format: glTF Binary</li>
            </ul>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
