import React, { useState, useMemo } from 'react';
import { 
  Waves, Ship, Search, Filter, AlertTriangle, 
  Clock, Compass, ArrowUpDown, ChevronRight, Eye, CheckCircle2, ArrowRight
} from 'lucide-react';
import { SpillIncident, PageId, VesselAttribution } from '../types';
import { OceanMap } from '../components/OceanMap';

interface AisIntelligencePageProps {
  incident: SpillIncident;
  selectedVessel: VesselAttribution | null;
  onSelectVessel: (vessel: VesselAttribution | null) => void;
  onNavigate: (page: PageId) => void;
}

export const AisIntelligencePage: React.FC<AisIntelligencePageProps> = ({
  incident,
  selectedVessel,
  onSelectVessel,
  onNavigate,
}) => {
  const [searchMmsi, setSearchMmsi] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [maxDistanceNM, setMaxDistanceNM] = useState<number>(30);
  const [onlyAnomalies, setOnlyAnomalies] = useState<boolean>(false);
  const [timeWindowHours, setTimeWindowHours] = useState<number>(18);

  // Filtered vessel list
  const filteredVessels = useMemo(() => {
    const vessels = incident?.vessels || [];
    const query = (searchMmsi || '').trim().toLowerCase();

    return vessels.filter(v => {
      if (!v) return false;
      if (query) {
        const nameMatch = v.name ? v.name.toLowerCase().includes(query) : false;
        const mmsiMatch = v.mmsi ? String(v.mmsi).includes(query) : false;
        if (!nameMatch && !mmsiMatch) {
          return false;
        }
      }
      if (selectedType !== 'ALL' && v.type !== selectedType) {
        return false;
      }
      if (v.evidence && v.evidence.distanceAtOriginNM > maxDistanceNM) {
        return false;
      }
      if (onlyAnomalies && (!v.evidence?.behaviorAnomalies || v.evidence.behaviorAnomalies.length === 0)) {
        return false;
      }
      return true;
    });
  }, [incident?.vessels, searchMmsi, selectedType, maxDistanceNM, onlyAnomalies]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AIS Maritime Traffic & Spatiotemporal Interrogator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              AIS CORRELATOR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing commercial vessel trajectories, kinematic anomalies and speed profiles around suspected spill origin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('attribution')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Proceed to Vessel Attribution</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AIS Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>AIS Interrogation Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* MMSI / Vessel Name Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search MMSI or Name..."
              value={searchMmsi}
              onChange={(e) => setSearchMmsi(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Vessel Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Vessel Types</option>
              <option value="Crude Oil Tanker">Crude Oil Tanker</option>
              <option value="Product Tanker">Product Tanker</option>
              <option value="Bulk Carrier">Bulk Carrier</option>
              <option value="Container Ship">Container Ship</option>
              <option value="Offshore Supply Vessel">Offshore Supply Vessel</option>
            </select>
          </div>

          {/* Search Radius Slider */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium">Radius:</span>
            <input 
              type="range"
              min="5"
              max="50"
              value={maxDistanceNM}
              onChange={(e) => setMaxDistanceNM(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="font-mono font-bold text-xs text-blue-600 w-12 text-right">{maxDistanceNM}NM</span>
          </div>

          {/* Time Window Selector */}
          <div>
            <select
              value={timeWindowHours}
              onChange={(e) => setTimeWindowHours(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={6}>Time Window: ±6 Hours</option>
              <option value={12}>Time Window: ±12 Hours</option>
              <option value={18}>Time Window: ±18 Hours</option>
              <option value={24}>Time Window: ±24 Hours</option>
            </select>
          </div>

          {/* Anomaly Checkbox */}
          <label className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer">
            <input 
              type="checkbox"
              checked={onlyAnomalies}
              onChange={(e) => setOnlyAnomalies(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span className="font-semibold text-red-600">Only Anomaly Flags</span>
          </label>
        </div>
      </div>

      {/* Main AIS Map Viewport (Primary Visual Focus) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">AIS Vessel Track Corroboration Around Spill Origin</h2>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Showing <strong className="text-blue-600">{filteredVessels.length}</strong> correlated vessels
          </div>
        </div>

        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-300">
          <OceanMap
            incident={incident}
            selectedVessel={selectedVessel}
            onSelectVessel={onSelectVessel}
            showControls={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* AIS Vessel Telemetry Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Correlated Vessel Telemetry & AIS Kinematics
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Ranked by Spatiotemporal Proximity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Vessel / Flag</th>
                <th className="py-2.5 px-3">MMSI / IMO</th>
                <th className="py-2.5 px-3">Ship Type</th>
                <th className="py-2.5 px-3">Origin Distance</th>
                <th className="py-2.5 px-3">Time Delta</th>
                <th className="py-2.5 px-3">Speed at Origin</th>
                <th className="py-2.5 px-3">Behavioral Anomaly</th>
                <th className="py-2.5 px-3 text-right">Attribution</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredVessels.map(v => {
                const isSelected = selectedVessel?.mmsi === v.mmsi;
                return (
                  <tr 
                    key={v.mmsi}
                    onClick={() => onSelectVessel(v)}
                    className={`hover:bg-blue-50/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Ship className={`w-3.5 h-3.5 ${v.rank === 1 ? 'text-red-500' : 'text-blue-600'}`} />
                        <span>{v.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{v.flag} ({v.flagCode})</span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div>{v.mmsi}</div>
                      <div className="text-[10px] text-slate-400">IMO {v.imo}</div>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-700">
                      {v.type}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      {v.evidence.distanceAtOriginNM} NM
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {v.evidence.timeDifferenceMinutes > 0 ? `+${v.evidence.timeDifferenceMinutes}m` : `${v.evidence.timeDifferenceMinutes}m`}
                    </td>

                    <td className="py-3 px-3">
                      <span className={v.evidence.speedDropDetected ? 'text-red-600 font-bold' : 'text-slate-700'}>
                        {v.evidence.speedAtOriginKnots} kts
                      </span>
                      <span className="text-[10px] text-slate-400 block">(Avg: {v.evidence.averageVoyageSpeedKnots} kts)</span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {v.evidence.behaviorAnomalies.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{v.evidence.behaviorAnomalies[0]}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal Passage</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className={`px-2 py-1 rounded font-bold text-xs ${
                        v.rank === 1 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {v.overallScore}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVessel(v);
                          onNavigate('attribution');
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-sans font-semibold transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
