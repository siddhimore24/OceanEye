import React from 'react';
import { 
  Satellite, Compass, Waves, Ship, ArrowRight, 
  ShieldAlert, ShieldCheck, Radio, Activity, CheckCircle, Clock, Database, ChevronRight,
  Lock, KeyRound, Edit3, PlusCircle, AlertTriangle, EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { SpillIncident, PageId, VesselAttribution } from '../types';
import { OceanMap } from '../components/OceanMap';
import { useApp } from '../context/AppContext';

interface OverviewPageProps {
  incident: SpillIncident;
  incidents: SpillIncident[];
  onNavigate: (page: PageId) => void;
  onOpenNewSpillModal: () => void;
  onSelectVessel: (vessel: VesselAttribution | null) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  incident,
  incidents,
  onNavigate,
  onOpenNewSpillModal,
  onSelectVessel,
}) => {
  const { currentUser, isAdmin, classifiedIntel, loginAsRole } = useApp();

  const relevantIntel = classifiedIntel.filter(
    item => item.incidentId === incident.id || item.incidentId === 'inc-0884'
  );

  const kpis = [
    { label: 'Active Spill Events', value: `${incidents.length}`, unit: 'Sectors', sub: 'Indexed in database' },
    { label: 'Monitored Incident', value: incident.severity, unit: 'Severity', sub: `${incident.characteristics.areaSqKm} km² ${incident.characteristics.slickType}`, alert: incident.severity === 'HIGH' },
    { label: 'AIS Vessels Correlated', value: `${incident.vessels.length * 35}`, unit: 'Tracks', sub: 'Within 25 NM radius window' },
    { label: 'SAR Detection Confidence', value: `${incident.characteristics.confidenceScore}%`, unit: 'Radar', sub: `${incident.satellite.satellite}` },
    { label: 'Top Suspect Score', value: `${incident.vessels[0]?.overallScore || 92}%`, unit: 'Confidence', sub: `${incident.vessels[0]?.name || 'Attributed vessel'}` },
  ];

  const backtrackHours = incident.drift.timeline[0]?.timeOffsetHours 
    ? Math.abs(incident.drift.timeline[0].timeOffsetHours) 
    : 12;

  const capabilities = [
    {
      icon: Satellite,
      title: 'Satellite Detection',
      desc: 'Detect and characterize oil slicks from SAR and EO satellite imagery.',
      page: 'detection' as PageId,
      stat: `${incident.satellite.resolution || '10m SAR'} (${incident.satellite.sensor?.split(' ')[0] || 'SAR'})`
    },
    {
      icon: Compass,
      title: 'Drift Analysis',
      desc: 'Trace the slick backward toward its probable origin and predict future movement.',
      page: 'drift' as PageId,
      stat: `T-${backtrackHours}h Backtrack`
    },
    {
      icon: Waves,
      title: 'AIS Intelligence',
      desc: 'Analyze vessel traffic around the suspected origin window.',
      page: 'ais' as PageId,
      stat: `${incident.vessels.length} Correlated Tracks`
    },
    {
      icon: Ship,
      title: 'Vessel Attribution',
      desc: 'Rank potential responsible vessels using spatial and temporal correlation.',
      page: 'attribution' as PageId,
      stat: `#1 Rank: ${incident.vessels[0]?.name || 'Attributed Target'}`
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xl">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-nautical-grid opacity-20 pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/50 text-sky-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Operational Maritime Surveillance & Attribution Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Marine Oil Spill Intelligence
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Satellite-powered detection, drift analysis and vessel attribution for faster maritime environmental response.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-analyze-new-spill-btn"
                onClick={onOpenNewSpillModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                <span>Analyze New Spill</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-intelligence-btn"
                onClick={() => onNavigate('detection')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold transition-all hover:border-slate-600 hover:-translate-y-0.5"
              >
                <span>Explore Intelligence</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Incident snapshot banner */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">ACTIVE TARGET:</span>
                <span className="font-semibold text-slate-200">{incident.code}</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">REGION:</span>
                <span className="text-slate-300">{incident.region}</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">COORDINATES:</span>
                <span className="text-sky-400">
                  {Math.abs(incident.coordinates.lat).toFixed(2)}°{incident.coordinates.lat >= 0 ? 'N' : 'S'}, {Math.abs(incident.coordinates.lng).toFixed(2)}°{incident.coordinates.lng >= 0 ? 'E' : 'W'}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Visual Preview */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xl bg-white relative font-poppins">
              <div className="h-64 sm:h-72 w-full">
                <OceanMap
                  incident={incident}
                  onSelectVessel={onSelectVessel}
                  showControls={false}
                  className="w-full h-full rounded-xl"
                />
              </div>
              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs font-poppins">
                <span className="font-poppins text-slate-700 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  SLICK: {incident.characteristics.areaSqKm} km² ({incident.characteristics.slickType})
                </span>
                <button 
                  onClick={() => onNavigate('drift')}
                  className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 font-poppins"
                >
                  <span>Interactive Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OPERATIONAL KPI CARDS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Operational Surveillance Metrics</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Real-time Multi-Mission Telemetry</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                kpi.alert 
                  ? 'bg-red-950/20 border-red-500/30 text-slate-100 hover:border-red-500/50' 
                  : 'bg-white border-slate-200 text-slate-900 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className={`text-2xl font-extrabold tracking-tight font-mono ${
                  kpi.alert ? 'text-red-600' : 'text-slate-900'
                }`}>
                  {kpi.value}
                </span>
                <span className="text-xs text-slate-500 font-medium">{kpi.unit}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PRIMARY OPERATIONAL MAP (FULL SIZE INTERACTIVE) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Active Spill Geographic Surveillance</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
                LIVE GEOSPATIAL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-layer visualization: Sentinel-1C SAR slick boundary, hydrodynamic backcast origin, and correlated AIS traffic
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Pass: Sentinel-1C IW Ascending
            </span>
            <button 
              onClick={() => onNavigate('drift')}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Full Screen Drift Model →
            </button>
          </div>
        </div>

        {/* The Ocean Map */}
        <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-300/80">
          <OceanMap
            incident={incident}
            onSelectVessel={onSelectVessel}
            showControls={true}
            className="w-full h-full"
          />
        </div>

        {/* Map Telemetry Footer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-600">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Slick Surface Area</span>
              <span>18.42 km² ({incident.characteristics.slickType}) with 8.4 km axial dispersion length</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <Compass className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Probable Origin Window</span>
              <span>Coordinates 28.4850°N, 089.6210°W backtracked to T-14 hours (94% confidence)</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <Ship className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Primary Vessel of Interest</span>
              <span>MV Ocean Star (Crude Tanker) correlated within 0.8 NM of origin with 92% match</span>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN OPERATIONAL STATUS BAR */}
      {isAdmin ? (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Administrator Access Granted (Level 5)</strong>: You can modify incident data, recalibrate vessel scores, and inspect classified defense intercepts.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open Admin Data Console</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()} • Level {currentUser.clearanceLevel}). Classified naval intelligence and data modification are partitioned.
            </span>
          </div>
          <button
            onClick={() => onNavigate('auth')}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold self-start sm:self-auto"
          >
            <span>Switch to Admin Account</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 4. KEY SYSTEM CAPABILITIES */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">System Capabilities & Intelligence Modules</h2>
          <p className="text-xs text-slate-500">Integrated end-to-end maritime disaster surveillance and forensic attribution architecture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(cap.page)}
                className="group p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {cap.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 font-semibold text-[11px]">{cap.stat}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CLASSIFIED DEFENSE & LAW ENFORCEMENT INTELLIGENCE FEED */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
              {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono tracking-wide">
                  CLASSIFIED DEFENSE & LAW ENFORCEMENT FEEDS
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isAdmin ? 'bg-amber-950 border border-amber-600 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAdmin ? 'LEVEL 5 TOP SECRET // UNRESTRICTED' : 'PARTITIONED - ADMIN CLEARANCE REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Signals Intelligence (SIGINT), covert naval radar, and Interpol shadow fleet interception records
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <span>Manage Feeds in Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Authenticate as Admin</span>
            </button>
          )}
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {relevantIntel.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs font-mono space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                    {item.classificationBadge}
                  </span>
                  <span className="text-slate-500 text-[10px]">{item.source}</span>
                </div>
                <h4 className="text-slate-200 font-bold text-xs">{item.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Target: {item.flaggedVesselMmsi || 'Unknown'}</span>
                  <span className="text-amber-300 font-semibold">{item.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-mono">Restricted Intelligence Partition</h4>
              <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
                3 active classified defense records (including Naval SIGINT intercepts, Interpol Dark Fleet Purple Notices, and Admiralty Court impoundment affidavits) are hidden under Public / Analyst clearance.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => loginAsRole('admin')}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Instant Admin Switch (Demo)</span>
              </button>
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Go to Authentication Terminal
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. RECENT SURVEILLANCE LOGS & CORROBORATION FEED */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 shadow-md">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Maritime Sensor Acquisition Log
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Last updated 4 mins ago</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {[
            { time: '18:31:45 UTC', event: 'Copernicus Sentinel-1C SAR scene ingested (Orbit 38192, Dual VV+VH)', status: 'PROCESSED', ok: true },
            { time: '18:34:10 UTC', event: 'Dark-spot segmentation identified continuous crude slick polygon (18.42 km²)', status: 'CONFIRMED', ok: true },
            { time: '18:36:22 UTC', event: 'Lagrangian reverse particle drift model backtracked origin to 28.4850°N, 089.6210°W', status: 'SOLVED', ok: true },
            { time: '18:39:05 UTC', event: 'AIS database queried: 142 vessels within search envelope; 4 flagged for attribution', status: 'CORRELATED', ok: true },
            { time: '18:41:30 UTC', event: 'Vessel MV Ocean Star (MMSI 235089140) assigned 92% attribution index (speed drop + loiter)', status: 'ALERT', ok: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-800 hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 shrink-0">{item.time}</span>
                <span className="text-slate-300">{item.event}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.ok ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
