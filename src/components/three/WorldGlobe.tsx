import { useRef, useMemo, useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import StarField from '../login/StarField';
import { useApp } from '../../context/AppContext';

// ─── Districts of Assam with approximate lat/lng ───────────────
const ASSAM_DISTRICTS = [
  { id: 'kamrup', name: 'Kamrup', lat: 26.14, lng: 91.67 },
  { id: 'nagaon', name: 'Nagaon', lat: 26.35, lng: 92.69 },
  { id: 'sonitpur', name: 'Sonitpur', lat: 26.77, lng: 92.98 },
  { id: 'dibrugarh', name: 'Dibrugarh', lat: 27.47, lng: 94.91 },
  { id: 'jorhat', name: 'Jorhat', lat: 26.76, lng: 94.22 },
  { id: 'goalpara', name: 'Goalpara', lat: 26.17, lng: 90.62 },
  { id: 'barpeta', name: 'Barpeta', lat: 26.32, lng: 91.0 },
  { id: 'darrang', name: 'Darrang', lat: 26.45, lng: 92.02 },
  { id: 'cachar', name: 'Cachar', lat: 24.82, lng: 92.78 },
  { id: 'tinsukia', name: 'Tinsukia', lat: 27.49, lng: 95.36 },
];

// Convert lat/lng to 3D sphere position
function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── India highlight region ─────────────────────────────────
function IndiaHighlight({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = latLngToSphere(22.5, 78.5, 5.02);

  useFrame((state) => {
    if (meshRef.current && visible) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      position={pos}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <circleGeometry args={[0.6, 32]} />
      <meshBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── District markers on globe ──────────────────────────────
function DistrictMarkers({
  visible,
  onSelect,
  selectedId,
}: {
  visible: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {ASSAM_DISTRICTS.map((d) => {
        const pos = latLngToSphere(d.lat, d.lng, 5.06);
        const isSelected = selectedId === d.id;
        return (
          <group key={d.id} position={pos}>
            {/* Marker pin */}
            <mesh
              onClick={(e) => { e.stopPropagation(); onSelect(d.id); }}
            >
              <sphereGeometry args={[isSelected ? 0.08 : 0.05, 12, 12]} />
              <meshBasicMaterial
                color={isSelected ? '#00e676' : '#00d4ff'}
              />
            </mesh>
            {/* Glow ring */}
            <mesh>
              <ringGeometry args={[isSelected ? 0.1 : 0.07, isSelected ? 0.14 : 0.09, 24]} />
              <meshBasicMaterial
                color={isSelected ? '#00e676' : '#00d4ff'}
                transparent
                opacity={isSelected ? 0.6 : 0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Globe Earth mesh ───────────────────────────────────────
function EarthMesh() {
  const earthRef = useRef<THREE.Mesh>(null);

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#081420');
    oceanGrad.addColorStop(0.3, '#0a1e35');
    oceanGrad.addColorStop(0.5, '#0c2440');
    oceanGrad.addColorStop(0.7, '#0a1e35');
    oceanGrad.addColorStop(1, '#081420');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Ocean depth variation
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = 15 + Math.random() * 60;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(8, 32, 58, 0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Continents
    const drawLandmass = (cx: number, cy: number, w: number, h: number, rot: number, color?: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      const base = color || '#14301f';
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.65);
      grad.addColorStop(0, base);
      grad.addColorStop(0.5, base);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      const pts = 14;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const nr = 0.55 + Math.sin(a * 3 + cx * 0.01) * 0.2 + Math.cos(a * 5 + cy * 0.01) * 0.18;
        const px = Math.cos(a) * w * nr;
        const py = Math.sin(a) * h * nr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Major continents (scaled for 2048 width)
    // North America
    drawLandmass(380, 260, 170, 140, -0.15);
    drawLandmass(350, 350, 100, 70, 0.1);
    drawLandmass(420, 200, 60, 50, -0.1);
    // Central America
    drawLandmass(400, 400, 40, 50, 0.3);
    // South America
    drawLandmass(510, 580, 90, 160, 0.1);
    drawLandmass(490, 530, 60, 70, -0.05);
    // Europe
    drawLandmass(1000, 240, 100, 70, 0.05);
    drawLandmass(1040, 280, 60, 40, -0.1);
    drawLandmass(970, 200, 50, 35, 0.1);
    // Africa
    drawLandmass(1020, 480, 120, 170, -0.05);
    drawLandmass(1000, 400, 80, 60, 0.05);
    // Asia
    drawLandmass(1240, 260, 240, 140, -0.1);
    drawLandmass(1400, 380, 140, 100, 0.15);
    drawLandmass(1180, 350, 80, 60, 0.05);
    // India (highlighted area)
    drawLandmass(1280, 430, 60, 80, 0.05, '#1a4028');
    // Southeast Asia
    drawLandmass(1440, 520, 120, 50, 0.2);
    // Australia
    drawLandmass(1560, 640, 100, 70, -0.1);
    drawLandmass(1540, 620, 70, 50, 0.05);
    // Russia / Siberia
    drawLandmass(1300, 160, 200, 60, -0.05);
    // Greenland
    drawLandmass(530, 130, 50, 70, -0.1);
    // Antarctica
    drawLandmass(1024, 960, 400, 60, 0);

    // Ice caps
    ctx.fillStyle = 'rgba(180, 210, 230, 0.3)';
    ctx.fillRect(0, 0, 2048, 60);
    ctx.fillStyle = 'rgba(180, 210, 230, 0.25)';
    ctx.fillRect(0, 970, 2048, 54);

    // City lights
    const cities = [
      [390, 290], [360, 340], [420, 260], // NA
      [1000, 250], [1020, 260], [1040, 270], [980, 280], // EU
      [1020, 440], [1040, 500], // AF
      [1280, 260], [1320, 290], [1360, 340], [1400, 360], // Asia
      [1280, 420], [1270, 440], // India
      [1560, 630], // AU
      [510, 560], [520, 600], // SA
    ];
    cities.forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      g.addColorStop(0, 'rgba(255, 200, 80, 0.5)');
      g.addColorStop(0.5, 'rgba(255, 160, 40, 0.15)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
    });

    // Lat/Lng grid
    ctx.strokeStyle = 'rgba(0, 180, 220, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 2048; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
    }
    for (let y = 0; y < 1024; y += 128) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 128, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.6}
          metalness={0.15}
          emissive="#081828"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[5.4, 64, 64]} />
        <shaderMaterial
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vec3 viewDir = normalize(-vPosition);
              float fresnel = 1.0 - dot(viewDir, vNormal);
              fresnel = pow(fresnel, 3.5);
              vec3 color = vec3(0.0, 0.6, 1.0) * fresnel * 1.2;
              gl_FragColor = vec4(color, fresnel * 0.5);
            }
          `}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ─── Camera controller for zoom transitions ──────────────────
function CameraController({ targetPosition, targetLookAt }: {
  targetPosition: THREE.Vector3;
  targetLookAt: THREE.Vector3;
}) {
  const { camera } = useThree();
  const isTransitioning = useRef(true);
  const prevTarget = useRef(targetPosition);

  useEffect(() => {
    if (!prevTarget.current.equals(targetPosition)) {
      isTransitioning.current = true;
      prevTarget.current = targetPosition;
    }
  }, [targetPosition]);

  useFrame(() => {
    if (isTransitioning.current) {
      camera.position.lerp(targetPosition, 0.05);
      camera.lookAt(targetLookAt);
      if (camera.position.distanceTo(targetPosition) < 0.08) {
        isTransitioning.current = false;
      }
    }
  });

  return null;
}

// ─── Rotating globe container that keeps markers synced ──────
function GlobeObject({
  zoomLevel,
  onIndiaClick,
  onDistrictSelect,
  district,
}: {
  zoomLevel: 'world' | 'india' | 'assam';
  onIndiaClick: () => void;
  onDistrictSelect: (id: string) => void;
  district: string;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (globeGroupRef.current && zoomLevel === 'world') {
      globeGroupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={globeGroupRef}>
      <EarthMesh />
      <IndiaHighlight
        visible={zoomLevel === 'world' || zoomLevel === 'india'}
        onClick={onIndiaClick}
      />
      <DistrictMarkers
        visible={zoomLevel === 'assam'}
        onSelect={onDistrictSelect}
        selectedId={district}
      />
    </group>
  );
}

// ─── Main WorldGlobe Component ──────────────────────────────
export default function WorldGlobe() {
  const { district, setDistrict } = useApp();
  const [zoomLevel, setZoomLevel] = useState<'world' | 'india' | 'assam'>('world');

  const cameraTarget = useMemo(() => {
    switch (zoomLevel) {
      case 'world':
        return {
          position: new THREE.Vector3(0, 0, 18),
          lookAt: new THREE.Vector3(0, 0, 0),
        };
      case 'india':
        return {
          position: new THREE.Vector3(-4, 2, 9),
          lookAt: new THREE.Vector3(-4, 1, 0),
        };
      case 'assam':
        return {
          position: new THREE.Vector3(-5, 3, 6),
          lookAt: new THREE.Vector3(-5, 2, 0),
        };
    }
  }, [zoomLevel]);

  const handleIndiaClick = useCallback(() => {
    setZoomLevel('india');
    setTimeout(() => setZoomLevel('assam'), 1500);
  }, []);

  const handleDistrictSelect = useCallback((id: string) => {
    setDistrict(id);
  }, [setDistrict]);

  const handleBack = useCallback(() => {
    if (zoomLevel === 'assam') setZoomLevel('india');
    else setZoomLevel('world');
  }, [zoomLevel]);

  return (
    <div className="canvas-container relative w-full h-full bg-[#020408] select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <color attach="background" args={['#020408']} />
        <ambientLight intensity={0.35} color="#4488cc" />
        <directionalLight position={[10, 8, 5]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-8, 5, -5]} intensity={0.5} color="#00d4ff" />

        <CameraController
          targetPosition={cameraTarget.position}
          targetLookAt={cameraTarget.lookAt}
        />

        <Suspense fallback={null}>
          <GlobeObject
            zoomLevel={zoomLevel}
            onIndiaClick={handleIndiaClick}
            onDistrictSelect={handleDistrictSelect}
            district={district}
          />
          <StarField />
        </Suspense>

        <OrbitControls
          enableRotate
          enableZoom
          enablePan={false}
          minDistance={6}
          maxDistance={30}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Zoom Level HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {zoomLevel !== 'world' && (
          <button
            onClick={handleBack}
            className="glass-panel px-3 py-1.5 text-xs font-semibold text-geo-cyan hover:text-white
                       border border-geo-cyan/30 hover:border-geo-cyan/60 transition-all cursor-pointer
                       flex items-center gap-1.5"
          >
            ← BACK
          </button>
        )}
        <div className="glass-panel px-3 py-1.5 text-xs font-mono text-geo-text-dim">
          {zoomLevel === 'world' && '🌍 WORLD VIEW — Click India to zoom'}
          {zoomLevel === 'india' && '🇮🇳 INDIA — Zooming to Assam...'}
          {zoomLevel === 'assam' && `📍 ASSAM — Selected: ${ASSAM_DISTRICTS.find(d => d.id === district)?.name || district}`}
        </div>
      </div>

      {/* District list panel for Assam level */}
      {zoomLevel === 'assam' && (
        <div className="absolute top-16 left-4 z-10 glass-panel-solid p-3 max-h-[300px] overflow-y-auto w-48">
          <div className="label-xs text-geo-cyan mb-2">DISTRICTS</div>
          {ASSAM_DISTRICTS.map((d) => (
            <button
              key={d.id}
              onClick={() => handleDistrictSelect(d.id)}
              className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all cursor-pointer mb-0.5 border-none bg-transparent ${
                district === d.id
                  ? 'bg-geo-cyan/15 text-geo-cyan font-semibold'
                  : 'text-geo-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
