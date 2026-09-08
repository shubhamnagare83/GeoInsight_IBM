import { useApp } from '../../context/AppContext';
import { X, Compass, ExternalLink, ShieldCheck, Camera, Layers } from 'lucide-react';

export default function StreetViewModal() {
  const { streetViewStation, setStreetViewStation } = useApp();

  if (!streetViewStation) return null;

  const googleMapsStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${streetViewStation.lat},${streetViewStation.lng}&heading=-45&pitch=10&fov=80`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-geo-darker/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-solid w-full max-w-4xl overflow-hidden border border-geo-cyan/40 shadow-2xl rounded-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-geo-border bg-geo-darker/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-geo-cyan/15 border border-geo-cyan/30 text-geo-cyan">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-geo-cyan tracking-wider uppercase font-mono">
                  GROUND-TRUTH STREET VIEW VERIFICATION
                </span>
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <h2 className="text-base font-bold text-geo-text">
                {streetViewStation.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsStreetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-geo-border text-xs text-geo-cyan transition-colors"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setStreetViewStation(null)}
              className="p-1.5 rounded hover:bg-white/10 text-geo-text-dim hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport: Panoramic Photography / Ground Truth Imagery */}
        <div className="relative aspect-video w-full bg-black overflow-hidden group">
          <img
            src={
              streetViewStation.panoramicUrl ||
              'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1400&q=80'
            }
            alt={streetViewStation.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Panoramic Reticle & Compass Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <div className="px-3 py-1.5 rounded bg-black/60 backdrop-blur border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-geo-cyan animate-pulse" />
                <span>HEADING: 312° NW • ELEV: {streetViewStation.elevationM}m MSL</span>
              </div>
              <div className="px-3 py-1.5 rounded bg-black/60 backdrop-blur border border-white/10 text-xs font-mono text-geo-cyan">
                LAT: {streetViewStation.lat.toFixed(5)}°N • LON: {streetViewStation.lng.toFixed(5)}°E
              </div>
            </div>

            {/* Bottom HUD bar inside Street View */}
            <div className="glass-panel-solid p-3 border border-white/15">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-geo-cyan" />
                  SATELLITE CORRELATION METRICS
                </span>
                <span className="font-mono text-geo-green">
                  NDVI SPECTRAL MATCH: {streetViewStation.ndvi.toFixed(2)}
                </span>
              </div>
              <p className="text-[0.75rem] text-slate-300 italic">
                "{streetViewStation.groundTruthNote}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-geo-darker flex items-center justify-between text-xs text-geo-text-dim border-t border-geo-border">
          <div>
            <span className="text-geo-text-muted">Instrument deployed: </span>
            <span className="text-geo-text font-mono">{streetViewStation.sensorSpecs}</span>
          </div>
          <button
            onClick={() => setStreetViewStation(null)}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            RETURN TO COMMAND CENTER
          </button>
        </div>
      </div>
    </div>
  );
}
