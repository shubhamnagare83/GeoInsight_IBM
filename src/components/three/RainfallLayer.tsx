import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useApp } from '../../context/AppContext';

export default function RainfallLayer() {
  const { layerData, layers } = useApp();
  const rainRef = useRef<THREE.Mesh>(null);

  const rainTexture = useMemo(() => {
    const res = 128;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(res, res);
    const data = imgData.data;

    const rainGrid = layerData?.rainfall_grid;
    const gridRes = Math.sqrt(rainGrid?.length || 0) || 64;
    const rainMap = new Map<string, number>();
    if (rainGrid) {
      rainGrid.forEach((cell) => {
        const gx = Math.round(cell.x * (gridRes - 1));
        const gy = Math.round(cell.y * (gridRes - 1));
        rainMap.set(`${gx},${gy}`, cell.value);
      });
    }

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const idx = (y * res + x) * 4;
        const normX = x / (res - 1);
        const normY = y / (res - 1);

        let intensity = 0.5;
        if (rainMap.size > 0) {
          const gx = Math.round(normX * (gridRes - 1));
          const gy = Math.round(normY * (gridRes - 1));
          intensity = rainMap.get(`${gx},${gy}`) ?? 0.5;
        } else {
          intensity = 0.5 + Math.sin(normX * Math.PI) * 0.25 + Math.cos(normY * 2) * 0.15;
        }

        // Rainfall heatmap color gradient:
        // Deep blue -> indigo -> purple-magenta
        const r = Math.round(50 + intensity * 120);
        const g = Math.round(70 + (1 - intensity) * 80);
        const b = Math.round(180 + intensity * 70);
        const a = Math.round(intensity * 140);

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [layerData]);

  // Subtle wave oscillation for precipitation cloud
  useFrame((state) => {
    if (rainRef.current) {
      rainRef.current.position.y = 0.12 + Math.sin(state.clock.elapsedTime * 1.8) * 0.02;
    }
  });

  if (!layers.rainfall || !rainTexture) return null;

  return (
    <mesh
      ref={rainRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.12, 0]}
    >
      <planeGeometry args={[29.8, 29.8, 32, 32]} />
      <meshStandardMaterial
        map={rainTexture}
        transparent
        opacity={0.65}
        roughness={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
