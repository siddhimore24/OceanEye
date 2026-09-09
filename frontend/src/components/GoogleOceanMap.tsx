/**
 * OceanEye - Interactive Google Maps Geospatial Intelligence Component
 *
 * Integrates Google Maps JavaScript API via @vis.gl/react-google-maps to visualize:
 * A. Oil Spill Polygon & Centroid with Clickable Metadata
 * B. Source Zone (MultiPolygon) & Uncertainty Envelope
 * C. AIS Candidate Vessels with Rank Styling (#1 Suspect Alert) & InfoWindows
 * D. Drift Model Backtrack & Future Trajectory
 * E. Interactive Layer Toggles & Case Bounds Auto-Fitting
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Eye,
  Ship,
  Waves,
  AlertTriangle,
  Compass,
  Crosshair,
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Radio,
  Key,
  ShieldCheck,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { SpillIncident, VesselAttribution } from '../types';
import { useApp } from '../context/AppContext';
import { ErrorBoundary } from './ErrorBoundary';

import {
  getSpillPolygonPaths,
  getSourceZonePolygons,
  getDriftTrajectoryLines,
  computeIncidentBounds,
  LatLng,
} from '../utils/geoJsonAdapter';

interface GoogleOceanMapProps {
  incident: SpillIncident;
  selectedVessel?: VesselAttribution | null;
  onSelectVessel?: (vessel: VesselAttribution | null) => void;
  timelineOffsetHours?: number;
  highlightOrigin?: boolean;
  className?: string;
  showControls?: boolean;
  onSwitchToSvgFallback?: () => void;
}

/**
 * Helper component that auto-fits Google Map bounds whenever the active incident changes
 */
const MapBoundsFitter: React.FC<{
  incident: SpillIncident;
  triggerReset: number;
}> = ({ incident, triggerReset }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      const bounds = computeIncidentBounds(incident);
      map.fitBounds(bounds, {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
      });
    } catch (e) {
      console.warn('Map fitBounds error:', e);
    }
  }, [map, incident, triggerReset]);

  return null;
};

const GoogleOceanMapInternal: React.FC<GoogleOceanMapProps> = ({
  incident,
  selectedVessel,
  onSelectVessel,
  timelineOffsetHours = 0,
  highlightOrigin = false,
  className = '',
  showControls = true,
  onSwitchToSvgFallback,
}) => {
  const { incidents, setActiveIncident } = useApp();

  // Custom API key stored in localStorage or .env (safely purge if an AI Studio key was mistakenly stored)
  const [customKey, setCustomKey] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('oceaneye_user_gmaps_key') || '';
      if (stored.startsWith('AQ.')) {
        localStorage.removeItem('oceaneye_user_gmaps_key');
        return '';
      }
      return stored;
    } catch {
      return '';
    }
  });
  const [inputKey, setInputKey] = useState<string>('');
  const [showLiveSpillsList, setShowLiveSpillsList] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  // Catch Google Maps authentication failure (invalid key / disabled service)
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] gm_authFailure callback invoked');
      setAuthError(true);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch {}
      }
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Environment variables
  const apiKey = (customKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID').trim();

  const handleSaveCustomKey = (keyVal: string) => {
    const trimmed = keyVal.trim();
    if (trimmed) {
      try {
        localStorage.setItem('oceaneye_user_gmaps_key', trimmed);
      } catch {}
      setCustomKey(trimmed);
      setAuthError(false);
    }
  };

  const handleClearCustomKey = () => {
    try {
      localStorage.removeItem('oceaneye_user_gmaps_key');
    } catch {}
    setCustomKey('');
    setInputKey('');
    setAuthError(false);
  };

  // Layer toggle state
  const [layers, setLayers] = useState({
    spill: true,
    sourceZone: true,
    vessels: true,
    trajectories: true,
    drift: true,
  });

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('hybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Popover / InfoWindow state
  const [activeInfoWindow, setActiveInfoWindow] = useState<
    'spill' | 'sourceZone' | 'origin' | { type: 'vessel'; vessel: VesselAttribution } | null
  >(null);

  // Hovered vessel
  const [hoveredVessel, setHoveredVessel] = useState<VesselAttribution | null>(null);

  // Mouse coordinate readout
  const [cursorCoords, setCursorCoords] = useState<string>('Hover over map');

  // Whenever the active incident changes (e.g. newly analyzed spill loaded),
  // reset info windows, hover state, and trigger bounds re-fit
  useEffect(() => {
    setActiveInfoWindow(null);
    setHoveredVessel(null);
    setResetTrigger((prev) => prev + 1);
  }, [incident.id]);

  // Compute geometry paths
  const spillPaths = useMemo(() => getSpillPolygonPaths(incident), [incident]);
  const sourceZonePolygons = useMemo(() => getSourceZonePolygons(incident), [incident]);
  const driftLines = useMemo(() => getDriftTrajectoryLines(incident), [incident]);
  const spillCentroid = useMemo(
    () => incident.characteristics.centroid || incident.coordinates,
    [incident]
  );
  const predictedOrigin = useMemo(
    () => incident.drift?.predictedOrigin || { lat: incident.coordinates.lat + 0.07, lng: incident.coordinates.lng - 0.07 },
    [incident]
  );

  // Check if vessel trajectory points are available
  const hasTrajectoryData = useMemo(() => {
    return (
      incident.vessels &&
      incident.vessels.some(
        (v) => v.trackHistory && v.trackHistory.length > 1
      )
    );
  }, [incident.vessels]);

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleResetBounds = () => {
    setResetTrigger((prev) => prev + 1);
  };

  // Detect key type and validity
  const isAiStudioKey = apiKey.startsWith('AQ.');
  const isKeyMissing = !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY';

  // 1. Case: User pasted a Google AI Studio (Gemini) key into Google Maps
  if (isAiStudioKey) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-900 border border-amber-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center font-poppins min-h-[460px] text-white ${className}`}
      >
        <div className="max-w-md w-full bg-slate-950/95 backdrop-blur-md p-6 rounded-2xl border border-amber-500/40 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-100 mb-2">
            Google AI Studio Key Detected
          </h3>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            The key you entered starts with <code className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[11px]">AQ...</code>, which is a <strong>Google AI Studio / Gemini API Key</strong>.
          </p>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Google Maps requires a <strong>Google Maps Platform API key</strong> (starts with <code className="text-sky-300 font-mono">AIzaSy...</code> from Google Cloud Console) or a free instant <strong>Maps Demo Key</strong>.
          </p>

          <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] text-slate-400 text-left font-mono mb-4">
            💡 Your AI Studio key has been configured for Gemini intelligence dossiers. For the map, choose one of the options below:
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleClearCustomKey}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Map Key</span>
            </button>

            {onSwitchToSvgFallback && (
              <button
                type="button"
                id="switch-incois-vector-btn"
                onClick={onSwitchToSvgFallback}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Use INCOIS Vector Chart</span>
              </button>
            )}

            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <span>Get Free Demo Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Case: Google Maps Authentication Error (invalid key or unauthorized origin)
  if (authError) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-900 border border-red-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center font-poppins min-h-[460px] text-white ${className}`}
      >
        <div className="max-w-md w-full bg-slate-950/95 backdrop-blur-md p-6 rounded-2xl border border-red-500/40 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-100 mb-2">
            Google Maps Authentication Error
          </h3>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Google Maps Platform could not authorize with the provided key. Please verify that <strong>Maps JavaScript API</strong> is enabled on your key in Google Cloud Console, or switch to the vector chart.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleClearCustomKey}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Key & Retry</span>
            </button>

            {onSwitchToSvgFallback && (
              <button
                type="button"
                onClick={onSwitchToSvgFallback}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Waves className="w-3.5 h-3.5" />
                <span>View INCOIS Vector Chart</span>
              </button>
            )}

            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <span>Free Demo Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Case: Missing API Key Fallback Guard
  if (isKeyMissing) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center font-poppins min-h-[460px] text-white ${className}`}
      >
        <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Key className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Google Maps Platform Integration
          </h3>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Enter your Google Maps Platform API Key (starts with <code className="text-sky-300">AIzaSy...</code>) or free zero-cost <strong>Maps Demo Key</strong> (no billing required) to enable live satellite mapping, SAR spill polygons, and AIS vessel tracks.
          </p>

          {/* In-app Quick Key Input */}
          <div className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input
                id="gmaps-quick-key-input"
                type="password"
                placeholder="AIzaSy... or Maps Demo Key"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                id="save-gmaps-key-btn"
                onClick={() => handleSaveCustomKey(inputKey)}
                disabled={!inputKey.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
              >
                Connect Key
              </button>
            </div>
            <div className="text-[11px] text-slate-500 font-mono text-left">
              Or configure <code className="text-amber-300">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="text-amber-300">frontend/.env</code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            {onSwitchToSvgFallback && (
              <button
                type="button"
                id="switch-incois-vector-btn"
                onClick={onSwitchToSvgFallback}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <Waves className="w-3.5 h-3.5" />
                <span>View INCOIS Vector Chart</span>
              </button>
            )}
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Get Free Maps Demo Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`google-ocean-map-${incident.id}`}
      className={`relative overflow-hidden select-none bg-slate-950 border border-slate-200 rounded-xl font-poppins ${className}`}
      style={{ minHeight: '480px', height: '100%' }}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={mapId}
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          defaultCenter={{ lat: incident.coordinates.lat, lng: incident.coordinates.lng }}
          defaultZoom={11}
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full min-h-[480px]"
          onMousemove={(e) => {
            if (e.detail?.latLng) {
              const { lat, lng } = e.detail.latLng;
              setCursorCoords(`${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`);
            }
          }}
        >
          {/* Automatic Bounds Auto-Fitter */}
          <MapBoundsFitter incident={incident} triggerReset={resetTrigger} />

          {/* ========================================================================= */}
          {/* A. OIL SPILL LAYER: Polygon, Sheen Halo, & Centroid Marker */}
          {/* ========================================================================= */}
          {layers.spill && (
            <>
              {/* Outer Hydrocarbon Sheen Halo */}
              <Polygon
                paths={spillPaths}
                fillColor="#0a101b"
                fillOpacity={0.75}
                strokeColor="#f59e0b"
                strokeOpacity={0.95}
                strokeWeight={2.5}
                clickable={true}
                zIndex={20}
                onClick={() => setActiveInfoWindow('spill')}
              />

              {/* Oil Spill Centroid Advanced Marker */}
              <AdvancedMarker
                position={{ lat: spillCentroid.lat, lng: spillCentroid.lng }}
                title={`Crude Spill: ${incident.characteristics.areaSqKm} km²`}
                onClick={() => setActiveInfoWindow('spill')}
              >
                <div className="relative group cursor-pointer">
                  {/* Pulsing hazard radar halo */}
                  <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                  <div className="relative flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/95 border border-amber-400 text-amber-300 rounded-full shadow-2xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wide font-mono">
                      SPILL {incident.characteristics.areaSqKm} km²
                    </span>
                  </div>
                </div>
              </AdvancedMarker>



              {/* Spill Information Popover / InfoWindow */}
              {activeInfoWindow === 'spill' && (
                <InfoWindow
                  position={{ lat: spillCentroid.lat, lng: spillCentroid.lng }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="p-2 max-w-xs font-poppins text-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <div className="p-1 bg-amber-100 text-amber-800 rounded">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-none">
                          Oil Spill Detection
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {incident.code || incident.id}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                          Surface Area
                        </span>
                        <span className="font-bold text-slate-900">
                          {incident.characteristics.areaSqKm} km²
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                          Confidence
                        </span>
                        <span className="font-bold text-emerald-600">
                          {incident.characteristics.confidenceScore}%
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                          Estimated Volume
                        </span>
                        <span className="font-bold text-slate-900">
                          {incident.characteristics.estimatedVolumeM3} m³
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                          Detection Time
                        </span>
                        <span className="font-semibold text-slate-700">
                          {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 bg-amber-50/80 p-1.5 rounded border border-amber-200/60 leading-tight">
                      <strong>Classification:</strong> {incident.characteristics.slickType} ({incident.characteristics.bonnCode})
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* B. SOURCE ZONE LAYER: MultiPolygon / Uncertainty Envelope & Origin Marker */}
          {/* ========================================================================= */}
          {layers.sourceZone && (
            <>
              {sourceZonePolygons.map((ring, idx) => (
                <Polygon
                  key={`source-zone-${idx}`}
                  paths={ring}
                  fillColor={idx === 0 ? '#0284c7' : '#0369a1'}
                  fillOpacity={idx === 0 ? 0.22 : 0.4}
                  strokeColor="#38bdf8"
                  strokeOpacity={0.9}
                  strokeWeight={idx === 0 ? 2 : 1.5}
                  clickable={true}
                  zIndex={10}
                  onClick={() => setActiveInfoWindow('sourceZone')}
                />
              ))}

              {/* Suspected Origin Point Marker */}
              <AdvancedMarker
                position={{ lat: predictedOrigin.lat, lng: predictedOrigin.lng }}
                title="Predicted Source Zone Origin"
                onClick={() => setActiveInfoWindow('origin')}
              >
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-1.5 rounded-full bg-sky-400/40 animate-ping pointer-events-none" />
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-sky-900/90 border border-sky-300 text-sky-200 rounded-full shadow-lg backdrop-blur-md">
                    <Radio className="w-3 h-3 text-sky-300 animate-pulse" />
                    <span className="text-[9.5px] font-bold tracking-wide">
                      SOURCE ZONE ({incident.drift?.originConfidencePercent || 94}%)
                    </span>
                  </div>
                </div>
              </AdvancedMarker>

              {/* Source Zone Popover / InfoWindow */}
              {(activeInfoWindow === 'sourceZone' || activeInfoWindow === 'origin') && (
                <InfoWindow
                  position={{ lat: predictedOrigin.lat, lng: predictedOrigin.lng }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="p-2 max-w-xs font-poppins text-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <div className="p-1 bg-sky-100 text-sky-800 rounded">
                        <Radio className="w-4 h-4 text-sky-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-none">
                          Predicted Source Zone
                        </h4>
                        <span className="text-[10px] text-sky-700 font-semibold">
                          Hydrodynamic Backtrack Simulation
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] mb-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Origin Coordinates:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {predictedOrigin.lat.toFixed(4)}°N, {predictedOrigin.lng.toFixed(4)}°E
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Origin Confidence:</span>
                        <span className="font-bold text-emerald-600">
                          {incident.drift?.originConfidencePercent || 93.8}%
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Release Window:</span>
                        <span className="font-semibold text-slate-800">
                          T-{incident.characteristics.estimatedAgeHours || 12}h UTC
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">24h Drift Speed:</span>
                        <span className="font-semibold text-slate-800">
                          {incident.drift?.driftSpeedKnots || 1.2} kts ({incident.drift?.driftDirectionDeg || 135}°)
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 bg-sky-50 p-1.5 rounded border border-sky-100 leading-tight">
                      <strong>Target Area:</strong> {incident.drift?.estimatedArrivalArea || 'Offshore Transit Corridor'}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* D. DRIFT MODEL VECTORS: Backtrack & Future Trajectory Lines */}
          {/* ========================================================================= */}
          {layers.drift && (
            <>
              {/* Backtrack Path (Origin -> Spill) */}
              <Polyline
                path={driftLines.backtrack}
                strokeColor="#38bdf8"
                strokeOpacity={0.85}
                strokeWeight={2.5}
                zIndex={15}
              />

              {/* Future Forecast Path (Spill -> Future) */}
              <Polyline
                path={driftLines.futureDrift}
                strokeColor="#0284c7"
                strokeOpacity={0.9}
                strokeWeight={3}
                zIndex={15}
              />
            </>
          )}

          {/* ========================================================================= */}
          {/* C. AIS CANDIDATE VESSELS: Markers, Rank Highlights & InfoWindows */}
          {/* ========================================================================= */}
          {layers.vessels &&
            incident.vessels &&
            incident.vessels.map((vessel) => {
              const isSelected = selectedVessel?.mmsi === vessel.mmsi;
              const isTopRanked = vessel.rank === 1;
              const heading = vessel.trackHistory?.[vessel.trackHistory.length - 1]?.headingDeg || 135;

              // Color based on attribution score and rank
              const badgeBg = isTopRanked
                ? 'bg-red-600 text-white border-red-300 shadow-red-500/50'
                : vessel.overallScore >= 70
                ? 'bg-amber-600 text-white border-amber-300 shadow-amber-500/40'
                : 'bg-sky-700 text-white border-sky-300 shadow-sky-500/30';

              const vesselPos = vessel.coordinates || {
                lat: incident.coordinates.lat + (vessel.rank === 1 ? 0.05 : 0.08),
                lng: incident.coordinates.lng - (vessel.rank === 1 ? 0.05 : 0.02),
              };

              return (
                <React.Fragment key={vessel.mmsi}>
                  {/* Vessel Marker */}
                  <AdvancedMarker
                    position={{ lat: vesselPos.lat, lng: vesselPos.lng }}
                    title={`#${vessel.rank} ${vessel.name} (Score: ${vessel.overallScore}%)`}
                    onClick={() => {
                      onSelectVessel?.(vessel);
                      setActiveInfoWindow({ type: 'vessel', vessel });
                    }}
                  >
                    <div
                      className={`relative group cursor-pointer transition-transform duration-200 hover:scale-110 ${
                        isSelected ? 'scale-115 ring-2 ring-blue-400 rounded-full' : ''
                      }`}
                      onMouseEnter={() => setHoveredVessel(vessel)}
                      onMouseLeave={() => setHoveredVessel(null)}
                    >
                      {/* Top Ranked Pulsing Ping */}
                      {isTopRanked && (
                        <div className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                      )}

                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-xl backdrop-blur-md font-poppins ${badgeBg}`}
                      >
                        {/* Heading Arrow */}
                        <div
                          style={{ transform: `rotate(${heading}deg)` }}
                          className="flex items-center justify-center transition-transform"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-current" />
                        </div>

                        <span className="text-[10px] font-bold tracking-tight">
                          #{vessel.rank} {vessel.name}
                        </span>

                        <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono font-bold">
                          {vessel.overallScore}%
                        </span>
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Vessel Historical Trajectory Line */}
                  {layers.trajectories &&
                    vessel.trackHistory &&
                    vessel.trackHistory.length > 1 && (
                      <Polyline
                        path={vessel.trackHistory.map((th) => ({ lat: th.lat, lng: th.lng }))}
                        strokeColor={isTopRanked ? '#ef4444' : '#f59e0b'}
                        strokeOpacity={isSelected ? 0.95 : 0.65}
                        strokeWeight={isSelected ? 3 : 1.8}
                        zIndex={isSelected ? 25 : 12}
                      />
                    )}
                </React.Fragment>
              );
            })}

          {/* Active Vessel InfoWindow */}
          {activeInfoWindow && typeof activeInfoWindow === 'object' && activeInfoWindow.type === 'vessel' && (
            <InfoWindow
              position={{
                lat: activeInfoWindow.vessel.coordinates?.lat || incident.coordinates.lat,
                lng: activeInfoWindow.vessel.coordinates?.lng || incident.coordinates.lng,
              }}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="p-2.5 max-w-sm font-poppins text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-sky-600" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-none">
                        {activeInfoWindow.vessel.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        MMSI: {activeInfoWindow.vessel.mmsi} | Flag: {activeInfoWindow.vessel.flag}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeInfoWindow.vessel.rank === 1
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    RANK #{activeInfoWindow.vessel.rank} ({activeInfoWindow.vessel.overallScore}%)
                  </span>
                </div>

                {/* Score Breakdown Bars */}
                <div className="space-y-1.5 mb-3 bg-slate-50 p-2 rounded border border-slate-100 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Spatial Proximity:</span>
                    <span className="font-bold text-slate-900">
                      {activeInfoWindow.vessel.evidence?.scoreBreakdown?.spatialProximity || 95}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Temporal Alignment:</span>
                    <span className="font-bold text-slate-900">
                      {activeInfoWindow.vessel.evidence?.scoreBreakdown?.temporalAlignment || 92}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Trajectory Match:</span>
                    <span className="font-bold text-sky-700">
                      {activeInfoWindow.vessel.evidence?.trajectoryMatchPercent || 94}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Distance at Origin:</span>
                    <span className="font-bold text-red-600">
                      {activeInfoWindow.vessel.evidence?.distanceAtOriginNM || 0.8} NM
                    </span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 mb-2">
                  <div>
                    <span className="block text-slate-400">SPEED OVER GROUND</span>
                    <span className="font-semibold text-slate-800">
                      {activeInfoWindow.vessel.evidence?.speedAtOriginKnots || 13.5} kts
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">COURSE OVER GROUND</span>
                    <span className="font-semibold text-slate-800">
                      {activeInfoWindow.vessel.evidence?.courseAtOriginDeg || 135}°
                    </span>
                  </div>
                </div>

                {/* Behavior Anomalies */}
                {activeInfoWindow.vessel.evidence?.behaviorAnomalies &&
                  activeInfoWindow.vessel.evidence.behaviorAnomalies.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200/70 p-2 rounded text-[10px] text-amber-900">
                      <div className="font-bold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Behavioral Anomalies:</span>
                      </div>
                      <ul className="list-disc pl-3.5 space-y-0.5">
                        {activeInfoWindow.vessel.evidence.behaviorAnomalies.map((anom, i) => (
                          <li key={i}>{anom}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* ========================================================================= */}
      {/* FLOATING TOP CONTROLS & TELEMETRY BAR */}
      {/* ========================================================================= */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2 z-20">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Map Type Switcher */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 p-0.5 text-xs font-semibold font-poppins text-slate-300">
            <button
              type="button"
              onClick={() => setMapTypeId('hybrid')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                mapTypeId === 'hybrid'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${mapTypeId === 'hybrid' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Satellite + AIS</span>
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mapTypeId === 'roadmap'
                  ? 'bg-slate-800 text-white font-bold border border-slate-600 shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              <span>Nautical Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('terrain')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mapTypeId === 'terrain'
                  ? 'bg-slate-800 text-white font-bold border border-slate-600 shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              <span>Bathymetry</span>
            </button>
          </div>

          {/* Incident identifier badge & Live Spills Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLiveSpillsList(!showLiveSpillsList)}
              className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg text-slate-200 hover:border-sky-500 hover:text-white transition-colors"
              title="Toggle Live Oil Spills List"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold font-poppins">
                {incident.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                {incidents.length} Live Spills
              </span>
            </button>
          </div>
        </div>

        {/* Live cursor coordinate readout */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg text-xs font-mono text-slate-300">
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          <span>{cursorCoords}</span>
        </div>
      </div>

      {/* Floating Live Spills Interactive Drawer */}
      {showLiveSpillsList && (
        <div className="absolute top-14 left-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-2xl max-w-xs z-30 font-poppins text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Live Oil Spills Monitored ({incidents.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLiveSpillsList(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {incidents.map((spill) => {
              const isCurrent = spill.id === incident.id;
              return (
                <button
                  key={spill.id}
                  type="button"
                  onClick={() => {
                    setActiveIncident(spill);
                    setResetTrigger((prev) => prev + 1);
                  }}
                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-sky-950/60 border-sky-500/80 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isCurrent ? 'text-sky-300' : 'text-slate-200'}>
                      {spill.name}
                    </span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono ${
                        spill.severity === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : spill.severity === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {spill.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{spill.characteristics.areaSqKm.toFixed(2)} km²</span>
                    <span>{spill.characteristics.estimatedVolumeM3} m³</span>
                    <span className="text-[10px] text-slate-500">
                      {spill.coordinates.lat.toFixed(2)}°, {spill.coordinates.lng.toFixed(2)}°
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAP CONTROL BUTTONS (Right Side) */}
      {/* ========================================================================= */}
      {showControls && (
        <div className="absolute top-14 right-3 flex flex-col gap-2 font-poppins z-20">
          <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-lg divide-y divide-slate-800 overflow-hidden text-slate-200">
            <button
              type="button"
              id="google-map-fit-bounds-btn"
              onClick={handleResetBounds}
              title="Fit Map to Incident Case Bounds"
              className="p-2.5 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Layer Toggle Button */}
          <div className="relative">
            <button
              type="button"
              id="google-map-layers-toggle-btn"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Toggle Layers"
              className={`p-2.5 rounded-lg shadow-lg border transition-colors flex items-center justify-center ${
                showLayerMenu
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white backdrop-blur-md'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Layer Toggle Dropdown */}
            {showLayerMenu && (
              <div className="absolute right-full top-0 mr-2 w-56 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl p-3 z-30 text-xs font-poppins text-slate-200 backdrop-blur-xl">
                <div className="font-semibold text-slate-100 mb-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                  <span>Google Map Layers</span>
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layers.spill}
                      onChange={() => toggleLayer('spill')}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-amber-300" />
                      <span>Oil Spill Area</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layers.sourceZone}
                      onChange={() => toggleLayer('sourceZone')}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 border border-sky-300" />
                      <span>Source Zone Envelope</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layers.vessels}
                      onChange={() => toggleLayer('vessels')}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-red-500" />
                      <span>AIS Candidate Vessels</span>
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded ${
                      hasTrajectoryData
                        ? 'hover:bg-slate-800 cursor-pointer text-slate-200'
                        : 'opacity-40 cursor-not-allowed text-slate-500'
                    }`}
                    title={hasTrajectoryData ? 'Vessel breadcrumb track history' : 'Trajectory data unavailable for this incident'}
                  >
                    <input
                      type="checkbox"
                      disabled={!hasTrajectoryData}
                      checked={layers.trajectories && hasTrajectoryData}
                      onChange={() => toggleLayer('trajectories')}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t-2 border-red-400" />
                      <span>Vessel Trajectories</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layers.drift}
                      onChange={() => toggleLayer('drift')}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-400" />
                      <span>Drift Trajectory Line</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAP LEGEND (Bottom-Left) */}
      {/* ========================================================================= */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl text-xs text-slate-300 max-w-xs font-poppins z-10">
        <div className="flex items-center justify-between font-semibold text-slate-100 mb-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Google Maps Chart Symbology</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-[#0a101b] border border-amber-400" />
            <span className="font-medium text-slate-200">SAR Oil Slick</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-sky-600/40 border border-sky-400" />
            <span className="text-slate-300">Source Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
            <span className="font-semibold text-red-400">#1 Suspect Tanker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            <span className="text-slate-300">Candidate Vessel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-sky-400" />
            <span className="text-slate-300">Backtrack Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-blue-500" />
            <span className="text-slate-300">24h Forecast</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HOVERED / SELECTED VESSEL DETAILS CARD (Bottom-Right) */}
      {/* ========================================================================= */}
      {(() => {
        const v = hoveredVessel || (selectedVessel && incident.vessels?.some((item) => item.mmsi === selectedVessel.mmsi) ? selectedVessel : null);
        if (!v) return null;
        return (
          <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-2xl max-w-sm z-20 text-xs font-poppins text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-slate-100 text-sm">{v.name}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  v.rank === 1
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                ATTRIBUTION SCORE {v.overallScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 mb-2">
              <div>
                <span className="text-slate-500 text-[10px] block">MMSI / IMO</span>
                <span className="font-mono">{v.mmsi} / {v.imo}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">FLAG / TYPE</span>
                <span>{v.flag} ({v.type})</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">DISTANCE TO SOURCE</span>
                <span className="font-bold text-red-400">{v.evidence?.distanceAtOriginNM ?? 0.8} NM</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">TRAJECTORY MATCH</span>
                <span className="font-bold text-sky-400">{v.evidence?.trajectoryMatchPercent ?? 94}%</span>
              </div>
            </div>

            {v.evidence?.behaviorAnomalies && v.evidence.behaviorAnomalies.length > 0 && (
              <div className="text-[10.5px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                <div className="font-bold text-amber-400 mb-0.5">⚠️ AIS Anomaly:</div>
                <p>{v.evidence.behaviorAnomalies[0]}</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export const GoogleOceanMap: React.FC<GoogleOceanMapProps> = (props) => {
  return (
    <ErrorBoundary
      componentName="Google Maps Geospatial Engine"
      onReset={props.onSwitchToSvgFallback}
    >
      <GoogleOceanMapInternal {...props} />
    </ErrorBoundary>
  );
};

