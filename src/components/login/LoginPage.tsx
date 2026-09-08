import { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import LoginGlobe from './LoginGlobe';
import StarField from './StarField';

interface LoginPageProps {
  onTransitionStart: () => void;
}

/**
 * LoginPage — Full-screen cinematic login with 3D globe.
 * Features glassmorphism card, auto-transition after 6s, manual trigger on button click.
 */
export default function LoginPage({ onTransitionStart }: LoginPageProps) {
  const [phase, setPhase] = useState<'appearing' | 'idle' | 'exiting'>('appearing');
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [showCard, setShowCard] = useState(false);

  // Fade in the login card after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-transition after 8 seconds on the login page
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      if (phase === 'appearing' || phase === 'idle') {
        handleEnter();
      }
    }, 8000);
    return () => clearTimeout(autoTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'appearing') {
      const t = setTimeout(() => setPhase('idle'), 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleEnter = useCallback(() => {
    if (phase === 'exiting') return;
    setPhase('exiting');

    // Animate transition progress 0 → 1 over 2.5 seconds
    const start = performance.now();
    const duration = 2500;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setTransitionProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onTransitionStart();
      }
    };

    requestAnimationFrame(animate);
  }, [phase, onTransitionStart]);

  return (
    <div className="login-container">
      {/* 3D Globe Canvas — Full Screen Background */}
      <div className="login-canvas-wrapper">
        <Canvas
          camera={{ position: [0, 0, 18], fov: 50 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
          }}
        >
          <color attach="background" args={['#020408']} />
          <ambientLight intensity={0.3} color="#4488cc" />
          <directionalLight position={[10, 8, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-8, 5, -5]} intensity={0.6} color="#00d4ff" />
          <pointLight position={[5, -3, 8]} intensity={0.3} color="#00e676" />

          <Suspense fallback={null}>
            <LoginGlobe transitionProgress={transitionProgress} />
            <StarField />
          </Suspense>
        </Canvas>
      </div>

      {/* Scan Line Effect */}
      <div className="login-scanlines" />

      {/* Vignette Overlay */}
      <div className="login-vignette" />

      {/* Transition Flash Overlay */}
      {phase === 'exiting' && (
        <div
          className="login-flash"
          style={{ opacity: transitionProgress > 0.6 ? (transitionProgress - 0.6) * 2.5 : 0 }}
        />
      )}

      {/* Login Card Overlay */}
      <div className={`login-overlay ${showCard ? 'login-overlay--visible' : ''} ${phase === 'exiting' ? 'login-overlay--exiting' : ''}`}>
        {/* Top branding */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
              <circle cx="12" cy="12" r="6" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              <circle cx="12" cy="12" r="2" fill="#00d4ff" />
              <path d="M12 2 L12 6" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              <path d="M12 18 L12 22" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              <path d="M2 12 L6 12" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              <path d="M18 12 L22 12" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="login-title">GEOINSIGHT</h1>
            <p className="login-subtitle">GEOSPATIAL INTELLIGENCE PLATFORM</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-dot login-card-dot--active" />
            <span>SYSTEM ACCESS</span>
          </div>

          <div className="login-card-body">
            <div className="login-field">
              <label className="login-label">OPERATOR ID</label>
              <input
                type="text"
                className="login-input"
                placeholder="Enter operator ID"
                defaultValue="GEO-ADMIN-01"
              />
            </div>

            <div className="login-field">
              <label className="login-label">ACCESS KEY</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••••"
                defaultValue="password"
              />
            </div>

            <button
              className="login-btn"
              onClick={handleEnter}
              disabled={phase === 'exiting'}
            >
              <span className="login-btn-text">
                {phase === 'exiting' ? 'INITIALIZING...' : 'INITIALIZE SYSTEM'}
              </span>
              <div className="login-btn-scanline" />
            </button>

            <div className="login-status-bar">
              <div className="login-status-dot" />
              <span>SATELLITE UPLINK: ACTIVE</span>
              <span className="login-status-ping">PING: 42ms</span>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="login-footer">
          <span>SENTINEL-2 • CHIRPS • JRC GLOBAL SURFACE WATER</span>
          <span>v2.4.0 — GEOSPATIAL ANALYSIS ENGINE</span>
        </div>
      </div>
    </div>
  );
}
