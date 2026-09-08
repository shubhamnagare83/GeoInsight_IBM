import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * LoginGlobe — A stunning 3D Earth sphere with:
 *  - Procedural continents & oceans via custom shaders
 *  - Atmospheric rim glow (Fresnel scattering)
 *  - Animated cloud layer
 *  - Holographic data points on the surface
 *  - Orbital rings & satellite trails
 */
export default function LoginGlobe({ transitionProgress = 0 }: { transitionProgress?: number }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const dataPointsRef = useRef<THREE.Points>(null);

  // ─── Earth procedural texture ─────────────────────────────
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ocean base — deep dark blue gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a1628');
    oceanGrad.addColorStop(0.3, '#0d2137');
    oceanGrad.addColorStop(0.5, '#0f2a45');
    oceanGrad.addColorStop(0.7, '#0d2137');
    oceanGrad.addColorStop(1, '#0a1628');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Add ocean depth variation
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 40;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(8, 32, 58, 0.3)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Procedural continents — realistic-ish land masses
    const drawContinent = (cx: number, cy: number, w: number, h: number, rotation: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      const landGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.6);
      landGrad.addColorStop(0, '#1a3a28');
      landGrad.addColorStop(0.4, '#14301f');
      landGrad.addColorStop(0.7, '#1a3520');
      landGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = landGrad;
      ctx.beginPath();

      // Organic shape using bezier curves
      const points = 12;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noiseR = 0.6 + Math.sin(angle * 3 + cx) * 0.2 + Math.cos(angle * 5 + cy) * 0.15;
        const px = Math.cos(angle) * w * noiseR;
        const py = Math.sin(angle) * h * noiseR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Mountain/elevation highlights
      const highGrad = ctx.createRadialGradient(w * 0.1, -h * 0.1, 0, 0, 0, w * 0.3);
      highGrad.addColorStop(0, 'rgba(40, 65, 35, 0.6)');
      highGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = highGrad;
      ctx.fill();

      ctx.restore();
    };

    // North America
    drawContinent(200, 140, 85, 70, -0.15);
    drawContinent(180, 180, 50, 35, 0.1);
    // South America
    drawContinent(260, 300, 45, 80, 0.1);
    // Europe
    drawContinent(500, 130, 55, 40, 0.05);
    // Africa
    drawContinent(510, 250, 60, 85, -0.05);
    // Asia (large mass)
    drawContinent(620, 140, 120, 70, -0.1);
    drawContinent(700, 200, 70, 50, 0.15);
    // India
    drawContinent(640, 230, 30, 40, 0.05);
    // Southeast Asia / Indonesia
    drawContinent(720, 280, 60, 25, 0.2);
    // Australia
    drawContinent(780, 330, 50, 35, -0.1);
    // Additional landmasses for density
    drawContinent(550, 160, 35, 25, 0.1);
    drawContinent(680, 120, 40, 25, -0.05);

    // Polar ice caps
    const iceGrad = ctx.createLinearGradient(0, 0, 0, 40);
    iceGrad.addColorStop(0, 'rgba(180, 210, 230, 0.35)');
    iceGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, 0, 1024, 35);

    const iceGradS = ctx.createLinearGradient(0, 475, 0, 512);
    iceGradS.addColorStop(0, 'transparent');
    iceGradS.addColorStop(1, 'rgba(180, 210, 230, 0.3)');
    ctx.fillStyle = iceGradS;
    ctx.fillRect(0, 475, 1024, 37);

    // City lights (glowing dots on land)
    const cityPositions = [
      [195, 155], [180, 170], [210, 145], // NA cities
      [500, 145], [515, 140], [520, 150], [490, 155], // Europe
      [510, 230], [520, 260], // Africa
      [640, 140], [660, 150], [680, 170], [700, 190], // Asia
      [640, 225], [635, 235], // India
      [780, 325], // Australia
      [260, 290], [265, 310], // S America
    ];
    cityPositions.forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
      g.addColorStop(0, 'rgba(255, 200, 80, 0.6)');
      g.addColorStop(0.5, 'rgba(255, 160, 40, 0.2)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
    });

    // Grid lines (lat/lon) — very subtle
    ctx.strokeStyle = 'rgba(0, 180, 220, 0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // ─── Cloud layer texture ─────────────────────────────
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, 1024, 512);

    // Wispy cloud patches
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = 60 + Math.random() * 390;
      const w = 30 + Math.random() * 100;
      const h = 10 + Math.random() * 30;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, w);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.03 + Math.random() * 0.06})`);
      grad.addColorStop(0.5, `rgba(220, 240, 255, ${0.01 + Math.random() * 0.03})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x - w, y - h, w * 2, h * 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // ─── Atmospheric glow material ─────────────────────────
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#00d4ff') },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - dot(viewDir, vNormal);
          fresnel = pow(fresnel, 3.0) * uIntensity;
          
          vec3 innerGlow = uColor * fresnel * 1.5;
          vec3 outerGlow = vec3(0.1, 0.4, 0.8) * pow(fresnel, 1.5) * 0.5;
          
          gl_FragColor = vec4(innerGlow + outerGlow, fresnel * 0.7);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // ─── Holographic data points on globe ─────────────────
  const dataPointsGeo = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const radius = 5.05;

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geom;
  }, []);

  const dataPointsMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vAlpha = sin(uTime * 2.0 + aPhase) * 0.5 + 0.5;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (3.0 + vAlpha * 3.0) * (100.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(0.0, 0.83, 1.0, glow * vAlpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // ─── Animation loop ───────────────────────────────────
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = 1 + transitionProgress * 7; // thrilling speedup during transition

    // Camera fly-in transition: hyperspace dive into the globe surface!
    if (transitionProgress > 0) {
      const targetZ = 18 - transitionProgress * 11.6; // fly from 18 to 6.4
      const targetY = transitionProgress * 1.4;
      const targetX = -transitionProgress * 2.0;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.15);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.15);
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.15);
      state.camera.lookAt(0, 0, 0);
    } else {
      // Gentle mouse parallax depth when idle
      const targetCamX = state.pointer.x * 1.5;
      const targetCamY = state.pointer.y * 1.2;
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.04);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.04);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 18, 0.04);
      state.camera.lookAt(0, 0, 0);
    }

    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.08 * speed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.06 * speed;
      cloudsRef.current.rotation.x = Math.sin(t * 0.02) * 0.02;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = t * 0.03;
      const pulseIntensity = (0.9 + Math.sin(t * 0.8) * 0.15) * (1 + transitionProgress * 2.5);
      (glowRef.current.material as THREE.ShaderMaterial).uniforms.uIntensity.value = pulseIntensity;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.15 * speed;
      ringsRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    if (dataPointsRef.current) {
      dataPointsRef.current.rotation.y = t * 0.08 * speed;
      (dataPointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
          emissive="#0a1a2f"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Cloud layer — slightly larger sphere */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[5.08, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.6}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh ref={glowRef} material={atmosphereMaterial}>
        <sphereGeometry args={[5.6, 64, 64]} />
      </mesh>

      {/* Second thinner atmospheric layer */}
      <mesh>
        <sphereGeometry args={[5.3, 64, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Holographic data points */}
      <points ref={dataPointsRef} geometry={dataPointsGeo} material={dataPointsMat} />

      {/* Orbital rings */}
      <group ref={ringsRef}>
        {/* Ring 1 — equatorial */}
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
          <torusGeometry args={[7.5, 0.015, 16, 128]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} />
        </mesh>
        {/* Ring 2 — inclined */}
        <mesh rotation={[Math.PI / 3, -0.5, 0.4]}>
          <torusGeometry args={[8.2, 0.01, 16, 128]} />
          <meshBasicMaterial color="#00e676" transparent opacity={0.15} />
        </mesh>
        {/* Ring 3 — polar-ish */}
        <mesh rotation={[0.2, 0.8, Math.PI / 2.5]}>
          <torusGeometry args={[9, 0.008, 16, 128]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.1} />
        </mesh>

        {/* Satellite dots on rings */}
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]} position={[7.5, 0, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        <mesh rotation={[Math.PI / 3, -0.5, 0.4]} position={[8.2, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#00e676" />
        </mesh>
      </group>
    </group>
  );
}
