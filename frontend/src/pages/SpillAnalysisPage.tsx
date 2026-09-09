import React from 'react';
import { 
  Radar, Satellite, ShieldCheck, Activity, Compass, 
  Layers, FileText, CheckCircle2, ChevronRight, BarChart2, Info, ArrowRight
} from 'lucide-react';
import { SpillIncident, PageId } from '../types';

interface SpillAnalysisPageProps {
  incident: SpillIncident;
  onNavigate: (page: PageId) => void;
}

export const SpillAnalysisPage: React.FC<SpillAnalysisPageProps> = ({
  incident,
  onNavigate,
}) => {
  const c = incident.characteristics;
  const s = incident.satellite;

  // Scientific confidence metrics breakdown
  const confidenceMetrics = [
    { label: 'SAR Capillary Wave Damping Ratio', score: 98, weight: '35%', desc: 'Damping exceeds 4.5 factor across C-band Bragg scattering wavelengths' },
    { label: 'Lookalike / Biogenic Film Rejection', score: 95, weight: '25%', desc: 'Steep boundary gradient rules out natural phytoplankton surfactants' },
    { label: 'Dual-Polarization (VV/VH) Ratio', score: 96, weight: '20%', desc: 'Polarimetric cross-ratio signature confirms mineral oil emulsification' },
    { label: 'Geometric Coherence & Continuity', score: 94, weight: '20%', desc: 'Continuous elongated plume aligned with prevailing ocean current axis' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Spill Forensic Characterization & Scientific Analysis
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              ANALYTICAL WORKSPACE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quantitative polygon morphology, Bonn Agreement oil thickness classification & sensor calibration report
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('drift')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Proceed to Drift Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Grid: Key Scientific Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surface Area & Plume Length</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{c.areaSqKm}</span>
            <span className="text-xs text-slate-500 font-semibold font-mono">km²</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
            <span>Length: {c.lengthKm} km</span>
            <span>Width: {c.widthKm} km</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Volume & Oil Type</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-blue-600 font-mono">{c.estimatedVolumeM3}</span>
            <span className="text-xs text-slate-500 font-semibold font-mono">m³ (~{Math.round(c.estimatedVolumeM3 * 6.2898).toLocaleString()} bbl)</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2 font-semibold truncate">
            {c.slickType}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Slick Age</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">~{c.estimatedAgeHours}</span>
            <span className="text-xs text-slate-500 font-semibold font-mono">Hours</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            Evaporative loss estimated at 18.2%
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detection Confidence</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{c.confidenceScore}%</span>
            <span className="text-xs text-emerald-600 font-semibold font-mono">VERY HIGH</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            False alarm probability &lt; 1.4%
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Geometry vs Sensor vs Bonn Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Polygon Geometry & Morphology Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Slick Polygon Geometry & Spatial Dimensions
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">WGS84 EPSG:4326</span>
            </div>

            {/* Polygon Geometry Vector Visualization */}
            <div className="h-64 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full" viewBox="-120 -80 240 160">
                {/* Background grid */}
                <g stroke="#1e3a5f" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="3,3">
                  <line x1="-120" y1="0" x2="120" y2="0" />
                  <line x1="0" y1="-80" x2="0" y2="80" />
                  <circle r="40" fill="none" />
                  <circle r="70" fill="none" />
                </g>

                {/* Detected oil polygon */}
                <polygon 
                  points="-75,-25 -40,-38 10,-45 55,-30 85,-15 105,8 112,28 85,38 45,46 5,38 -30,30 -65,15 -80,-5"
                  fill="#0d2847"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />

                {/* High thickness emulsion core */}
                <ellipse cx="20" cy="5" rx="45" ry="18" fill="#040b17" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3,2" />

                {/* Major axis caliper */}
                <line x1="-75" y1="-25" x2="112" y2="28" stroke="#bae6fd" strokeWidth="1" strokeDasharray="3,3" />
                <text x="18" y="-12" fill="#bae6fd" fontSize="7.5" fontWeight="600" className="font-mono">
                  8.4 km (MAJOR AXIS)
                </text>

                {/* Minor axis caliper */}
                <line x1="30" y1="-42" x2="10" y2="40" stroke="#bae6fd" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="2" fill="#bae6fd" fontSize="7.5" fontWeight="600" className="font-mono">
                  2.3 km
                </text>

                {/* Centroid coordinates marker */}
                <circle cx="20" cy="5" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              </svg>

              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
                CENTROID: {c.centroid.lat.toFixed(4)}°N, {Math.abs(c.centroid.lng).toFixed(4)}°W
              </div>
              <div className="absolute top-2 right-3 text-[10px] font-mono text-sky-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                PERIMETER: {c.perimeterKm} km
              </div>
            </div>

            {/* Geometric Characteristic Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-sans">CIRCULARITY RATIO</span>
                <span className="font-bold text-slate-900">0.32 (Linear)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-sans">ASPECT RATIO</span>
                <span className="font-bold text-slate-900">3.65 : 1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-sans">DAMPING FACTOR</span>
                <span className="font-bold text-blue-600">{c.dampingFactor}x Damped</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-sans">CONTRAST RATIO</span>
                <span className="font-bold text-slate-900">{c.darkSpotContrastRatio} dB</span>
              </div>
            </div>

            {/* Bonn Agreement Oil Appearance Code Specification */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-blue-900 flex items-center justify-between">
                <span>International Bonn Agreement Oil Appearance Code (BAOAC)</span>
                <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-mono">CODE 3</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-950">
                <strong>{c.bonnCode}</strong>. Estimated mean layer thickness ranges from 5.0 µm to 50.0 µm in the continuous emulsion core, feathering into a metallic sheen layer (&lt; 0.3 µm) at the peripheral boundary.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sensor Metadata & Detection Confidence Gauge (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Scientific Detection Confidence Gauge Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Detection Confidence Vector
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {c.confidenceScore}% OVERALL
              </span>
            </div>

            <div className="space-y-3">
              {confidenceMetrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{m.label}</span>
                    <span className="font-mono font-bold text-blue-600">{m.score}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Satellite Instrument Calibration Card */}
          <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sky-400 font-bold uppercase tracking-wider text-[11px]">
                Satellite Mission Parameters
              </span>
              <span className="text-slate-400 text-[10px]">COPERNICUS DATA</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Spacecraft Platform</span>
                <span className="text-slate-100 font-semibold">{s.satellite}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Radar Payload / Band</span>
                <span className="text-slate-100 font-semibold">{s.sensor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Beam Acquisition Mode</span>
                <span className="text-slate-100 font-semibold">{s.mode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Polarization Channel</span>
                <span className="text-sky-300 font-semibold">{s.polarization}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Spatial Pixel Posting</span>
                <span className="text-slate-100 font-semibold">{s.resolution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Mid-Swath Incidence Angle</span>
                <span className="text-slate-100 font-semibold">{s.incidenceAngle}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Ground Track Pass</span>
                <span className="text-slate-100 font-semibold">{s.passDirection} (Orbit #{s.orbitNumber})</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onNavigate('drift')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <span>Proceed to Drift Prediction & Backtracking →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
