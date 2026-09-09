import React, { useState } from 'react';
import { 
  Satellite, Upload, Sliders, CheckCircle2, ShieldAlert, 
  Layers, Eye, RefreshCw, ZoomIn, ZoomOut, Info, ArrowRight, Activity
} from 'lucide-react';
import { SpillIncident, PageId } from '../types';

interface SpillDetectionPageProps {
  incident: SpillIncident;
  onNavigate: (page: PageId) => void;
}

export const SpillDetectionPage: React.FC<SpillDetectionPageProps> = ({
  incident,
  onNavigate,
}) => {
  const [activeOverlay, setActiveOverlay] = useState<'slick_overlay' | 'raw_sar' | 'binary_mask'>('slick_overlay');
  const [thresholdDb, setThresholdDb] = useState<number>(-7.8);
  const [minPixelCluster, setMinPixelCluster] = useState<number>(150);
  const [biogenicFilter, setBiogenicFilter] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleReanalyze = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Satellite Spill Detection & Characterization
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              SAR LEVEL-1 GRD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated synthetic aperture radar (SAR) dark-spot detection, capillary wave damping analysis & boundary extraction
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="detection-reprocess-btn"
            onClick={handleReanalyze}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isProcessing ? 'Segmenting...' : 'Re-run Detection'}</span>
          </button>

          <button
            id="detection-proceed-to-analysis-btn"
            onClick={() => onNavigate('analysis')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Analytical Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Image Viewport, Right Detection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Satellite Imagery Viewer & Detection Result (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">{incident.satellite.satellite}</span>
                <span className="text-[11px] font-mono text-slate-400">({incident.satellite.resolution})</span>
              </div>

              {/* Display Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setActiveOverlay('slick_overlay')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeOverlay === 'slick_overlay' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Detected Slick
                </button>
                <button
                  onClick={() => setActiveOverlay('raw_sar')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeOverlay === 'raw_sar' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Raw SAR Backscatter
                </button>
                <button
                  onClick={() => setActiveOverlay('binary_mask')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeOverlay === 'binary_mask' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Segmentation Mask
                </button>
              </div>
            </div>

            {/* Simulated Satellite SAR Raster Viewport with Vector Overlay */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mt-3" style={{ height: '420px' }}>
              <svg 
                className="w-full h-full" 
                viewBox="0 0 640 420"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* SAR speckle noise texture simulation */}
                  <pattern id="sarSpeckle" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="#0c1a2e" />
                    <circle cx="8" cy="12" r="1.5" fill="#1e3a5f" opacity="0.6" />
                    <circle cx="28" cy="6" r="1.8" fill="#294b7a" opacity="0.5" />
                    <circle cx="20" cy="28" r="1.2" fill="#1e3a5f" opacity="0.7" />
                    <circle cx="34" cy="24" r="1.6" fill="#2b4f80" opacity="0.5" />
                    <circle cx="12" cy="36" r="1.4" fill="#183152" opacity="0.8" />
                    <line x1="0" y1="20" x2="40" y2="20" stroke="#0ea5e9" strokeWidth="0.3" strokeOpacity="0.08" />
                  </pattern>

                  {/* Dark oil slick low backscatter fill */}
                  <radialGradient id="sarOilDamping" cx="50%" cy="48%" r="60%">
                    <stop offset="0%" stopColor="#040912" />
                    <stop offset="60%" stopColor="#08101f" />
                    <stop offset="100%" stopColor="#0f2038" />
                  </radialGradient>

                  {/* Boundary pulse animation filter */}
                  <filter id="boundaryGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* SAR Base Background */}
                <rect width="640" height="420" fill="url(#sarSpeckle)" />

                {/* Ocean swell wave pattern lines in background */}
                <g stroke="#1e3a5f" strokeWidth="0.7" strokeOpacity="0.4">
                  {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400].map(y => (
                    <path key={y} d={`M 0,${y} Q 160,${y-10} 320,${y} T 640,${y-5}`} fill="none" />
                  ))}
                </g>

                {/* Coordinate Crosshairs */}
                <g stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="4,4">
                  <line x1="320" y1="0" x2="320" y2="420" />
                  <line x1="0" y1="210" x2="640" y2="210" />
                </g>

                {/* Oil Slick Boundary Polygon in Viewport */}
                {activeOverlay !== 'raw_sar' && (
                  <g id="detected-slick-geometry">
                    {/* Dark absorption zone */}
                    <path 
                      d="M 180,180 Q 230,130 340,150 T 480,220 Q 520,260 490,290 T 360,300 Q 240,310 180,260 Z"
                      fill={activeOverlay === 'binary_mask' ? '#000000' : 'url(#sarOilDamping)'}
                      stroke={activeOverlay === 'binary_mask' ? '#ffffff' : '#0284c7'}
                      strokeWidth={activeOverlay === 'binary_mask' ? '2' : '2.5'}
                      filter={activeOverlay === 'slick_overlay' ? 'url(#boundaryGlow)' : undefined}
                      className={activeOverlay === 'slick_overlay' ? 'transition-all duration-300' : ''}
                    />

                    {/* Denser inner core emulsion */}
                    {activeOverlay === 'slick_overlay' && (
                      <ellipse 
                        cx="330" 
                        cy="225" 
                        rx="80" 
                        ry="35" 
                        transform="rotate(18, 330, 225)"
                        fill="#030712"
                        stroke="#0ea5e9"
                        strokeWidth="1"
                        strokeDasharray="4,2"
                        strokeOpacity="0.8"
                      />
                    )}

                    {/* Bounding box calipers */}
                    {activeOverlay === 'slick_overlay' && (
                      <g stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.7">
                        {/* Length axis */}
                        <line x1="170" y1="170" x2="510" y2="275" />
                        <text x="320" y="200" fill="#7dd3fc" fontSize="10" fontWeight="600" className="font-mono">
                          8.4 km MAJOR AXIS
                        </text>

                        {/* Width caliper */}
                        <line x1="390" y1="160" x2="330" y2="310" />
                        <text x="375" y="250" fill="#7dd3fc" fontSize="10" fontWeight="600" className="font-mono">
                          {incident.characteristics.widthKm} km
                        </text>
                      </g>
                    )}

                    {/* Centroid Tag */}
                    <g transform="translate(330, 225)">
                      <circle r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                      <rect x="-70" y="14" width="140" height="20" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="28" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="700" className="font-mono">
                        POLYGON CENTROID
                      </text>
                    </g>
                  </g>
                )}

                {/* Acquisition Timestamp Tag */}
                <text x="14" y="24" fill="#94a3b8" fontSize="10" className="font-mono">
                  {incident.satellite.instrument} • {incident.satellite.polarization}
                </text>
                <text x="14" y="402" fill="#38bdf8" fontSize="10" className="font-mono">
                  CENTROID: {Math.abs(incident.coordinates.lat).toFixed(4)}°{incident.coordinates.lat >= 0 ? 'N' : 'S'}, {Math.abs(incident.coordinates.lng).toFixed(4)}°{incident.coordinates.lng >= 0 ? 'E' : 'W'}
                </text>
              </svg>

              {/* Viewport Floating Info */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-sky-400 font-mono text-xs font-semibold">
                  CONFIDENCE: {incident.characteristics.confidenceScore}%
                </span>
              </div>
            </div>

            {/* Quick Stats Grid under Image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Slick Surface Area</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {incident.characteristics.areaSqKm} km²
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estimated Volume</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {incident.characteristics.estimatedVolumeM3} m³
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estimated Age</span>
                <span className="text-base font-extrabold text-blue-600 font-mono">
                  ~{incident.characteristics.estimatedAgeHours} Hours
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Backscatter Damping</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {incident.characteristics.darkSpotContrastRatio} dB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detection Configuration & Analysis Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Detection & Segmentation Parameters
              </h2>
            </div>

            {/* Slider 1: Backscatter Contrast Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">Dark-Spot Contrast Threshold</label>
                <span className="font-mono font-bold text-blue-600">{thresholdDb} dB</span>
              </div>
              <input 
                type="range"
                min="-15"
                max="-4"
                step="0.2"
                value={thresholdDb}
                onChange={(e) => setThresholdDb(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-500 leading-normal">
                Standard Lee-sigma adaptive threshold for separating calm surface dampening from background sea clutter.
              </p>
            </div>

            {/* Slider 2: Minimum Connected Component Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">Min Cluster Size (Pixels)</label>
                <span className="font-mono font-bold text-blue-600">{minPixelCluster} px</span>
              </div>
              <input 
                type="range"
                min="50"
                max="500"
                step="10"
                value={minPixelCluster}
                onChange={(e) => setMinPixelCluster(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-500 leading-normal">
                Suppresses isolated speckle noise and transient foam wakes smaller than 0.015 km².
              </p>
            </div>

            {/* Toggle: Lookalike Classifier */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Biogenic Lookalike Filter
                </span>
                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                  Rejects natural organic surfactant films & low-wind calm water pockets using boundary gradient sharpness.
                </span>
              </div>
              <input 
                type="checkbox"
                checked={biogenicFilter}
                onChange={(e) => setBiogenicFilter(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-0 w-4 h-4"
              />
            </div>

            {/* Satellite Metadata Spec Card */}
            <div className="rounded-xl bg-slate-900 text-slate-200 p-4 space-y-2.5 text-xs font-mono">
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>Satellite Ingestion Metadata</span>
                <span>LEVEL-1 GRD</span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">PLATFORM</span>
                  <span className="text-slate-200 font-semibold">{incident.satellite.satellite}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">INSTRUMENT</span>
                  <span className="text-slate-200 font-semibold">{incident.satellite.sensor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">POLARIZATION</span>
                  <span className="text-sky-300 font-semibold">{incident.satellite.polarization}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">INCIDENCE ANGLE</span>
                  <span className="text-slate-200 font-semibold">{incident.satellite.incidenceAngle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PIXEL SPACING</span>
                  <span className="text-slate-200 font-semibold">{incident.satellite.resolution}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ACQUISITION UTC</span>
                  <span className="text-slate-200 font-semibold">{incident.satellite.acquisitionTime.slice(0, 19).replace('T', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                id="detection-proceed-drift-btn"
                onClick={() => onNavigate('drift')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <span>Proceed to Hydrodynamic Drift Modeling</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
