import React, { useState, useRef } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Layers, Eye, Compass, 
  Crosshair, Ship, Waves, AlertTriangle, Wind, Info
} from 'lucide-react';
import { SpillIncident, MapLayerConfig, VesselAttribution } from '../types';

interface OceanMapProps {
  incident: SpillIncident;
  selectedVessel?: VesselAttribution | null;
  onSelectVessel?: (vessel: VesselAttribution | null) => void;
  timelineOffsetHours?: number;
  highlightOrigin?: boolean;
  className?: string;
  showControls?: boolean;
  compactLegend?: boolean;
}

export const OceanMap: React.FC<OceanMapProps> = ({
  incident,
  selectedVessel,
  onSelectVessel,
  timelineOffsetHours = 0,
  highlightOrigin = false,
  className = '',
  showControls = true,
  compactLegend = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredVessel, setHoveredVessel] = useState<VesselAttribution | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mouseCoord, setMouseCoord] = useState<{ lat: string; lng: string }>({
    lat: `${incident.coordinates.lat.toFixed(4)}° N`,
    lng: `${Math.abs(incident.coordinates.lng).toFixed(4)}° ${incident.coordinates.lng < 0 ? 'W' : 'E'}`
  });

  const [layers, setLayers] = useState<MapLayerConfig>({
    satellite: true,
    ais: true,
    drift: true,
    spill: true,
    origin: true,
    currents: true,
    grid: true,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2 - pan.x) / (zoom * 5);
      const relY = (e.clientY - rect.top - rect.height / 2 - pan.y) / (zoom * 5);
      
      const approxLat = incident.coordinates.lat - relY * 0.02;
      const approxLng = incident.coordinates.lng + relX * 0.02;
      setMouseCoord({
        lat: `${approxLat.toFixed(4)}° N`,
        lng: `${Math.abs(approxLng).toFixed(4)}° ${approxLng < 0 ? 'W' : 'E'}`
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.6));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleLayer = (layerKey: keyof MapLayerConfig) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Convert polygon coordinates to SVG polygon path
  const slickPath = incident.characteristics.polygonPoints
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${450 + x * 2.2} ${280 + y * 2.2}`)
    .join(' ') + ' Z';

  // Suspected origin position on map
  const originX = 310;
  const originY = 160;

  // Current spill position on map
  const currentSpillX = 450;
  const currentSpillY = 280;

  // Future drift terminal position on map
  const futureDriftX = 640;
  const futureDriftY = 410;

  // Dynamic position based on timeline offset (-14h to +24h)
  const getTimelinePosition = () => {
    if (timelineOffsetHours <= 0) {
      // Interpolate between origin (-14h) and now (0h)
      const ratio = Math.min(1, Math.max(0, (timelineOffsetHours + 14) / 14));
      return {
        x: originX + (currentSpillX - originX) * ratio,
        y: originY + (currentSpillY - originY) * ratio,
      };
    } else {
      // Interpolate between now (0h) and future (+24h)
      const ratio = Math.min(1, Math.max(0, timelineOffsetHours / 24));
      return {
        x: currentSpillX + (futureDriftX - currentSpillX) * ratio,
        y: currentSpillY + (futureDriftY - currentSpillY) * ratio,
      };
    }
  };

  const activePos = getTimelinePosition();

  return (
    <div 
      id={`ocean-map-${incident.id}`}
      ref={mapContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative overflow-hidden select-none bg-slate-950 border border-slate-700/60 rounded-xl cursor-grab active:cursor-grabbing ${className}`}
      style={{ minHeight: '440px' }}
    >
      {/* Ocean Map SVG Layer */}
      <svg 
        className="w-full h-full"
        viewBox="0 0 900 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Oceanic bathymetry gradient */}
          <radialGradient id="bathymetryGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d2847" />
            <stop offset="45%" stopColor="#0a1e36" />
            <stop offset="85%" stopColor="#061528" />
            <stop offset="100%" stopColor="#030d1a" />
          </radialGradient>

          {/* Oil spill slick gradient */}
          <radialGradient id="oilSlickFill" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.92" />
            <stop offset="35%" stopColor="#1e293b" stopOpacity="0.88" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
          </radialGradient>

          {/* Oil sheen fringe */}
          <linearGradient id="oilSheenBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
          </linearGradient>

          {/* Backtrack vector dashed stroke pattern */}
          <filter id="glowSubtle" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* SAR Raster simulated scan pattern */}
          <pattern id="sarGrid" width="12" height="12" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="12" y2="12" stroke="#0ea5e9" strokeWidth="0.5" strokeOpacity="0.12" />
          </pattern>
        </defs>

        {/* Ocean Background */}
        <rect width="900" height="560" fill="url(#bathymetryGradient)" />

        {/* Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '450px 280px' }}>
          
          {/* 1. Nautical Graticule & Grid */}
          {layers.grid && (
            <g id="map-graticule" stroke="#38bdf8" strokeOpacity="0.12" strokeWidth="0.75" strokeDasharray="3,3">
              {/* Latitude parallels */}
              <line x1="0" y1="100" x2="900" y2="100" />
              <line x1="0" y1="220" x2="900" y2="220" />
              <line x1="0" y1="340" x2="900" y2="340" />
              <line x1="0" y1="460" x2="900" y2="460" />

              {/* Longitude meridians */}
              <line x1="150" y1="0" x2="150" y2="560" />
              <line x1="320" y1="0" x2="320" y2="560" />
              <line x1="490" y1="0" x2="490" y2="560" />
              <line x1="660" y1="0" x2="660" y2="560" />
              <line x1="830" y1="0" x2="830" y2="560" />

              {/* Graticule labels */}
              <text x="15" y="105" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">28°40'N</text>
              <text x="15" y="225" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">28°30'N</text>
              <text x="15" y="345" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">28°20'N</text>
              <text x="15" y="465" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">28°10'N</text>

              <text x="325" y="545" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">089°40'W</text>
              <text x="495" y="545" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">089°20'W</text>
              <text x="665" y="545" fill="#7dd3fc" fillOpacity="0.5" fontSize="10" className="font-mono">089°00'W</text>
            </g>
          )}

          {/* 2. Coastline / Islands / Landform boundary (North/Northwest) */}
          <g id="map-coastline" opacity="0.85">
            {/* Shelf bathymetry depth contour */}
            <path 
              d="M -20,70 Q 180,90 320,50 T 600,30 T 920,45" 
              fill="none" 
              stroke="#0284c7" 
              strokeWidth="1.2" 
              strokeOpacity="0.3"
              strokeDasharray="6,4"
            />
            <text x="700" y="38" fill="#38bdf8" fillOpacity="0.35" fontSize="9" className="font-mono">200m ISOBATH / CONTINENTAL SHELF</text>

            {/* Coastal margin */}
            <path 
              d="M -20,20 Q 140,50 250,15 T 500,5 L 500,-20 L -20,-20 Z" 
              fill="#1e293b" 
              stroke="#475569" 
              strokeWidth="1.5" 
            />
            <text x="60" y="24" fill="#cbd5e1" fontSize="10" fontWeight="600" letterSpacing="0.05em">MISSISSIPPI DELTA BARRIER COAST</text>
          </g>

          {/* 3. Ocean Current & Wind Vector Field */}
          {layers.currents && (
            <g id="map-currents" opacity="0.6">
              {[
                { x: 220, y: 200, rot: 138, speed: '1.2' },
                { x: 380, y: 160, rot: 142, speed: '1.3' },
                { x: 550, y: 220, rot: 140, speed: '1.4' },
                { x: 260, y: 360, rot: 135, speed: '1.2' },
                { x: 440, y: 390, rot: 139, speed: '1.3' },
                { x: 620, y: 340, rot: 145, speed: '1.4' },
                { x: 740, y: 260, rot: 142, speed: '1.5' },
              ].map((c, i) => (
                <g key={`cur-${i}`} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
                  <line x1="-16" y1="0" x2="16" y2="0" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.45" />
                  <polygon points="16,0 10,-3 10,3" fill="#0ea5e9" fillOpacity="0.6" />
                </g>
              ))}
            </g>
          )}

          {/* 4. Satellite SAR Swath / Footprint Overlay */}
          {layers.satellite && (
            <g id="map-satellite-swath">
              {/* Satellite SAR acquisition frame */}
              <polygon 
                points="240,80 660,110 590,470 170,440" 
                fill="url(#sarGrid)" 
                stroke="#0284c7" 
                strokeWidth="1.2" 
                strokeOpacity="0.4"
                strokeDasharray="4,4"
              />
              <text x="248" y="100" fill="#38bdf8" fontSize="9" className="font-mono font-medium">
                SENTINEL-1C C-SAR SWATH (IW VV+VH) • 10m PIXEL
              </text>
            </g>
          )}

          {/* 5. Drift Model: Historical Backtrack & Predicted Trajectory */}
          {layers.drift && (
            <g id="map-drift-layer">
              {/* Historical Backtrack Trajectory (Origin -> Spill Now) */}
              <path 
                d={`M ${originX} ${originY} Q 380 215 ${currentSpillX} ${currentSpillY}`} 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="2.2" 
                strokeDasharray="6,4"
                strokeOpacity="0.85"
              />

              {/* Probable Origin Point */}
              {layers.origin && (
                <g transform={`translate(${originX}, ${originY})`} className="cursor-pointer">
                  {/* Uncertainty Ellipse */}
                  <ellipse 
                    rx="32" 
                    ry="20" 
                    transform="rotate(-25)" 
                    fill="#0284c7" 
                    fillOpacity="0.15" 
                    stroke="#38bdf8" 
                    strokeWidth="1.5" 
                    strokeDasharray="3,3"
                  />
                  {/* Center origin target */}
                  <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <circle r="12" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" className="animate-ping" style={{ animationDuration: '3s' }} />

                  {/* Origin Marker Label */}
                  <rect x="-85" y="-36" width="170" height="22" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#0284c7" strokeWidth="1" />
                  <text x="0" y="-22" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="600" className="font-mono">
                    SUSPECTED ORIGIN (T-14h)
                  </text>
                </g>
              )}

              {/* Future Drift Forecast Envelope (Spill Now -> T+24h) */}
              {/* 95% Confidence Dispersion Cone */}
              <path 
                d={`M ${currentSpillX} ${currentSpillY} L 660 370 L 630 450 Z`} 
                fill="#0284c7" 
                fillOpacity="0.12" 
                stroke="#0ea5e9" 
                strokeWidth="1" 
                strokeDasharray="3,3"
                strokeOpacity="0.5"
              />

              {/* Mean Drift Trajectory Line */}
              <path 
                d={`M ${currentSpillX} ${currentSpillY} Q 545 345 ${futureDriftX} ${futureDriftY}`} 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="2.5" 
                strokeOpacity="0.9"
              />

              {/* T+12h waypoint */}
              <circle cx="545" cy="345" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x="555" y="348" fill="#7dd3fc" fontSize="9" className="font-mono">T+12h</text>

              {/* T+24h waypoint */}
              <circle cx={futureDriftX} cy={futureDriftY} r="5" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
              <text x={futureDriftX + 10} y={futureDriftY + 4} fill="#e0f2fe" fontSize="10" fontWeight="600" className="font-mono">
                T+24h (26.8 NM)
              </text>
            </g>
          )}

          {/* 6. Oil Spill Slick Polygon Layer */}
          {layers.spill && (
            <g id="map-spill-layer">
              {/* Slick Outer Sheen Halo */}
              <path 
                d={slickPath} 
                fill="url(#oilSlickFill)" 
                stroke="url(#oilSheenBorder)" 
                strokeWidth="2.2"
                filter="url(#glowSubtle)"
              />

              {/* High-density slick core */}
              <ellipse 
                cx={currentSpillX + 8} 
                cy={currentSpillY + 4} 
                rx="30" 
                ry="12" 
                transform="rotate(22, 458, 284)"
                fill="#091322" 
                fillOpacity="0.95"
                stroke="#0284c7"
                strokeWidth="0.8"
              />

              {/* Oil slick dimension calipers */}
              <line x1="390" y1="245" x2="515" y2="310" stroke="#bae6fd" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.7" />
              <text x="445" y="260" fill="#bae6fd" fontSize="9" fontWeight="600" className="font-mono">
                8.4 km LENGTH
              </text>

              {/* Slick Centroid Marker */}
              <g transform={`translate(${currentSpillX}, ${currentSpillY})`}>
                <circle r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="-65" y="16" width="130" height="20" rx="4" fill="#0b1329" fillOpacity="0.9" stroke="#38bdf8" strokeWidth="0.8" />
                <text x="0" y="30" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="700" className="font-mono">
                  SLICK: 18.42 km² (CRUDE)
                </text>
              </g>
            </g>
          )}

          {/* 7. Active Timeline Animated Marker (if timeline scrubbing) */}
          {timelineOffsetHours !== 0 && (
            <g transform={`translate(${activePos.x}, ${activePos.y})`}>
              <circle r="16" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,2" className="animate-spin" style={{ animationDuration: '8s' }} />
              <circle r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              <rect x="-45" y="-30" width="90" height="18" rx="3" fill="#0284c7" fillOpacity="0.95" />
              <text x="0" y="-18" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700" className="font-mono">
                {timelineOffsetHours > 0 ? `+${timelineOffsetHours}h FORECAST` : `${timelineOffsetHours}h REPLAY`}
              </text>
            </g>
          )}

          {/* 8. AIS Vessel Traffic & Candidate Suspects */}
          {layers.ais && incident.vessels.map((vessel) => {
            const isSelected = selectedVessel?.mmsi === vessel.mmsi;
            const isTopRanked = vessel.rank === 1;

            // Map vessel relative coords
            let vx = currentSpillX;
            let vy = currentSpillY;

            if (vessel.rank === 1) {
              vx = originX + 22;
              vy = originY + 18;
            } else if (vessel.rank === 2) {
              vx = originX + 75;
              vy = originY + 45;
            } else if (vessel.rank === 3) {
              vx = originX - 45;
              vy = originY + 80;
            } else {
              vx = originX + 110;
              vy = originY - 60;
            }

            // Vessel heading angle
            const heading = vessel.trackHistory[vessel.trackHistory.length - 1]?.headingDeg || 135;

            // Color scheme by attribution score
            const vesselColor = isTopRanked 
              ? '#ef4444' // red/amber for top correlation suspect
              : vessel.overallScore >= 70 
              ? '#f59e0b' 
              : '#38bdf8';

            return (
              <g 
                key={vessel.mmsi} 
                transform={`translate(${vx}, ${vy})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVessel?.(vessel);
                }}
                onMouseEnter={() => setHoveredVessel(vessel)}
                onMouseLeave={() => setHoveredVessel(null)}
              >
                {/* AIS Historical Breadcrumb Track */}
                <path 
                  d={vessel.rank === 1 ? "M -90 -65 L -45 -30 L 0 0 L 80 50 L 160 100" : "M -60 -40 L 0 0 L 70 45"} 
                  fill="none" 
                  stroke={vesselColor} 
                  strokeWidth={isSelected ? "2" : "1.2"} 
                  strokeOpacity={isSelected ? "0.9" : "0.5"}
                  strokeDasharray="4,3"
                />

                {/* Loiter highlight for rank 1 */}
                {vessel.rank === 1 && (
                  <circle r="22" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3,2" />
                )}

                {/* Selection or pulse highlight */}
                {isSelected && (
                  <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="2" className="animate-pulse" />
                )}

                {/* Directional Vessel Icon (Hull shape) */}
                <g transform={`rotate(${heading})`}>
                  <polygon 
                    points="0,-12 6,4 4,9 -4,9 -6,4" 
                    fill={vesselColor} 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                  />
                  {/* Directional heading vector stem */}
                  <line x1="0" y1="-12" x2="0" y2="-22" stroke={vesselColor} strokeWidth="1.5" />
                </g>

                {/* Vessel Label Badge */}
                <g transform="translate(14, -12)">
                  <rect 
                    x="0" 
                    y="-10" 
                    width={isTopRanked ? "138" : "118"} 
                    height="20" 
                    rx="3" 
                    fill="#0f172a" 
                    fillOpacity="0.92" 
                    stroke={isSelected ? "#38bdf8" : vesselColor} 
                    strokeWidth={isSelected ? "1.5" : "0.8"} 
                  />
                  <text x="6" y="4" fill="#ffffff" fontSize="9.5" fontWeight="600">
                    {vessel.rank === 1 ? `⚠️ #${vessel.rank} ${vessel.name}` : `#${vessel.rank} ${vessel.name}`}
                  </text>
                  <text x={isTopRanked ? "106" : "88"} y="4" fill={vesselColor} fontSize="9" fontWeight="700" className="font-mono">
                    {vessel.overallScore}%
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Map Header / Telemetry Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Incident location badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {incident.name}
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            [{incident.coordinates.lat.toFixed(4)}°N, {Math.abs(incident.coordinates.lng).toFixed(4)}°W]
          </span>
        </div>

        {/* Live cursor coordinates readout */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md text-xs font-mono text-cyan-400">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
            <span>LAT {mouseCoord.lat}</span>
            <span className="text-slate-600">|</span>
            <span>LON {mouseCoord.lng}</span>
          </div>
        </div>
      </div>

      {/* Map Control Buttons (Top-Right / Right) */}
      {showControls && (
        <div className="absolute top-14 right-3 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
          <button 
            id="map-zoom-in-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            id="map-zoom-out-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            id="map-reset-btn"
            onClick={handleResetView}
            title="Reset Pan & Zoom"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-700 my-0.5" />
          <div className="relative">
            <button 
              id="map-layers-toggle-btn"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Toggle Layers"
              className={`p-2 rounded transition-colors ${showLayerMenu ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Layer Toggle Dropdown Panel */}
            {showLayerMenu && (
              <div className="absolute right-full top-0 mr-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 z-30 text-xs">
                <div className="font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-800 px-1 flex items-center justify-between">
                  <span>Display Layers</span>
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="space-y-1">
                  {[
                    { key: 'satellite', label: 'SAR Satellite Swath' },
                    { key: 'spill', label: 'Oil Slick Polygon' },
                    { key: 'drift', label: 'Drift & Backtrack' },
                    { key: 'origin', label: 'Suspected Origin' },
                    { key: 'ais', label: 'AIS Vessel Tracks' },
                    { key: 'currents', label: 'Ocean Currents' },
                    { key: 'grid', label: 'Nautical Graticule' },
                  ].map(({ key, label }) => (
                    <label 
                      key={key} 
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-300"
                    >
                      <input 
                        type="checkbox"
                        checked={layers[key as keyof MapLayerConfig]}
                        onChange={() => toggleLayer(key as keyof MapLayerConfig)}
                        className="rounded border-slate-700 text-sky-600 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/80 shadow-md text-xs text-slate-300 max-w-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1.5">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Chart Symbology</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-slate-800 border border-sky-400" />
            <span>Oil Slick (SAR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
            <span>Origin Point</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-sky-400" />
            <span>Backtrack Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-sky-600" />
            <span>Future 24h Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-red-500" />
            <span>High Risk AIS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-sky-400" />
            <span>Correlated AIS</span>
          </div>
        </div>
      </div>

      {/* Selected/Hovered Vessel Preview Card (Bottom-Right) */}
      {(hoveredVessel || selectedVessel) && (
        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl max-w-sm z-20 text-xs">
          {(() => {
            const v = hoveredVessel || selectedVessel!;
            return (
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-slate-100 text-sm">{v.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                    v.rank === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    SCORE {v.overallScore}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 mb-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block">MMSI / IMO</span>
                    <span className="font-mono">{v.mmsi} / {v.imo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">TYPE & FLAG</span>
                    <span>{v.type} ({v.flag})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">DISTANCE AT ORIGIN</span>
                    <span className="font-semibold text-slate-100 font-mono">{v.evidence.distanceAtOriginNM} NM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">TRAJECTORY MATCH</span>
                    <span className="font-semibold text-sky-400 font-mono">{v.evidence.trajectoryMatchPercent}%</span>
                  </div>
                </div>
                {v.evidence.behaviorAnomalies.length > 0 && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                    ⚠️ {v.evidence.behaviorAnomalies[0]}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
