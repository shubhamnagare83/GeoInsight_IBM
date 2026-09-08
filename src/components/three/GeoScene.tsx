import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Terrain from './Terrain';
import DistrictBoundary from './DistrictBoundary';
import NDVILayer from './NDVILayer';
import WaterLayer from './WaterLayer';
import RainfallLayer from './RainfallLayer';
import Atmosphere from './Atmosphere';
import MapHUD from './MapHUD';
import { useApp } from '../../context/AppContext';

// Smooth cinematic camera fly-in
function CameraController() {
  const { camera } = useThree();
  const { isLoading, isComplete } = useApp();
  const targetPos = useRef(new THREE.Vector3(0, 18, 22));
  const isAnimating = useRef(true);

  useEffect(() => {
    // Initial camera position high in orbit
    camera.position.set(0, 36, 38);
    camera.lookAt(0, 0, 0);
    isAnimating.current = true;
  }, [camera]);

  // When analysis triggers or finishes, do a gentle cinematic sweep
  useEffect(() => {
    if (isLoading) {
      targetPos.current.set(4, 22, 24);
      isAnimating.current = true;
    } else if (isComplete) {
      targetPos.current.set(0, 16, 20);
      isAnimating.current = true;
    }
  }, [isLoading, isComplete]);

  useFrame(() => {
    if (isAnimating.current) {
      camera.position.lerp(targetPos.current, 0.04);
      camera.lookAt(0, 0, 0);
      if (camera.position.distanceTo(targetPos.current) < 0.1) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

export default function GeoScene() {
  return (
    <div className="canvas-container relative w-full h-full bg-[#05080e] select-none overflow-hidden">
      {/* 3D Map Viewport */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <color attach="background" args={['#05080e']} />
        <fog attach="fog" args={['#05080e', 25, 65]} />

        <PerspectiveCamera makeDefault position={[0, 32, 36]} fov={45} />
        <CameraController />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.45} color="#c2e0ff" />
        <directionalLight
          position={[15, 25, 15]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          color="#ffffff"
        />
        {/* Environmental Rim / Cyber Cyan Accent Light */}
        <pointLight position={[-15, 10, -15]} intensity={0.8} color="#00d4ff" />
        <pointLight position={[15, 8, -10]} intensity={0.5} color="#00e676" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            <Terrain />
            <DistrictBoundary />
            <NDVILayer />
            <WaterLayer />
            <RainfallLayer />
            <Atmosphere />
          </group>
        </Suspense>

        {/* Intuitive Satellite Controls: Left rotate, Scroll zoom, Right pan */}
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          maxPolarAngle={Math.PI / 2.1} // prevent going below terrain
          minDistance={8}
          maxDistance={45}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Futuristic Map HUD Overlay */}
      <MapHUD />
    </div>
  );
}
