import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useApp } from '../../context/AppContext';

export default function NDVILayer() {
  const { layerData, layers } = useApp();
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const res = 128;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(res, res);
    const data = imgData.data;

    const ndviGrid = layerData?.ndvi_grid;
    const avgNdvi = layerData ? 0.58 : 0.58;

    // Build lookup grid
    const gridRes = Math.sqrt(ndviGrid?.length || 0) || 64;
    const gridMap = new Map<string, number>();
    if (ndviGrid) {
      ndviGrid.forEach((cell) => {
        const gx = Math.round(cell.x * (gridRes - 1));
        const gy = Math.round(cell.y * (gridRes - 1));
        gridMap.set(`${gx},${gy}`, cell.value);
      });
    }

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const idx = (y * res + x) * 4;
        const normX = x / (res - 1);
        const normY = y / (res - 1);

        let val = avgNdvi;
        if (gridMap.size > 0) {
          const gx = Math.round(normX * (gridRes - 1));
          const gy = Math.round(normY * (gridRes - 1));
          val = gridMap.get(`${gx},${gy}`) ?? avgNdvi;
        } else {
          val =
            avgNdvi +
            Math.sin(normX * 6) * 0.15 +
            Math.cos(normY * 5) * 0.1;
        }

        // Vegetation color map:
        // val < 0.2: brown/yellow (barren / low) -> [160, 110, 40]
        // val 0.2 - 0.5: yellow/green (moderate) -> [190, 200, 30]
        // val 0.5 - 0.75: vibrant green -> [46, 184, 46]
        // val > 0.75: dark lush green -> [15, 105, 30]

        let r = 0, g = 0, b = 0, a = 180;

        if (val < 0.1) {
          // Non-vegetated / water / urban
          r = 90; g = 75; b = 50; a = 70;
        } else if (val < 0.3) {
          // Low vegetation: Brown to Yellowish
          const t = (val - 0.1) / 0.2;
          r = Math.round(150 + t * 40);
          g = Math.round(110 + t * 50);
          b = Math.round(45 - t * 20);
          a = 150;
        } else if (val < 0.55) {
          // Moderate vegetation: Yellow to Yellow-Green
          const t = (val - 0.3) / 0.25;
          r = Math.round(190 - t * 110);
          g = Math.round(160 + t * 40);
          b = Math.round(25 + t * 20);
          a = 175;
        } else if (val < 0.75) {
          // Good vegetation: Green
          const t = (val - 0.55) / 0.2;
          r = Math.round(80 - t * 55);
          g = Math.round(200 - t * 30);
          b = Math.round(45 + t * 10);
          a = 190;
        } else {
          // High vegetation: Dark Emerald Green
          const t = Math.min((val - 0.75) / 0.25, 1);
          r = Math.round(25 - t * 15);
          g = Math.round(170 - t * 65);
          b = Math.round(55 - t * 25);
          a = 210;
        }

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

  // Subtle opacity oscillation for dynamic live scan look
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = 0.82 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      }
    }
  });

  if (!layers.ndvi || !texture) return null;

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
    >
      <planeGeometry args={[29.8, 29.8, 32, 32]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.85}
        roughness={0.7}
        metalness={0.1}
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
