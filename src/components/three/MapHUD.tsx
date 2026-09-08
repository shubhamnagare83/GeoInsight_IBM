import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Crosshair, Radio, Shield } from 'lucide-react';

export default function MapHUD() {
  const { month, isComplete, isLoading, district } = useApp();
  const [coords, setCoords] = useState({ lat: 26.1705, lng: 91.6152 });

  // Subtle real-time telemetry jitter for satellite sensor realism
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        lat: Number((26.1705 + (Math.random() - 0.5) * 0.0004).toFixed(4)),
        lng: Number((91.6152 + (Math.random() - 0.5) * 0.0004).toFixed(4)),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formattedMonth = month.toUpperCase().replace('-', ' / ');

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10 select-none">
      {/* Top HUD Bar */}
      <div className="flex items-start justify-between">
        {/* Top-Left: District & Region Target */}
        <div className="glass-panel px-3.5 py-2 pointer-events-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-geo-cyan/10 border border-geo-cyan/30 text-geo-cyan">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wider text-geo-text">
                {district.toUpperCase()} DISTRICT
              </span>
              <span className="text-[0.6rem] px-1.5 py-0.2 rounded bg-geo-cyan/15 text-geo-cyan border border-geo-cyan/30 font-mono">
                GEO-ID: AS-KMP
              </span>
            </div>
            <p className="text-[0.65rem] text-geo-text-muted font-medium tracking-wide">
              ASSAM, INDIA • BRAHMAPUTRA BASIN
            </p>
          </div>
        </div>

        {/* Top-Right: Target Temporal Period & Analysis Status */}
        <div className="glass-panel px-3.5 py-2 pointer-events-auto text-right">
          <div className="flex items-center justify-end gap-2">
            <Radio className="w-3.5 h-3.5 text-geo-green animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-geo-text font-mono">
              {formattedMonth}
            </span>
          </div>
          <p className="text-[0.65rem] text-geo-cyan tracking-wider font-semibold">
            {isLoading ? 'SPATIAL PROCESSING IN PROGRESS' : isComplete ? 'ANALYSIS COMPLETE' : 'STANDBY MODE'}
          </p>
        </div>
      </div>

      {/* Center Reticle Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full border border-dashed border-geo-cyan flex items-center justify-center animate-spin-slow">
          <div className="w-2 h-2 rounded-full bg-geo-cyan" />
        </div>
        <span className="text-[0.55rem] font-mono tracking-widest text-geo-cyan mt-1">KAMRUP OBSERVATION ZONE</span>
      </div>

      {/* Bottom HUD Bar */}
      <div className="flex items-end justify-between">
        {/* Bottom-Left: Live Satellite Coordinates & Altitude */}
        <div className="glass-panel px-3 py-2 pointer-events-auto font-mono text-[0.68rem] text-geo-text-dim flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-geo-cyan">
            <Compass className="w-3.5 h-3.5" />
            <span className="font-semibold">SENSOR TELEMETRY</span>
          </div>
          <div className="flex gap-3">
            <span>LAT: <strong className="text-geo-text">{coords.lat}° N</strong></span>
            <span>LON: <strong className="text-geo-text">{coords.lng}° E</strong></span>
            <span className="hidden sm:inline">ALT: <strong className="text-geo-text">786 KM (LEO)</strong></span>
          </div>
        </div>

        {/* Bottom-Right: Active Sensor Feeds */}
        <div className="glass-panel px-3 py-2 pointer-events-auto text-right">
          <div className="flex items-center justify-end gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-geo-cyan" />
            <span className="label-xs text-geo-text-dim">ACTIVE SENSOR FEEDS</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end text-[0.6rem] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sentinel-2 (B4/B8)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              CHIRPS v2.0
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              JRC Water
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
