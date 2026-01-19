"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Html } from "@react-three/drei";
import * as THREE from "three";

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

function Mascot() {
  const { scene } = useGLTF("/mascot.glb");
  const meshRef = useRef<THREE.Group>(null);

  // Gentle animation
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      // Slow rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Center>
      <primitive 
        ref={meshRef}
        object={scene} 
        scale={1}
      />
    </Center>
  );
}

export default function MascotScene() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-emerald-50 to-white">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
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
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
