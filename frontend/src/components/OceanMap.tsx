import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Layers, Eye, Compass, 
  Crosshair, Ship, Waves, AlertTriangle, Wind, Info,
  Radio, Droplets, ExternalLink, X, Activity, Thermometer, MapPin
} from 'lucide-react';
import { SpillIncident, MapLayerConfig, VesselAttribution } from '../types';
import { 
  fetchIncoisInLocationForecast, 
  IncoisLsfForecast, 
  INCOIS_BUOY_STATIONS, 
  IncoisBuoyStation 
} from '../services/incoisService';
import { GoogleOceanMap } from './GoogleOceanMap';

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
  const [pan, setPan] = useState({ x: 0, y: 55 }); // Upper view alignment
  const [mapType, setMapType] = useState<'google' | 'incois' | 'map' | 'satellite'>('google'); // Default to Google Maps

  const [incoisForecast, setIncoisForecast] = useState<IncoisLsfForecast | null>(null);
  const [selectedBuoy, setSelectedBuoy] = useState<IncoisBuoyStation | null>(null);
  const [showIncoisDrawer, setShowIncoisDrawer] = useState(false);
  const [showLsfWaveContours, setShowLsfWaveContours] = useState(true);
  const [showOosaParticles, setShowOosaParticles] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 55 });
  const [hoveredVessel, setHoveredVessel] = useState<VesselAttribution | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mouseCoord, setMouseCoord] = useState<{ lat: string; lng: string }>({
    lat: `${incident.coordinates.lat.toFixed(4)}° N`,
    lng: `${Math.abs(incident.coordinates.lng).toFixed(4)}° ${incident.coordinates.lng < 0 ? 'W' : 'E'}`
  });

  useEffect(() => {
    fetchIncoisInLocationForecast(incident.coordinates.lat, incident.coordinates.lng, incident.name)
      .then((data) => setIncoisForecast(data))
      .catch((err) => console.warn('INCOIS forecast load error:', err));
  }, [incident.coordinates.lat, incident.coordinates.lng, incident.name]);

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
    setPan({ x: 0, y: 55 }); // Reset to upper view
  };

  const toggleLayer = (layerKey: keyof MapLayerConfig) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Convert polygon coordinates to SVG polygon path
  const slickPath = incident.characteristics.polygonPoints
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${450 + x * 2.2} ${280 + y * 2.2}`)
    .join(' ') + ' Z';

  // Outer hydrocarbon sheen dispersion envelope (expanded perimeter)
  const outerSheenPath = incident.characteristics.polygonPoints
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${450 + x * 2.8} ${280 + y * 2.8}`)
    .join(' ') + ' Z';

  // Inner ultra-dense crude tar core (contracted perimeter)
  const innerDenseCorePath = incident.characteristics.polygonPoints
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${450 + x * 1.4} ${280 + y * 1.4}`)
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

  // If Google Maps mode is active, render the dedicated Google Maps geospatial layer
  if (mapType === 'google') {
    return (
      <div className={`relative ${className}`} style={{ minHeight: '460px' }}>
        <GoogleOceanMap
          incident={incident}
          selectedVessel={selectedVessel}
          onSelectVessel={onSelectVessel}
          timelineOffsetHours={timelineOffsetHours}
          highlightOrigin={highlightOrigin}
          className={className}
          showControls={showControls}
          onSwitchToSvgFallback={() => setMapType('incois')}
        />
        
        {/* Top Floating View Switcher on top of Google Maps */}
        <div className="absolute top-3 left-3 z-30 pointer-events-auto">
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-700 p-0.5 text-xs font-semibold font-poppins text-slate-300">
            <button
              id="google-maps-live-mode-btn"
              onClick={() => setMapType('google')}
              className="px-3 py-1 rounded-md bg-blue-600 text-white font-bold shadow-xs flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Google Maps (Live)</span>
            </button>
            <button
              id="incois-lsf-mode-btn"
              onClick={() => setMapType('incois')}
              className="px-3 py-1 rounded-md text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span>INCOIS LSF Chart</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`ocean-map-${incident.id}`}
      ref={mapContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative overflow-hidden select-none bg-white border border-slate-200 rounded-xl cursor-grab active:cursor-grabbing font-poppins ${className}`}
      style={{ minHeight: '440px' }}
    >
      {/* Ocean Map SVG Layer */}
      <svg 
        className="w-full h-full"
        viewBox="0 0 900 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* INCOIS LSF Ocean Bathymetric Multi-level Depth Light Gradient */}
          <linearGradient id="incoisBathymetricLightGradient" x1="0%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#f3fafe" />
            <stop offset="20%" stopColor="#e2f4fb" />
            <stop offset="50%" stopColor="#c5eaf7" />
            <stop offset="78%" stopColor="#a3daf0" />
            <stop offset="100%" stopColor="#81c9e6" />
          </linearGradient>

          {/* Clean Marine Google Maps 2D Light Gradient */}
          <linearGradient id="cleanOceanLightMap" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eef8fc" />
            <stop offset="100%" stopColor="#cfeaf5" />
          </linearGradient>

          {/* Satellite Luminous Light Water Gradient */}
          <linearGradient id="satelliteLightWater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2f3fa" />
            <stop offset="50%" stopColor="#bde4f3" />
            <stop offset="100%" stopColor="#98d5eb" />
          </linearGradient>

          {/* Clean Ocean Wave Ripple Pattern for unpolluted waters */}
          <pattern id="cleanOceanRipples" width="48" height="24" patternUnits="userSpaceOnUse">
            <path d="M 0,12 Q 12,6 24,12 T 48,12" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeOpacity="0.45" />
            <path d="M -12,20 Q 0,14 12,20 T 36,20" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.3" />
          </pattern>

          {/* Heavy Viscous Dark Crude Oil Texture Pattern */}
          <pattern id="darkCrudeOilTexture" width="48" height="48" patternUnits="userSpaceOnUse">
            {/* Deep Pitch-Black Tar Base */}
            <rect width="48" height="48" fill="#04060b" />
            {/* Viscous Tar Streaks & Ribbons */}
            <path d="M -6,14 Q 16,4 32,18 T 54,12" fill="none" stroke="#0a101b" strokeWidth="8" strokeLinecap="round" />
            <path d="M -8,32 Q 14,22 30,36 T 56,28" fill="none" stroke="#020408" strokeWidth="10" strokeLinecap="round" />
            <path d="M 0,24 Q 24,36 48,22" fill="none" stroke="#111827" strokeWidth="5" />
            {/* Dark Bitumen & Emulsified Mousse Streaks */}
            <path d="M 4,8 Q 28,18 44,6" fill="none" stroke="#261005" strokeWidth="3" strokeOpacity="0.85" />
            <path d="M -4,40 Q 20,28 40,42" fill="none" stroke="#361705" strokeWidth="3.5" strokeOpacity="0.75" />
            {/* Micro Petroleum Droplets and Viscous Nodes */}
            <circle cx="12" cy="18" r="3.5" fill="#000000" />
            <circle cx="34" cy="32" r="4.2" fill="#000000" />
            <circle cx="26" cy="10" r="2.8" fill="#090d16" />
            <circle cx="42" cy="40" r="3" fill="#090d16" />
            {/* Specular Dark Gloss Sheen Highlights */}
            <path d="M 8,14 Q 18,8 28,15" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeOpacity="0.9" />
            <path d="M 22,30 Q 32,24 40,31" fill="none" stroke="#334155" strokeWidth="1.2" strokeOpacity="0.85" />
            <circle cx="13" cy="17" r="0.9" fill="#94a3b8" fillOpacity="0.6" />
            <circle cx="35" cy="31" r="0.9" fill="#94a3b8" fillOpacity="0.6" />
          </pattern>

          {/* Radial Dense Crude Core Gradient */}
          <radialGradient id="denseCrudeCore" cx="44%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <stop offset="35%" stopColor="#050810" stopOpacity="0.98" />
            <stop offset="68%" stopColor="#0c1322" stopOpacity="0.96" />
            <stop offset="88%" stopColor="#141c2c" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
          </radialGradient>

          {/* Outer Hydrocarbon Surface Sheen Gradient */}
          <radialGradient id="outerHydrocarbonSheen" cx="46%" cy="44%" r="68%">
            <stop offset="0%" stopColor="#04060a" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#0b111c" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>

          {/* Iridescent Rainbow Oil Sheen Perimeter */}
          <linearGradient id="iridescentRainbowRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#ec4899" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
          </linearGradient>

          {/* Tactile 3D Relief Shadow for Thick Dark Crude Layer */}
          <filter id="crudeReliefShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.8" />
          </filter>

          {/* INCOIS Significant Wave Height Heatmap overlay */}
          <linearGradient id="incoisWaveHeatmap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.04" />
            <stop offset="40%" stopColor="#0d9488" stopOpacity="0.08" />
            <stop offset="72%" stopColor="#d97706" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.15" />
          </linearGradient>

          {/* SAR Raster simulated scan pattern */}
          <pattern id="sarGrid" width="12" height="12" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="12" y2="12" stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.15" />
          </pattern>
        </defs>

        {/* Ocean Background - Light shades for clean unpolluted ocean water */}
        <rect 
          id="ocean-map-canvas"
          width="900" 
          height="560" 
          fill={
            mapType === 'incois' 
              ? 'url(#incoisBathymetricLightGradient)' 
              : mapType === 'map' 
                ? 'url(#cleanOceanLightMap)' 
                : 'url(#satelliteLightWater)'
          } 
          className="transition-colors duration-300"
        />

        {/* Clean water delicate wave ripple overlay */}
        <rect 
          width="900" 
          height="560" 
          fill="url(#cleanOceanRipples)" 
          pointerEvents="none" 
          opacity="0.45" 
        />

        {/* Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '450px 240px' }}>
          
          {/* INCOIS Bathymetric Depth Contours (Isobaths) */}
          {mapType === 'incois' && (
            <g id="incois-bathymetry-isobaths" opacity="0.88">
              {/* 20m Depth Isobath */}
              <path 
                d="M -20,85 Q 160,110 320,70 T 600,50 T 920,65" 
                fill="none" 
                stroke="#207a9e" 
                strokeWidth="1" 
                strokeDasharray="4,3" 
              />
              <text x="760" y="62" fill="#145672" fontSize="8.5" fontWeight="600" className="font-poppins">20m ISOBATH</text>

              {/* 50m Depth Isobath */}
              <path 
                d="M -20,135 Q 220,170 420,130 T 720,105 T 920,120" 
                fill="none" 
                stroke="#196887" 
                strokeWidth="1.2" 
                strokeDasharray="5,4" 
              />
              <text x="760" y="117" fill="#145672" fontSize="8.5" fontWeight="600" className="font-poppins">50m ISOBATH</text>

              {/* 100m Depth Isobath */}
              <path 
                d="M -20,200 Q 260,240 500,200 T 800,180 T 920,195" 
                fill="none" 
                stroke="#125672" 
                strokeWidth="1.2" 
                strokeDasharray="6,4" 
              />
              <text x="760" y="192" fill="#0f455c" fontSize="8.5" fontWeight="600" className="font-poppins">100m CONTINENTAL SHELF</text>

              {/* 200m Shelf Break */}
              <path 
                d="M -20,280 Q 280,330 560,280 T 840,260 T 920,275" 
                fill="none" 
                stroke="#0c4259" 
                strokeWidth="1.4" 
                strokeDasharray="8,4" 
              />
              <text x="760" y="272" fill="#093447" fontSize="9" fontWeight="700" className="font-poppins">200m SHELF BREAK (INCOIS)</text>

              {/* 500m Abyssal Slope */}
              <path 
                d="M -20,380 Q 300,440 620,390 T 860,370 T 920,385" 
                fill="none" 
                stroke="#072b3a" 
                strokeWidth="1.5" 
              />
              <text x="760" y="382" fill="#06222e" fontSize="9" fontWeight="700" className="font-poppins">500m BATHYMETRIC CONTOUR</text>
            </g>
          )}

          {/* INCOIS Significant Wave Height (Hs) Layer & Isolines */}
          {mapType === 'incois' && showLsfWaveContours && (
            <g id="incois-wave-forecast-layer">
              {/* Translucent Wave Height Field */}
              <path 
                d="M -20,180 Q 300,230 580,180 T 920,170 L 920,560 L -20,560 Z" 
                fill="url(#incoisWaveHeatmap)" 
              />
              
              {/* Isolines for Hs = 1.0m */}
              <path 
                d="M -20,160 Q 280,210 540,160 T 920,150" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="1.8" 
                strokeDasharray="5,3" 
              />
              <rect x="140" y="166" width="76" height="15" rx="3" fill="#ffffff" fillOpacity="0.92" stroke="#0284c7" strokeWidth="0.8" />
              <text x="178" y="177" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700" className="font-poppins">Hs: 1.0 - 1.2 m</text>

              {/* Isolines for Hs = 1.35m (Incident zone) */}
              <path 
                d="M -20,290 Q 340,360 620,290 T 920,280" 
                fill="none" 
                stroke="#0d9488" 
                strokeWidth="2" 
              />
              <rect x="360" y="325" width="130" height="18" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#0d9488" strokeWidth="1.2" className="shadow-xs" />
              <text x="425" y="337" textAnchor="middle" fill="#0f766e" fontSize="9.5" fontWeight="700" className="font-poppins">INCOIS Hs: 1.35m (Tp: 8.2s)</text>

              {/* Isolines for Hs = 1.7m */}
              <path 
                d="M -20,430 Q 380,500 680,440 T 920,430" 
                fill="none" 
                stroke="#d97706" 
                strokeWidth="1.8" 
                strokeDasharray="5,3" 
              />
              <rect x="520" y="456" width="82" height="16" rx="3" fill="#ffffff" fillOpacity="0.92" stroke="#d97706" strokeWidth="0.8" />
              <text x="561" y="468" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="700" className="font-poppins">Hs: 1.7 - 2.0 m</text>
            </g>
          )}

          {/* Google Maps Maritime Navigation Fairways (Map Mode) */}
          {mapType === 'map' && (
            <g id="map-fairways" opacity="0.9">
              {/* Outer fairway white road casing */}
              <path 
                d="M -10,480 L 320,300 L 740,210 L 920,230" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Fairway border edges */}
              <path 
                d="M -10,480 L 320,300 L 740,210 L 920,230" 
                fill="none" 
                stroke="#8cb7c8" 
                strokeWidth="1.2" 
                strokeDasharray="6,4"
              />
              <text 
                x="560" 
                y="245" 
                fill="#475569" 
                fontSize="9" 
                fontWeight="600" 
                className="font-poppins"
                stroke="#ffffff" 
                strokeWidth="2.5" 
                paintOrder="stroke fill"
              >
                GULF DEEPWATER TRANSIT CORRIDOR
              </text>
            </g>
          )}

          {/* 1. Nautical Graticule & Grid */}
          {layers.grid && (
            <g id="map-graticule" stroke={mapType === 'map' ? '#8cb5c5' : '#0284c7'} strokeOpacity={mapType === 'map' ? '0.4' : '0.18'} strokeWidth="0.75" strokeDasharray="3,3">
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

              {/* Graticule labels with Google Maps style halo */}
              <text x="15" y="105" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">28°40'N</text>
              <text x="15" y="225" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">28°30'N</text>
              <text x="15" y="345" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">28°20'N</text>
              <text x="15" y="465" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">28°10'N</text>

              <text x="325" y="545" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">089°40'W</text>
              <text x="495" y="545" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">089°20'W</text>
              <text x="665" y="545" fill={mapType === 'map' ? '#2c5364' : '#0369a1'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="10" className="font-poppins font-medium">089°00'W</text>
            </g>
          )}

          {/* 2. Coastline / Islands / Landform boundary (North/Northwest) */}
          <g id="map-coastline" opacity="0.98">
            {/* Shelf bathymetry depth contour */}
            <path 
              d="M -20,70 Q 180,90 320,50 T 600,30 T 920,45" 
              fill="none" 
              stroke={mapType === 'map' ? '#86b0c2' : '#0284c7'} 
              strokeWidth="1.2" 
              strokeOpacity="0.6" 
              strokeDasharray="6,4"
            />
            <text x="700" y="38" fill={mapType === 'map' ? '#477082' : '#0284c7'} stroke={mapType === 'map' ? '#ffffff' : 'none'} strokeWidth="2" paintOrder="stroke fill" fontSize="9" className="font-poppins font-medium">200m ISOBATH / CONTINENTAL SHELF</text>

            {/* Coastal Land Margin in light natural earth shades */}
            <path 
              d="M -20,25 Q 140,55 250,20 T 520,10 L 520,-20 L -20,-20 Z" 
              fill="#f5f3ec" 
              stroke="#dbd5c6" 
              strokeWidth="1.5" 
            />
            {/* Wetland / Reserve Green area */}
            <path 
              d="M 20,24 Q 130,50 220,20 T 360,12 L 360,-20 L 20,-20 Z" 
              fill="#e2f0df" 
              stroke="#cadfc6"
              strokeWidth="1"
              opacity="0.9"
            />
            {/* Barrier Islands */}
            <ellipse cx="140" cy="55" rx="16" ry="4" fill="#f5f3ec" stroke="#dbd5c6" strokeWidth="1" />
            <ellipse cx="190" cy="50" rx="12" ry="3.5" fill="#f5f3ec" stroke="#dbd5c6" strokeWidth="1" />
            <ellipse cx="280" cy="40" rx="18" ry="4" fill="#f5f3ec" stroke="#dbd5c6" strokeWidth="1" />

            <text x="60" y="16" fill="#334155" stroke="#ffffff" strokeWidth="2.5" paintOrder="stroke fill" fontSize="10.5" fontWeight="600" letterSpacing="0.05em" className="font-poppins">
              MISSISSIPPI RIVER DELTA & BARRIER COAST
            </text>
          </g>

          {/* 3. Ocean Current & Wind Vector Field */}
          {layers.currents && (
            <g id="map-currents" opacity="0.75">
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
                  <line x1="-16" y1="0" x2="16" y2="0" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.55" />
                  <polygon points="16,0 10,-3 10,3" fill="#0284c7" fillOpacity="0.75" />
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
                strokeOpacity="0.5" 
                strokeDasharray="4,4"
              />
              <text x="248" y="100" fill="#0369a1" fontSize="9" className="font-poppins font-semibold">
                SENTINEL-1C C-SAR SWATH (IW VV+VH) • 10m PIXEL
              </text>
            </g>
          )}

          {/* 5. Drift Model: Historical Backtrack & Predicted Trajectory */}
          {layers.drift && (
            <g id="map-drift-layer">
              {/* Contaminated Vessel Leak Wake (Dark Oily Track on Light Water) */}
              <path 
                d={`M ${originX} ${originY} Q 380 215 ${currentSpillX} ${currentSpillY}`} 
                fill="none" 
                stroke="#090d16" 
                strokeWidth="8" 
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <path 
                d={`M ${originX} ${originY} Q 380 215 ${currentSpillX} ${currentSpillY}`} 
                fill="none" 
                stroke="#2a1408" 
                strokeWidth="4" 
                strokeOpacity="0.65"
                strokeLinecap="round"
              />
              {/* Oily droplets along the vessel wake */}
              {[
                { cx: 335, cy: 180, r: 2.2 },
                { cx: 360, cy: 200, r: 2.6 },
                { cx: 395, cy: 228, r: 3.2 },
                { cx: 425, cy: 254, r: 3.8 },
              ].map((drop, i) => (
                <circle key={`wake-drop-${i}`} cx={drop.cx} cy={drop.cy} r={drop.r} fill="#020408" fillOpacity="0.85" />
              ))}

              {/* Historical Backtrack Trajectory (Origin -> Spill Now) */}
              <path 
                d={`M ${originX} ${originY} Q 380 215 ${currentSpillX} ${currentSpillY}`} 
                fill="none" 
                stroke="#0369a1" 
                strokeWidth="2" 
                strokeDasharray="5,3"
                strokeOpacity="0.9"
              />

              {/* Probable Origin Point */}
              {layers.origin && (
                <g transform={`translate(${originX}, ${originY})`} className="cursor-pointer">
                  {/* Uncertainty Ellipse */}
                  <ellipse 
                    rx="32" 
                    ry="20" 
                    transform="rotate(-25)" 
                    fill={mapType === 'map' ? '#ea4335' : '#38bdf8'} 
                    fillOpacity="0.14" 
                    stroke={mapType === 'map' ? '#ea4335' : '#0284c7'} 
                    strokeWidth="1.5" 
                    strokeDasharray="3,3"
                  />
                  
                  {/* Google Maps Teardrop Pin Marker or Radar Beacon */}
                  {mapType === 'map' ? (
                    <g>
                      {/* Pin Drop Shadow */}
                      <ellipse cx="1" cy="2" rx="7" ry="3" fill="#1f2937" fillOpacity="0.35" />
                      {/* Red Teardrop Body */}
                      <path 
                        d="M 0,-28 C -7.5,-28 -13.5,-22 -13.5,-14.5 C -13.5,-5 0,0 0,0 C 0,0 13.5,-5 13.5,-14.5 C 13.5,-22 7.5,-28 0,-28 Z" 
                        fill="#ea4335" 
                        stroke="#c5221f" 
                        strokeWidth="0.8" 
                      />
                      {/* White Center Circle */}
                      <circle cx="0" cy="-14.5" r="4.5" fill="#ffffff" />
                    </g>
                  ) : (
                    <g>
                      <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                      <circle r="12" fill="none" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.6" className="animate-ping" style={{ animationDuration: '3s' }} />
                    </g>
                  )}

                  {/* Origin Marker Label */}
                  <rect x="-85" y={mapType === 'map' ? "-52" : "-36"} width="170" height="22" rx="4" fill="#ffffff" fillOpacity="0.98" stroke="#dadce0" strokeWidth="1" className="shadow-sm" />
                  <text x="0" y={mapType === 'map' ? "-38" : "-22"} textAnchor="middle" fill="#202124" fontSize="10" fontWeight="600" className="font-poppins">
                    SUSPECTED ORIGIN (T-14h)
                  </text>
                </g>
              )}

              {/* Future Drift Forecast Envelope (Spill Now -> T+24h) */}
              {/* 95% Confidence Dispersion Cone */}
              <path 
                d={`M ${currentSpillX} ${currentSpillY} L 660 370 L 630 450 Z`} 
                fill="#38bdf8" 
                fillOpacity="0.16" 
                stroke="#0284c7" 
                strokeWidth="1" 
                strokeDasharray="3,3"
                strokeOpacity="0.6"
              />

              {/* Mean Drift Trajectory Line */}
              <path 
                d={`M ${currentSpillX} ${currentSpillY} Q 545 345 ${futureDriftX} ${futureDriftY}`} 
                fill="none" 
                stroke="#0369a1" 
                strokeWidth="2.5" 
                strokeOpacity="0.95"
              />

              {/* T+12h waypoint */}
              <circle cx="545" cy="345" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x="555" y="348" fill="#0369a1" fontSize="9" fontWeight="600" className="font-poppins">T+12h</text>

              {/* T+24h waypoint */}
              <circle cx={futureDriftX} cy={futureDriftY} r="5" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
              <text x={futureDriftX + 10} y={futureDriftY + 4} fill="#0f172a" fontSize="10" fontWeight="600" className="font-poppins">
                T+24h (26.8 NM)
              </text>
            </g>
          )}

          {/* 6. Oil Spill Slick Polygon Layer - Distinct Dark Viscous Texture vs Light Waters */}
          {layers.spill && (
            <g id="map-spill-layer">
              {/* Level 1: Outer Hydrocarbon Sheen Halo & Iridescent Rim */}
              <path 
                d={outerSheenPath} 
                fill="url(#outerHydrocarbonSheen)" 
                stroke="url(#iridescentRainbowRim)" 
                strokeWidth="1.8"
                strokeOpacity="0.85"
              />

              {/* Level 2: Main Heavy Crude Slick Polygon with 3D Relief Shadow */}
              <g filter="url(#crudeReliefShadow)">
                {/* Base Dark Heavy Crude Gradient */}
                <path 
                  d={slickPath} 
                  fill="url(#denseCrudeCore)" 
                  stroke="#000000" 
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                
                {/* Dark Viscous Texture Pattern Overlay */}
                <path 
                  d={slickPath} 
                  fill="url(#darkCrudeOilTexture)" 
                  opacity="0.96"
                />

                {/* Iridescent Rainbow Sheen Fringe Boundary */}
                <path 
                  d={slickPath} 
                  fill="none" 
                  stroke="url(#iridescentRainbowRim)" 
                  strokeWidth="1.2"
                  strokeOpacity="0.85"
                />
              </g>

              {/* Level 3: Inner Ultra-Dense Viscous Tar Core */}
              <path 
                d={innerDenseCorePath} 
                fill="#000000" 
                fillOpacity="0.98"
                stroke="#1e293b"
                strokeWidth="1"
              />

              {/* High-density viscous bitumen mousse ridges */}
              <ellipse 
                cx={currentSpillX + 10} 
                cy={currentSpillY + 6} 
                rx="34" 
                ry="14" 
                transform="rotate(24, 460, 286)"
                fill="#000000" 
                fillOpacity="0.98" 
                stroke="#334155"
                strokeWidth="0.8"
              />
              <ellipse 
                cx={currentSpillX - 16} 
                cy={currentSpillY - 8} 
                rx="22" 
                ry="10" 
                transform="rotate(18, 434, 272)"
                fill="#020408" 
                fillOpacity="0.95" 
                stroke="#1f293d"
                strokeWidth="0.6"
              />

              {/* Specular Gloss Sheen Highlights on Viscous Oil Core */}
              <path 
                d={`M ${currentSpillX - 15} ${currentSpillY + 4} Q ${currentSpillX + 10} ${currentSpillY - 6} ${currentSpillX + 32} ${currentSpillY + 8}`} 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="1.2" 
                strokeOpacity="0.55" 
                strokeLinecap="round" 
              />

              {/* Oil slick dimension calipers */}
              <line x1="390" y1="245" x2="515" y2="310" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2,2" strokeOpacity="0.9" />
              <rect x="420" y="248" width="84" height="16" rx="3" fill="#ffffff" fillOpacity="0.95" stroke="#0f172a" strokeWidth="0.8" />
              <text x="462" y="260" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="700" className="font-poppins">
                8.4 km LENGTH
              </text>

              {/* Slick Centroid Pulsing Hazard Marker & High-Contrast Badge */}
              <g transform={`translate(${currentSpillX}, ${currentSpillY})`}>
                {/* Warning Radar Ping */}
                <circle r="22" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.8" />
                <circle r="5" fill="#000000" stroke="#f59e0b" strokeWidth="2" />

                {/* High-Contrast Dark Spill Badge */}
                <g transform="translate(0, 32)">
                  <rect 
                    x="-88" 
                    y="-12" 
                    width="176" 
                    height="24" 
                    rx="5" 
                    fill="#04060b" 
                    stroke="#f59e0b" 
                    strokeWidth="1.5" 
                    className="shadow-xl" 
                  />
                  <text x="0" y="3" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="800" className="font-poppins tracking-wider">
                    ⚠️ CRUDE OIL SPILL: 18.42 km²
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* INCOIS OOSA Lagrangian Particle Dispersion Simulation */}
          {mapType === 'incois' && showOosaParticles && (
            <g id="incois-oosa-particle-cloud">
              {/* Discrete Lagrangian particle cloud modeled after INCOIS OOSA */}
              {[
                // Core heavy crude particles
                { dx: 0, dy: 0, r: 2.8, color: '#0f172a' },
                { dx: -14, dy: 6, r: 2.4, color: '#0f172a' },
                { dx: 16, dy: -8, r: 2.2, color: '#0f172a' },
                { dx: -8, dy: -14, r: 2.5, color: '#0f172a' },
                { dx: 22, dy: 10, r: 2.3, color: '#0f172a' },
                { dx: -25, dy: 12, r: 2.2, color: '#0f172a' },
                { dx: 8, dy: 18, r: 2.4, color: '#0f172a' },
                // Weathering & emulsified mousse particles
                { dx: 36, dy: 24, r: 2.0, color: '#78350f' },
                { dx: 48, dy: 32, r: 1.9, color: '#78350f' },
                { dx: 28, dy: 44, r: 1.8, color: '#92400e' },
                { dx: 62, dy: 46, r: 1.9, color: '#92400e' },
                { dx: 78, dy: 58, r: 1.7, color: '#b45309' },
                { dx: 54, dy: 68, r: 1.8, color: '#b45309' },
                { dx: 92, dy: 76, r: 1.6, color: '#d97706' },
                { dx: 110, dy: 90, r: 1.5, color: '#d97706' },
                // Thin iridescent sheen particles extending downcurrent
                { dx: 124, dy: 98, r: 1.4, color: '#0284c7' },
                { dx: 142, dy: 110, r: 1.3, color: '#38bdf8' },
                { dx: 114, dy: 118, r: 1.4, color: '#0284c7' },
                { dx: 158, dy: 124, r: 1.3, color: '#38bdf8' },
                { dx: 176, dy: 138, r: 1.2, color: '#7dd3fc' },
                { dx: 194, dy: 152, r: 1.2, color: '#7dd3fc' },
              ].map((p, idx) => (
                <circle 
                  key={`oosa-p-${idx}`} 
                  cx={currentSpillX + p.dx} 
                  cy={currentSpillY + p.dy} 
                  r={p.r} 
                  fill={p.color} 
                  fillOpacity="0.88"
                />
              ))}

              {/* OOSA Beaching Risk Indicator Banner */}
              <g transform={`translate(${futureDriftX - 50}, ${futureDriftY + 28})`}>
                <rect x="-10" y="-12" width="220" height="24" rx="5" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.2" className="shadow-md" />
                <text x="100" y="4" textAnchor="middle" fill="#b91c1c" fontSize="9.5" fontWeight="700" className="font-poppins">
                  🚨 INCOIS OOSA: COASTAL RISK ETA 36h
                </text>
              </g>
            </g>
          )}

          {/* INCOIS Moored Observational Network Stations */}
          {mapType === 'incois' && (
            <g id="incois-stations-layer">
              {/* WRB-02 Moored Wave Rider Buoy */}
              <g 
                transform="translate(540, 160)" 
                className="cursor-pointer group"
                onClick={() => setSelectedBuoy(INCOIS_BUOY_STATIONS[0])}
              >
                <circle r="15" fill="none" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.6" className="animate-ping" style={{ animationDuration: '2.8s' }} />
                <circle r="7.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
                <circle r="2.5" fill="#0f172a" />
                <rect x="-56" y="-28" width="112" height="18" rx="3" fill="#ffffff" fillOpacity="0.96" stroke="#0284c7" strokeWidth="1" className="shadow-xs" />
                <text x="0" y="-16" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="700" className="font-poppins">
                  INCOIS WRB-02 (BUOY)
                </text>
              </g>

              {/* ADCP-01 Deepwater Profiler */}
              <g 
                transform="translate(260, 410)" 
                className="cursor-pointer group"
                onClick={() => setSelectedBuoy(INCOIS_BUOY_STATIONS[1])}
              >
                <polygon points="0,-8 7,5 -7,5" fill="#10b981" stroke="#0f172a" strokeWidth="1.2" />
                <rect x="-52" y="-26" width="104" height="16" rx="3" fill="#ffffff" fillOpacity="0.96" stroke="#10b981" strokeWidth="1" className="shadow-xs" />
                <text x="0" y="-14" textAnchor="middle" fill="#065f46" fontSize="8.5" fontWeight="700" className="font-poppins">
                  ADCP-01 PROFILER
                </text>
              </g>
            </g>
          )}

          {/* 7. Active Timeline Animated Marker (if timeline scrubbing) */}
          {timelineOffsetHours !== 0 && (
            <g transform={`translate(${activePos.x}, ${activePos.y})`}>
              <circle r="16" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="4,2" className="animate-spin" style={{ animationDuration: '8s' }} />
              <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              <rect x="-45" y="-30" width="90" height="18" rx="3" fill="#0284c7" fillOpacity="0.95" />
              <text x="0" y="-18" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700" className="font-poppins">
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
              : '#0284c7';

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
                  strokeOpacity={isSelected ? "0.9" : "0.55"}
                  strokeDasharray="4,3"
                />

                {/* Loiter highlight for rank 1 */}
                {vessel.rank === 1 && (
                  <circle r="22" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3,2" />
                )}

                {/* Selection or pulse highlight */}
                {isSelected && (
                  <circle r="18" fill="none" stroke="#0284c7" strokeWidth="2" className="animate-pulse" />
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
                    fill="#ffffff" 
                    fillOpacity="0.96" 
                    stroke={isSelected ? "#0284c7" : vesselColor} 
                    strokeWidth={isSelected ? "1.5" : "1"} 
                    className="shadow-sm"
                  />
                  <text x="6" y="4" fill="#0f172a" fontSize="9.5" fontWeight="600" className="font-poppins">
                    {vessel.rank === 1 ? `⚠️ #${vessel.rank} ${vessel.name}` : `#${vessel.rank} ${vessel.name}`}
                  </text>
                  <text x={isTopRanked ? "106" : "88"} y="4" fill={vesselColor} fontSize="9" fontWeight="700" className="font-poppins">
                    {vessel.overallScore}%
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Map Header / Telemetry Bar & INCOIS / Google Maps Mode Switcher */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2 z-20">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Mode Switcher: Google Maps (Live) | INCOIS LSF | Map (2D) | Satellite */}
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 p-0.5 text-xs font-semibold font-poppins">
            <button
              id="google-maps-live-mode-btn"
              onClick={() => setMapType('google')}
              className="px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Maps (Live)</span>
            </button>
            <button
              id="incois-lsf-mode-btn"
              onClick={() => setMapType('incois')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                mapType === 'incois'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>INCOIS LSF</span>
            </button>
            <button
              id="google-maps-mode-map-btn"
              onClick={() => setMapType('map')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                mapType === 'map'
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Vector (2D)</span>
            </button>
          </div>


          {/* INCOIS LSF Bulletin Action Button */}
          <button
            id="incois-lsf-bulletin-btn"
            onClick={() => setShowIncoisDrawer(!showIncoisDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-md text-xs font-semibold font-poppins transition-colors ${
              showIncoisDrawer
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white/95 text-blue-800 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-blue-600" />
            <span>LSF Ocean Bulletin</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">LIVE</span>
          </button>

          {/* Incident location badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800 font-poppins">
              {incident.name}
            </span>
            <span className="text-xs text-slate-500 font-poppins hidden lg:inline">
              [{incident.coordinates.lat.toFixed(4)}°N, {Math.abs(incident.coordinates.lng).toFixed(4)}°W]
            </span>
          </div>
        </div>

        {/* Live cursor coordinates & INCOIS status readout */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-poppins text-slate-700">
          <div className="flex items-center gap-1.5 font-poppins">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
            <span>LAT {mouseCoord.lat}</span>
            <span className="text-slate-300">|</span>
            <span>LON {mouseCoord.lng}</span>
          </div>
          {mapType === 'incois' && incoisForecast && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-blue-700 font-semibold">
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                <span>Hs: {incoisForecast?.wave?.significantWaveHeightM ?? incoisForecast?.significantWaveHeightM ?? 1.35}m</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map Control Buttons (Top-Right / Right) */}
      {showControls && (
        <div className="absolute top-14 right-3 flex flex-col gap-2 font-poppins z-20">
          <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden">
            <button 
              id="map-zoom-in-btn"
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              id="map-zoom-out-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              id="map-reset-btn"
              onClick={handleResetView}
              title="Reset Pan & Zoom"
              className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button 
              id="map-layers-toggle-btn"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Toggle Layers"
              className={`p-2.5 rounded-lg shadow-md border transition-colors flex items-center justify-center ${
                showLayerMenu 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Layer Toggle Dropdown Panel */}
            {showLayerMenu && (
              <div className="absolute right-full top-0 mr-2 w-52 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-30 text-xs font-poppins">
                <div className="font-semibold text-slate-800 mb-2 pb-1 border-b border-slate-100 px-1 flex items-center justify-between font-poppins">
                  <span>Ocean Map Layers</span>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  {/* INCOIS Specific Toggles */}
                  {mapType === 'incois' && (
                    <div className="pb-1.5 mb-1.5 border-b border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold text-blue-800 uppercase px-1">INCOIS Services</div>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer text-blue-900 font-poppins">
                        <input 
                          type="checkbox"
                          checked={showOosaParticles}
                          onChange={(e) => setShowOosaParticles(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-white"
                        />
                        <span>OOSA Particle Cloud</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer text-blue-900 font-poppins">
                        <input 
                          type="checkbox"
                          checked={showLsfWaveContours}
                          onChange={(e) => setShowLsfWaveContours(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-white"
                        />
                        <span>Significant Wave Height (Hs)</span>
                      </label>
                    </div>
                  )}

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
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700 font-poppins"
                    >
                      <input 
                        type="checkbox"
                        checked={layers[key as keyof MapLayerConfig]}
                        onChange={() => toggleLayer(key as keyof MapLayerConfig)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-white"
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
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-200 shadow-md text-xs text-slate-700 max-w-xs font-poppins z-10">
        <div className="flex items-center justify-between font-semibold text-slate-900 mb-1.5 font-poppins">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>{mapType === 'incois' ? 'INCOIS LSF Ocean Chart' : 'Chart Symbology'}</span>
          </div>
          {mapType === 'incois' && (
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-bold">OOSA ADVISORY</span>
          )}
        </div>

        {/* INCOIS Sea State Bar in INCOIS mode */}
        {mapType === 'incois' && (
          <div className="mb-2 pb-2 border-b border-slate-100">
            <div className="flex justify-between text-[9.5px] text-slate-600 mb-1 font-poppins">
              <span>Sea State: <strong className="text-teal-700">Moderate (1.35m)</strong></span>
              <span>WMO Code 4</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex w-full">
              <div className="bg-sky-400 w-1/5" title="Calm <0.5m" />
              <div className="bg-teal-400 w-1/5" title="Slight 0.5-1.25m" />
              <div className="bg-teal-600 w-1/5 relative" title="Moderate 1.25-2.5m">
                {/* Active indicator dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>
              <div className="bg-amber-500 w-1/5" title="Rough 2.5-4m" />
              <div className="bg-red-500 w-1/5" title="Very Rough >4m" />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 mt-0.5 font-poppins">
              <span>Calm</span>
              <span>Slight</span>
              <span className="font-bold text-teal-700">Moderate</span>
              <span>Rough</span>
              <span>V.Rough</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-poppins">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-[#04060b] border border-amber-400 shadow-xs" />
            <span className="font-semibold text-slate-900">Crude Spill (Dark)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-sky-100 border border-sky-300" />
            <span className="text-slate-600">Clean Water (Light)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-full bg-slate-800 border border-pink-400" />
            <span className="text-slate-700">Surface Sheen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-[#0a101b] border-b border-amber-800" />
            <span className="text-slate-700">Oily Leak Track</span>
          </div>
          {mapType === 'incois' ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
              <span>Wave Buoy WRB</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow-xs" />
              <span>Origin Point</span>
            </div>
          )}
          {mapType === 'incois' ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-950 border border-amber-500" />
              <span>OOSA Particles</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-sky-600" />
              <span>Backtrack Path</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-blue-700" />
            <span>Future 24h Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-red-500" />
            <span>Suspect AIS Vessel</span>
          </div>
        </div>
      </div>

      {/* Selected/Hovered Vessel Preview Card (Bottom-Right) */}
      {(() => {
        const validSelected = selectedVessel && incident.vessels.some(v => v.mmsi === selectedVessel.mmsi) ? selectedVessel : null;
        const v = hoveredVessel || validSelected;
        if (!v) return null;
        return (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-xl max-w-sm z-20 text-xs font-poppins">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 font-poppins">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900 text-sm font-poppins">{v.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-poppins ${
                    v.rank === 1 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    SCORE {v.overallScore}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 mb-2 font-poppins">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-poppins">MMSI / IMO</span>
                    <span className="font-poppins font-medium">{v.mmsi} / {v.imo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-poppins">TYPE & FLAG</span>
                    <span className="font-poppins">{v.type} ({v.flag})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-poppins">DISTANCE AT ORIGIN</span>
                    <span className="font-semibold text-slate-900 font-poppins">{v.evidence.distanceAtOriginNM} NM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-poppins">TRAJECTORY MATCH</span>
                    <span className="font-semibold text-sky-700 font-poppins">{v.evidence.trajectoryMatchPercent}%</span>
                  </div>
                </div>
                {v.evidence.behaviorAnomalies.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 font-poppins">
                    ⚠️ {v.evidence.behaviorAnomalies[0]}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Selected Buoy Telemetry Popover (Bottom-Center/Right) */}
      {selectedBuoy && (
        <div className="absolute bottom-12 right-3 sm:right-16 bg-white/95 backdrop-blur-md p-3 rounded-lg border border-blue-200 shadow-xl max-w-xs z-30 text-xs font-poppins">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900">{selectedBuoy.name}</span>
            </div>
            <button 
              onClick={() => setSelectedBuoy(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-slate-700">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Station Type:</span>
              <span className="font-semibold">{selectedBuoy.type}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Position:</span>
              <span>
                {(selectedBuoy.coordinates?.lat ?? selectedBuoy.lat ?? 0).toFixed(3)}°N, {Math.abs(selectedBuoy.coordinates?.lng ?? selectedBuoy.lng ?? 0).toFixed(3)}°W
              </span>
            </div>
            {(selectedBuoy.liveHsM ?? selectedBuoy.waveHeightM) !== undefined && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Wave Height (Hs):</span>
                <span className="font-bold text-blue-700">{selectedBuoy.liveHsM ?? selectedBuoy.waveHeightM} m</span>
              </div>
            )}
            {(selectedBuoy.liveTpSec ?? selectedBuoy.periodSec) !== undefined && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Wave Period (Tp):</span>
                <span className="font-medium">{selectedBuoy.liveTpSec ?? selectedBuoy.periodSec} s</span>
              </div>
            )}
            {(selectedBuoy.liveSstC ?? selectedBuoy.sstC) !== undefined && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Sea Temperature (SST):</span>
                <span className="font-medium text-emerald-700">{selectedBuoy.liveSstC ?? selectedBuoy.sstC} °C</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedBuoy.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scale Rule & Cartography / INCOIS Attribution (Bottom-Right) */}
      <div className="absolute bottom-2.5 right-3 pointer-events-none hidden sm:flex items-center gap-2 text-[10px] text-slate-600 font-poppins bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs border border-slate-200 z-10">
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 border-b-2 border-l-2 border-r-2 border-slate-800" />
          <span className="font-semibold text-slate-800">10 km / 5.4 NM</span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">
          {mapType === 'incois'
            ? 'ESSO - INCOIS • INDOFOS & OOSA Advisory Models • https://incois.gov.in'
            : '2D Cartography © NOAA • Google-style Map'}
        </span>
      </div>

      {/* INCOIS Location Specific Forecast (LSF) & OOSA Detailed Modal Drawer */}
      {showIncoisDrawer && incoisForecast && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-blue-200 z-40 flex flex-col font-poppins overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-200" />
              <div>
                <h3 className="font-bold text-sm">INCOIS LSF Ocean Bulletin</h3>
                <p className="text-[10px] text-blue-200">Location Specific Forecast & OOSA Advisory</p>
              </div>
            </div>
            <button 
              onClick={() => setShowIncoisDrawer(false)}
              className="p-1 hover:bg-blue-800 rounded text-blue-100"
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700">
            {/* INCOIS Source Card */}
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-900 text-[11px]">ESSO - INCOIS Advisory</span>
                <a 
                  href="https://incois.gov.in/oceanservices/LSF/index.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-semibold text-[10px] flex items-center gap-1"
                >
                  Visit Portal ↗
                </a>
              </div>
              <p className="text-[10px] text-blue-700">
                Data generated via INDOFOS (Indian Ocean Forecast System) wave, current, and OOSA spill dispersion models.
              </p>
            </div>

            {/* Significant Waves Section */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                Wave Forecast Parameters
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sig Wave Height (Hs)</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {incoisForecast?.wave?.significantWaveHeightM ?? incoisForecast?.significantWaveHeightM ?? 1.35} m
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Peak Period (Tp)</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {incoisForecast?.wave?.peakWavePeriodSec ?? incoisForecast?.peakWavePeriodSec ?? 8.2} s
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Mean Direction</span>
                  <span className="font-semibold text-slate-800">
                    {incoisForecast?.wave?.meanWaveDirectionDeg ?? incoisForecast?.meanWaveDirectionDeg ?? 152}° (SSW)
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Swell Height</span>
                  <span className="font-semibold text-slate-800">
                    {incoisForecast?.wave?.swellHeightM ?? 1.05} m
                  </span>
                </div>
              </div>
            </div>

            {/* Ocean Currents & Wind Section */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-teal-600" />
                Currents & Surface Wind
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Surface Current Speed</span>
                  <span className="font-bold text-teal-700 text-sm">
                    {incoisForecast?.current?.speedKnots ?? incoisForecast?.currentSpeedKnots ?? 1.25} kt
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Current Direction</span>
                  <span className="font-semibold text-slate-800">
                    {incoisForecast?.current?.directionDeg ?? incoisForecast?.currentDirectionDeg ?? 142}° (SE)
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Wind Velocity</span>
                  <span className="font-semibold text-slate-800">
                    {incoisForecast?.wind?.speedKnots ?? incoisForecast?.windSpeedKnots ?? 14.5} kt
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sea Temp (SST)</span>
                  <span className="font-semibold text-emerald-700">
                    {incoisForecast?.waterTemperatureC ?? incoisForecast?.seaSurfaceTemperatureC ?? 27.6}°C
                  </span>
                </div>
              </div>
            </div>

            {/* OOSA Online Oil Spill Advisory Section */}
            <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/50">
              <h4 className="font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                OOSA Oil Spill Dispersion Simulation
              </h4>
              <p className="text-[10px] text-amber-800 mb-2">
                Lagrangian particle advection under INDOFOS hydrodynamic forcing.
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between bg-white/80 p-1.5 rounded border border-amber-100">
                  <span className="text-slate-600">Simulated Particles:</span>
                  <span className="font-bold text-slate-900">
                    {incoisForecast?.oosaAdvisory?.particleCount ?? 2500} points
                  </span>
                </div>
                <div className="flex justify-between bg-white/80 p-1.5 rounded border border-amber-100">
                  <span className="text-slate-600">Estimated Evaporation:</span>
                  <span className="font-bold text-slate-900">
                    {incoisForecast?.oosaAdvisory?.evaporatedPercent ?? 24.2}%
                  </span>
                </div>
                <div className="flex justify-between bg-white/80 p-1.5 rounded border border-amber-100">
                  <span className="text-slate-600">Coastal Impact Risk:</span>
                  <span className="font-bold text-red-600 uppercase">
                    {incoisForecast?.oosaAdvisory?.beachImpactRisk ?? incoisForecast?.oosaAdvisory?.shorelineVulnerabilityIndex ?? 'HIGH'}
                  </span>
                </div>
                <div className="flex justify-between bg-white/80 p-1.5 rounded border border-amber-100">
                  <span className="text-slate-600">Trajectory Leeway:</span>
                  <span className="font-semibold text-slate-800">
                    {incoisForecast?.oosaAdvisory?.trajectoryHeadingDeg ?? 138}° @ {incoisForecast?.oosaAdvisory?.driftVelocityKnots ?? 1.2} kt
                  </span>
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-red-100 border border-red-200 rounded text-[10px] text-red-800 font-medium">
                ⚠️ Coastal Warning: Particle plume heading towards Barrier Coast with estimated landfall in 36 to 48 hours unless contained.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
