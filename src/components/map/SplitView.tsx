import GeoScene from '../three/GeoScene';
import GoogleMapViewer from './GoogleMapViewer';
import { Box, Globe } from 'lucide-react';

export default function SplitView() {
  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative divide-y md:divide-y-0 md:divide-x divide-geo-border">
      {/* Left: 3D Digital Twin View */}
      <div className="flex-1 h-1/2 md:h-full relative overflow-hidden">
        <div className="absolute top-3 left-3 z-10 glass-panel px-2.5 py-1 text-xs font-bold text-geo-cyan flex items-center gap-1.5 border border-geo-cyan/30 shadow-lg pointer-events-none">
          <Box className="w-3.5 h-3.5" />
          <span>3D DIGITAL TWIN & ELEVATION</span>
        </div>
        <GeoScene />
      </div>

      {/* Right: Google Satellite GIS Engine */}
      <div className="flex-1 h-1/2 md:h-full relative overflow-hidden">
        <div className="absolute top-3 left-3 z-10 glass-panel px-2.5 py-1 text-xs font-bold text-geo-green flex items-center gap-1.5 border border-geo-green/30 shadow-lg pointer-events-none">
          <Globe className="w-3.5 h-3.5" />
          <span>GOOGLE SATELLITE GIS ENGINE</span>
        </div>
        <GoogleMapViewer />
      </div>
    </div>
  );
}
