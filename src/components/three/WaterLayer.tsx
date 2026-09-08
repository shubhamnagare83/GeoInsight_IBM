import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useApp } from '../../context/AppContext';

export default function WaterLayer() {
  const { layerData, layers } = useApp();
  const waterMeshRef = useRef<THREE.Mesh>(null);

  const waterTexture = useMemo(() => {
    const res = 128;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(res, res);
    const data = imgData.data;

    const waterGrid = layerData?.water_grid;

    const gridRes = Math.sqrt(waterGrid?.length || 0) || 64;
    const waterMap = new Map<string, number>();
    if (waterGrid) {
      waterGrid.forEach((cell) => {
        const gx = Math.round(cell.x * (gridRes - 1));
        const gy = Math.round(cell.y * (gridRes - 1));
        waterMap.set(`${gx},${gy}`, cell.value);
      });
    }

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const idx = (y * res + x) * 4;
        const normX = x / (res - 1);
        const normY = y / (res - 1);

        let waterVal = 0;
        if (waterMap.size > 0) {
          const gx = Math.round(normX * (gridRes - 1));
          const gy = Math.round(normY * (gridRes - 1));
          waterVal = waterMap.get(`${gx},${gy}`) ?? 0;
        } else {
          // Brahmaputra river channel simulation
          const riverCenter = 0.5 + Math.sin(normX * 4) * 0.06;
          const riverDist = Math.abs(normY - riverCenter);
          if (riverDist < 0.05) {
            waterVal = 1.0 - riverDist / 0.05;
          }
        }

        if (waterVal > 0.05) {
          // Cyan/Blue luminous water
          data[idx] = 0;                        // R
          data[idx + 1] = Math.round(180 + waterVal * 55); // G (cyan-ish)
          data[idx + 2] = 255;                  // B
          data[idx + 3] = Math.round(waterVal * 220); // Alpha
        } else {
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [layerData]);

  // Subtle animated flow & emissive pulsation
  useFrame((state) => {
    if (waterMeshRef.current) {
      const mat = waterMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      }
    }
  });

  if (!layers.water || !waterTexture) return null;

  return (
    <mesh
      ref={waterMeshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.06, 0]}
    >
      <planeGeometry args={[29.9, 29.9, 32, 32]} />
      <meshStandardMaterial
        map={waterTexture}
        transparent
        opacity={0.88}
        emissive="#00b4d8"
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.7}
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
