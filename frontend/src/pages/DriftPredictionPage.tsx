import React, { useState, useEffect } from 'react';
import { 
  Compass, Wind, Waves, Play, Pause, RotateCcw, 
  Clock, ShieldAlert, ArrowRight, Info, AlertTriangle, Layers
} from 'lucide-react';
import { SpillIncident, PageId, VesselAttribution } from '../types';
import { OceanMap } from '../components/OceanMap';

interface DriftPredictionPageProps {
  incident: SpillIncident;
  onNavigate: (page: PageId) => void;
  onSelectVessel: (vessel: VesselAttribution | null) => void;
}

export const DriftPredictionPage: React.FC<DriftPredictionPageProps> = ({
  incident,
  onNavigate,
  onSelectVessel,
}) => {
  const [timelineOffset, setTimelineOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const drift = incident.drift;

  // Timeline steps definition from T-14h to T+24h
  const timelineMarks = [
    { offset: -14, label: 'T-14h (Origin)' },
    { offset: -8, label: 'T-8h' },
    { offset: 0, label: 'Now (Acquisition)' },
    { offset: 6, label: 'T+6h' },
    { offset: 12, label: 'T+12h' },
    { offset: 24, label: 'T+24h (Critical)' },
  ];

  // Auto-play timeline loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineOffset(prev => {
          if (prev >= 24) return -14;
          return prev + 2;
        });
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Current active step info
  const currentStep = drift.timeline.find(t => t.timeOffsetHours === timelineOffset) || {
    label: timelineOffset > 0 ? `T+${timelineOffset}h (Forecast)` : timelineOffset < 0 ? `T${timelineOffset}h (Backtrack)` : 'Now (Observed)',
    description: timelineOffset > 0 
      ? `Projected advection: slick center moving ESE at ${drift.driftSpeedKnots} knots under wind & current coupling.` 
      : timelineOffset < 0
      ? `Reverse Lagrangian backcast approaching suspected vessel release corridor.`
      : `Baseline SAR detection footprint (${incident.characteristics.areaSqKm} km²).`
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hydrodynamic Drift Prediction & Origin Backtracking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              LAGRANGIAN MODEL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Observed Spill → Reverse Backtracked Origin (T-14h) → Forward 24h Coastal Advection & Weathering Projection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('ais')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Proceed to AIS Correlation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prediction KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Origin Confidence</span>
          <div className="text-2xl font-extrabold text-blue-600 font-mono mt-1">
            {drift.originConfidencePercent}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Uncertainty: ±0.8 NM</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Drift Forecast Confidence</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {drift.driftConfidencePercent}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono">24h Dispersion Index</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Predicted 24h Travel</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {drift.predicted24hDistanceNM} NM
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Heading: {drift.driftDirectionDeg}° ESE</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ocean Current Vector</span>
          <div className="text-2xl font-extrabold text-sky-600 font-mono mt-1">
            {drift.oceanCurrentKnots} kts
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Bearing: {drift.oceanCurrentDirDeg}° SE</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Coastal Impact ETA</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
            {drift.coastalImpactETA}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{drift.shorelineDistanceKm} km offshore</span>
        </div>
      </div>

      {/* Primary Ocean Drift Interactive Map Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Drift Vector Simulation & Trajectory Reconstruction</h2>
              <p className="text-xs text-slate-500">Backtrack origin (dashed) and 95% forward dispersion envelope</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Wind: {drift.windSpeedKnots} kts @ {drift.windDirDeg}° (Leeway {drift.windDriftFactorPercent}%)
            </span>
          </div>
        </div>

        {/* Large Ocean Map with Drift Overlays & Timeline Scrubber */}
        <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-300">
          <OceanMap
            incident={incident}
            timelineOffsetHours={timelineOffset}
            onSelectVessel={onSelectVessel}
            showControls={true}
            className="w-full h-full"
          />
        </div>

        {/* Interactive Timeline Scrubber Bar */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                id="timeline-play-pause-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                id="timeline-reset-btn"
                onClick={() => {
                  setIsPlaying(false);
                  setTimelineOffset(0);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset to Present"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-slate-300">TIMELINE:</span>
                <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-sky-300 font-mono font-bold text-xs">
                  {timelineOffset > 0 ? `+${timelineOffset}h FORECAST` : timelineOffset < 0 ? `${timelineOffset}h REVERSE ORIGIN` : '0h (SAR NOW)'}
                </span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {currentStep.label}
            </div>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <input 
              type="range"
              min="-14"
              max="24"
              step="2"
              value={timelineOffset}
              onChange={(e) => {
                setIsPlaying(false);
                setTimelineOffset(Number(e.target.value));
              }}
              className="w-full accent-sky-400 cursor-pointer"
            />

            {/* Timeline Tick Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              {timelineMarks.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setTimelineOffset(m.offset);
                  }}
                  className={`hover:text-sky-300 transition-colors ${
                    timelineOffset === m.offset ? 'text-sky-400 font-bold underline' : ''
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step description */}
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-normal">{currentStep.description}</p>
          </div>
        </div>
      </div>

      {/* Environmental Forcing Parameters & Shoreline Impact Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Environmental Forcing Vectors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Waves className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Hydrodynamic & Meteorological Forcing
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Ocean Surface Current</span>
              <div className="font-mono text-lg font-bold text-slate-900">
                {drift.oceanCurrentKnots} kts @ {drift.oceanCurrentDirDeg}°
              </div>
              <p className="text-[11px] text-slate-500">
                HYCOM 1/12° oceanic model velocity data assimilated for the Northern Gulf.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Wind Vector (10m AGL)</span>
              <div className="font-mono text-lg font-bold text-slate-900">
                {drift.windSpeedKnots} kts @ {drift.windDirDeg}°
              </div>
              <p className="text-[11px] text-slate-500">
                ECMWF surface wind forcing with {drift.windDriftFactorPercent}% direct leeway factor.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-blue-900 block">Origin Backtrack Reconstruction (T-14h)</span>
            <p className="text-[11px] text-blue-950 leading-relaxed">
              Backtracking indicates primary discharge occurred at coordinates <strong>{drift.predictedOrigin.lat.toFixed(4)}°N, {Math.abs(drift.predictedOrigin.lng).toFixed(4)}°W</strong> on 2026-09-06 at 04:00 UTC. The spatial confidence ellipse spans 1.6 NM along the major axis.
            </p>
          </div>
        </div>

        {/* Shoreline Sensitivity & Response Strategy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Coastal Impact Assessment & Fairway Risk
            </h3>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs">Vulnerable Shoreline Arrival</span>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">
                ETA T+38h
              </span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              {drift.estimatedArrivalArea}. Current distance to shoreline is <strong>{drift.shorelineDistanceKm} km</strong>. High-sensitivity coastal wetlands and oyster beds are situated along the projected dispersion cone.
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Containment Window:</span>
              <span className="font-semibold text-slate-800">14 Hours remaining</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Weathering / Evaporative Loss:</span>
              <span className="font-semibold text-slate-800">18.4% (Light volatile cuts)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Dispersant Authorization:</span>
              <span className="font-semibold text-emerald-600">Offshore Deepwater Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
