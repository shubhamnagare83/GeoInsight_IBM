import { useApp } from '../context/AppContext';
import MetricCard from './MetricCard';
import { Leaf, CloudRain, Droplets, Waves } from 'lucide-react';

export default function MetricsPanel() {
  const { environmentData } = useApp();

  const ndvi = environmentData?.vegetation.average_ndvi ?? null;
  const rainfall = environmentData?.rainfall.value_mm ?? null;
  const waterPct = environmentData?.surface_water.coverage_percent ?? null;
  const waterArea = environmentData?.surface_water.area_km2 ?? null;

  return (
    <div className="metrics-panel flex gap-3 p-3 overflow-x-auto">
      <MetricCard
        icon={<Leaf className="w-4 h-4" />}
        label="VEGETATION"
        sublabel="Average NDVI"
        value={ndvi}
        unit=""
        decimals={2}
        color="text-geo-green"
        delay={0}
      />
      <MetricCard
        icon={<CloudRain className="w-4 h-4" />}
        label="RAINFALL"
        sublabel="Spatial Mean"
        value={rainfall}
        unit="mm"
        decimals={0}
        color="text-geo-blue"
        delay={100}
      />
      <MetricCard
        icon={<Droplets className="w-4 h-4" />}
        label="SURFACE WATER"
        sublabel="Coverage"
        value={waterPct}
        unit="%"
        decimals={1}
        color="text-geo-cyan"
        delay={200}
      />
      <MetricCard
        icon={<Waves className="w-4 h-4" />}
        label="WATER AREA"
        sublabel="Total Surface"
        value={waterArea}
        unit="km²"
        decimals={1}
        color="text-sky-400"
        delay={300}
      />
    </div>
  );
}
