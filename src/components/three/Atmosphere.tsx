import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function Atmosphere() {
  const ringsRef = useRef<THREE.Group>(null);

  // Rotating orbital coordinate rings around the district
  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const particles = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  return (
    <group>
      {/* Subtle floating telemetry points */}
      <points geometry={particles}>
        <pointsMaterial
          size={0.12}
          color="#00d4ff"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>

      {/* Orbiting coordinate ring overlay */}
      <group ref={ringsRef} position={[0, 0.1, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[18, 18.05, 64]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[22, 22.03, 64]} />
          <meshBasicMaterial color="#00e676" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
