import { useState } from 'react';
import { Database, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const DATA_SOURCES = [
  {
    name: 'District Boundary',
    source: 'geoBoundaries',
    url: 'https://www.geoboundaries.org/',
    description: 'Open-source administrative boundaries',
  },
  {
    name: 'Vegetation (NDVI)',
    source: 'Copernicus Sentinel-2',
    url: 'https://sentinel.esa.int/web/sentinel/missions/sentinel-2',
    description: 'B8 (NIR) and B4 (Red) bands',
  },
  {
    name: 'Rainfall',
    source: 'CHIRPS',
    url: 'https://www.chc.ucsb.edu/data/chirps',
    description: 'Climate Hazards Group precipitation',
  },
  {
    name: 'Surface Water',
    source: 'JRC Global Surface Water',
    url: 'https://global-surface-water.appspot.com/',
    description: 'European Commission JRC dataset',
  },
];

export default function DataSourcePanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 cursor-pointer bg-transparent border-none text-left"
      >
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-geo-text-muted" />
          <span className="label-xs text-geo-text-dim">DATA SOURCES</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-geo-text-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-geo-text-muted" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 flex flex-col gap-2.5 animate-fade-in">
          {DATA_SOURCES.map((ds) => (
            <div key={ds.name} className="flex items-start gap-2.5">
              <div className="w-1 h-1 rounded-full bg-geo-cyan mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-geo-text">{ds.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.65rem] text-geo-cyan hover:underline flex items-center gap-1"
                  >
                    {ds.source}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[0.6rem] text-geo-text-muted mt-0.5">
                  {ds.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
