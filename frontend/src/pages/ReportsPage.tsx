import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Share2, CheckCircle2, 
  Satellite, Ship, Compass, ShieldAlert, AlertTriangle, Clock, ExternalLink
} from 'lucide-react';
import { SpillIncident, PageId } from '../types';

interface ReportsPageProps {
  incident: SpillIncident;
  onNavigate: (page: PageId) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  incident,
  onNavigate,
}) => {
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  const handleGenerate = () => {
    setReportGenerated(true);
    setTimeout(() => {
      setReportGenerated(false);
    }, 4000);
  };

  const handleExport = (format: string) => {
    setExportedStatus(`Exported ${format} successfully!`);
    setTimeout(() => setExportedStatus(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const topVessel = incident.vessels[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operational Incident Dossier & Attribution Report
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              OFFICIAL DOSSIER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized maritime surveillance investigation package for coast guard, environmental agencies & port state control
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>

          <button
            id="report-export-json-btn"
            onClick={() => handleExport('GeoJSON / Incident Manifest')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Analysis</span>
          </button>

          <button
            id="report-generate-btn"
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {exportedStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportedStatus}</span>
        </div>
      )}

      {reportGenerated && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Full Maritime Casualty & Spill Attribution Dossier PDF compiled and ready for dispatch.</span>
          </div>
          <span className="font-mono font-bold text-blue-700 text-[11px]">DOSSIER-MS-2026-0884.PDF</span>
        </div>
      )}

      {/* Official Printable Report Document Body */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-md p-6 sm:p-10 space-y-8 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        
        {/* Document Formal Header */}
        <div className="border-b-2 border-slate-900 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                MARITIME CASUALTY INVESTIGATION & POLLUTION INTELLIGENCE
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1">
                INCIDENT INVESTIGATION DOSSIER: {incident.code}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {incident.name} • {incident.seaArea}
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-600">
              <div><strong className="text-slate-900">DATE OF REPORT:</strong> {new Date().toISOString().slice(0, 10)}</div>
              <div><strong className="text-slate-900">SECURITY CLASSIF:</strong> RESTRICTED / OPERATIONAL</div>
              <div><strong className="text-slate-900">INTELLIGENCE ID:</strong> {incident.id.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Event Summary */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 font-mono">
            1.0 Incident Executive Summary
          </h3>
          <p className="text-xs leading-relaxed text-slate-800">
            On <strong>{incident.satellite.acquisitionTime.slice(0, 16).replace('T', ' ')} UTC</strong>, an anomalous marine surface contamination event was detected in the <strong>{incident.region}</strong> via synthetic aperture radar (SAR) satellite surveillance. Processing confirmed a continuous surface slick spanning <strong>{incident.characteristics.areaSqKm} km²</strong> with an estimated hydrocarbon volume of <strong>{incident.characteristics.estimatedVolumeM3} m³</strong> ({incident.characteristics.slickType}). Reverse hydrodynamic backtrack simulation correlates the primary discharge event to <strong>04:00 UTC (T-14h)</strong> at coordinates <strong>{incident.drift.predictedOrigin.lat.toFixed(4)}°N, {Math.abs(incident.drift.predictedOrigin.lng).toFixed(4)}°W</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">STATUS</span>
              <span className="font-bold text-slate-900">{incident.status}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">SEVERITY</span>
              <span className="font-bold text-red-600">{incident.severity} PRIORITY</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">SLICK DIMENSIONS</span>
              <span className="font-bold text-slate-900">{incident.characteristics.lengthKm} × {incident.characteristics.widthKm} km</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">TOP SUSPECT ATTRIBUTION</span>
              <span className="font-bold text-blue-600">{topVessel.name} ({topVessel.overallScore}%)</span>
            </div>
          </div>
        </section>

        {/* Section 2: Satellite Observation Evidence */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 font-mono">
            2.0 Earth Observation & SAR Sensor Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-xs font-mono">
            <div><span className="text-slate-400">Satellite Platform:</span> <strong>{incident.satellite.satellite}</strong></div>
            <div><span className="text-slate-400">Instrument:</span> <strong>{incident.satellite.instrument}</strong></div>
            <div><span className="text-slate-400">Polarization:</span> <strong>{incident.satellite.polarization}</strong></div>
            <div><span className="text-slate-400">Incidence Angle:</span> <strong>{incident.satellite.incidenceAngle}</strong></div>
            <div><span className="text-slate-400">Pixel Resolution:</span> <strong>{incident.satellite.resolution}</strong></div>
            <div><span className="text-slate-400">Orbit / Pass:</span> <strong>Orbit #{incident.satellite.orbitNumber} ({incident.satellite.passDirection})</strong></div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong>SAR Interpretation:</strong> Pronounced low-backscatter dark spot with contrast ratio of {incident.characteristics.darkSpotContrastRatio} dB. Bragg resonant wave damping factor of {incident.characteristics.dampingFactor}x confirms viscid mineral oil film distinguishing from natural biogenic surface slicks.
          </div>
        </section>

        {/* Section 3: Hydrodynamic Drift & Origin Backtrack Reconstruction */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 font-mono">
            3.0 Hydrodynamic Drift Modeling & Origin Backtrack
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Lagrangian trajectory advection was modeled utilizing coupled HYCOM ocean velocity fields (current: {incident.drift.oceanCurrentKnots} kts @ {incident.drift.oceanCurrentDirDeg}°) and ECMWF surface atmospheric wind fields (wind: {incident.drift.windSpeedKnots} kts @ {incident.drift.windDirDeg}° with {incident.drift.windDriftFactorPercent}% leeway coefficient).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">BACKTRACK ORIGIN COORD</span>
              <span className="font-bold text-slate-900">
                {incident.drift.predictedOrigin.lat.toFixed(4)}°N, {Math.abs(incident.drift.predictedOrigin.lng).toFixed(4)}°W
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">ORIGIN TIME WINDOW</span>
              <span className="font-bold text-slate-900">T-14 Hours (04:00 UTC)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">ORIGIN CONFIDENCE</span>
              <span className="font-bold text-emerald-600">{incident.drift.originConfidencePercent}% (±0.8 NM)</span>
            </div>
          </div>
        </section>

        {/* Section 4: AIS Correlation & Suspect Vessel Attribution Matrix */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 font-mono">
            4.0 AIS Spatiotemporal Correlation & Vessel Attribution Matrix
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px]">
                <tr>
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Vessel Name</th>
                  <th className="py-2 px-3">MMSI / IMO</th>
                  <th className="py-2 px-3">Flag</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Origin Dist</th>
                  <th className="py-2 px-3">Time Delta</th>
                  <th className="py-2 px-3">Behavior Anomaly</th>
                  <th className="py-2 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incident.vessels.map(v => (
                  <tr key={v.mmsi} className={v.rank === 1 ? 'bg-red-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3 text-slate-700">#{v.rank}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-900">{v.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{v.mmsi}</td>
                    <td className="py-2.5 px-3 font-sans">{v.flag}</td>
                    <td className="py-2.5 px-3 font-sans">{v.type}</td>
                    <td className="py-2.5 px-3">{v.evidence.distanceAtOriginNM} NM</td>
                    <td className="py-2.5 px-3">{v.evidence.timeDifferenceMinutes > 0 ? `+${v.evidence.timeDifferenceMinutes}m` : `${v.evidence.timeDifferenceMinutes}m`}</td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-700 truncate max-w-[180px]">
                      {v.evidence.behaviorAnomalies[0] || 'Nominal transit'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={v.rank === 1 ? 'text-red-600' : 'text-slate-800'}>
                        {v.overallScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Specific Evidence on Top Suspect */}
        <section className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
              5.0 Forensic Findings on Primary Candidate: {topVessel.name} (MMSI: {topVessel.mmsi})
            </h4>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-xs font-bold">
              ATTRIBUTION INDEX: 92%
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            <p>
              • <strong>Spatial Intersection:</strong> Vessel track passed within <strong>0.8 nautical miles</strong> of the backcasted discharge epicenter during the estimated discharge hour.
            </p>
            <p>
              • <strong>Kinematic Deceleration:</strong> Cruising speed dropped abruptly from 13.8 knots to 4.2 knots (70% speed loss) while maintaining heading into the prevailing sea state, characteristic of slop tank or bilge discharge operations.
            </p>
            <p>
              • <strong>AIS Broadcast Anomaly:</strong> Recorded an unannounced AIS silence interval of <strong>142 minutes</strong> between 04:15 UTC and 06:37 UTC, resuming transmission 18 NM downstream.
            </p>
            <p>
              • <strong>Cargo Compatibility:</strong> Vessel is a 274m crude tanker with active slop tanks transiting toward Houston Offshore Terminal.
            </p>
          </div>
        </section>

        {/* Formal Signature and Disclaimer Footer */}
        <div className="pt-6 border-t-2 border-slate-900 space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <strong>DISCLAIMER NOTICE:</strong> This intelligence dossier constitutes an analytical correlation assessment for maritime law enforcement and emergency containment routing. It is not an affirmative legal ruling. Port inspection and lab fuel fingerprinting must corroborate all digital forensic findings.
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2">
            <div>PREPARED BY: AUTOMATED MARITIME SURVEILLANCE SUITE</div>
            <div>VERIFICATION HASH: SHA256-8F2B9C01EA9844</div>
          </div>
        </div>
      </div>
    </div>
  );
};
