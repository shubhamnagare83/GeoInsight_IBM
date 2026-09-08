import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useApp } from '../../context/AppContext';

export default function DistrictBoundary() {
  const { layerData, layers } = useApp();
  const lineRef = useRef<THREE.LineLoop>(null);

  const { points } = useMemo(() => {
    const coords = layerData?.boundary?.geometry?.coordinates?.[0] || [
      [91.30, 26.35], [91.35, 26.40], [91.45, 26.42], [91.55, 26.40],
      [91.65, 26.42], [91.75, 26.38], [91.85, 26.35], [91.90, 26.30],
      [91.95, 26.22], [91.98, 26.15], [91.95, 26.08], [91.90, 26.02],
      [91.85, 25.98], [91.78, 25.95], [91.70, 25.93], [91.60, 25.92],
      [91.50, 25.93], [91.42, 25.96], [91.35, 26.00], [91.30, 26.05],
      [91.27, 26.12], [91.25, 26.20], [91.26, 26.28], [91.30, 26.35],
    ];

    // District bounds for Kamrup
    const minLng = 91.25;
    const maxLng = 91.98;
    const minLat = 25.92;
    const maxLat = 26.42;
    const midLng = (minLng + maxLng) / 2;
    const midLat = (minLat + maxLat) / 2;

    const scale = 30; // map size scale matching terrain

    const pts: THREE.Vector3[] = coords.map(([lng, lat]) => {
      // Map to [-15, 15] range
      const x = ((lng - midLng) / (maxLng - minLng)) * scale * 0.75;
      const z = -((lat - midLat) / (maxLat - minLat)) * scale * 0.75;
      const y = 0.85; // slightly elevated above terrain
      return new THREE.Vector3(x, y, z);
    });

    return { points: pts, centerOffset: [0, 0, 0] };
  }, [layerData]);

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  // Subtle pulsing glowing boundary animation
  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.opacity = 0.75 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25;
      }
    }
  });

  if (!layers.boundary) return null;

  return (
    <group>
      {/* Primary glowing boundary line */}
      <lineLoop ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#00d4ff"
          linewidth={2}
          transparent
          opacity={0.9}
        />
      </lineLoop>

      {/* Secondary outer boundary halo line */}
      <lineLoop geometry={lineGeometry} position={[0, -0.05, 0]}>
        <lineBasicMaterial
          color="#00e676"
          linewidth={1}
          transparent
          opacity={0.35}
        />
      </lineLoop>

      {/* Vertical boundary light curtains at key boundary vertices */}
      {points.filter((_, idx) => idx % 4 === 0).map((pt, i) => (
        <mesh key={i} position={[pt.x, pt.y + 0.4, pt.z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
