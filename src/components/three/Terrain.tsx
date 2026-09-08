import { useMemo } from 'react';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';

export default function Terrain() {
  const { layerData } = useApp();

  const { geometry, texture } = useMemo(() => {
    const resolution = layerData?.terrain_heightmap?.length || 64;
    const geom = new THREE.PlaneGeometry(30, 30, resolution - 1, resolution - 1);
    
    // Apply heightmap displacement
    const pos = geom.attributes.position;
    const heightmap = layerData?.terrain_heightmap;

    if (heightmap && heightmap.length > 0) {
      for (let i = 0; i < pos.count; i++) {
        const row = Math.floor(i / resolution);
        const col = i % resolution;
        if (heightmap[row] && heightmap[row][col] !== undefined) {
          // Displace Z (which will be Y when rotated)
          pos.setZ(i, heightmap[row][col] * 3.5);
        }
      }
    } else {
      // Default procedural elevation
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const distFromCenter = Math.sqrt(x * x + y * y) / 15;
        const elevation =
          Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.8 +
          Math.sin(x * 0.7 + 1.2) * 0.4 +
          (1 - Math.min(distFromCenter, 1)) * 0.5;
        pos.setZ(i, Math.max(0, elevation));
      }
    }

    geom.computeVertexNormals();

    // Create high-tech dark satellite terrain procedural canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base dark earth / satellite tones
      const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 350);
      grad.addColorStop(0, '#101a24');
      grad.addColorStop(0.5, '#0c141d');
      grad.addColorStop(1, '#070b10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Subtle terrain texture noise / topography lines
      ctx.strokeStyle = 'rgba(26, 45, 66, 0.4)';
      ctx.lineWidth = 1;
      for (let r = 20; r < 360; r += 24) {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Geospatial subtle coordinate grid lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

    return { geometry: geom, texture: tex };
  }, [layerData]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      {/* Main Terrain Surface */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          metalness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Subtle Coordinate wireframe underlay */}
      <mesh geometry={geometry} position={[0, 0, -0.02]}>
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}
