import React, { useState } from 'react';
import { 
  X, Upload, Satellite, CheckCircle2, ArrowRight, 
  Layers, Compass, Ship, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { SpillIncident } from '../types';

interface NewSpillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpillAnalyzed: (newIncident: SpillIncident) => void;
}

export const NewSpillModal: React.FC<NewSpillModalProps> = ({
  isOpen,
  onClose,
  onSpillAnalyzed,
}) => {
  const [step, setStep] = useState<'upload' | 'configure' | 'processing' | 'ready'>('upload');
  const [selectedPreset, setSelectedPreset] = useState<string>('preset-gom');
  const [selectedSensor, setSelectedSensor] = useState<'SAR_C' | 'SAR_X' | 'OPTICAL'>('SAR_C');
  const [searchRadiusNM, setSearchRadiusNM] = useState<number>(20);
  const [backtrackHours, setBacktrackHours] = useState<number>(14);
  const [lookalikeFilter, setLookalikeFilter] = useState<boolean>(true);
  const [processingStep, setProcessingStep] = useState<number>(0);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'preset-gom',
      name: 'Sentinel-1C SAR (Gulf of Mexico)',
      date: 'Acquired 2026-09-06 18:31 UTC',
      resolution: '10m C-SAR VV+VH',
      areaEstimate: '~18.4 km²',
      description: 'Continuous low-backscatter slick signature in active drilling sector.',
    },
    {
      id: 'preset-malacca',
      name: 'TerraSAR-X High-Res (Strait of Malacca)',
      date: 'Acquired 2026-09-05 09:05 UTC',
      resolution: '3m X-Band StripMap',
      areaEstimate: '~7.2 km²',
      description: 'Linear trailing discharge along westbound Traffic Separation Scheme.',
    },
    {
      id: 'preset-northsea',
      name: 'Radarsat RCM-1 (North Sea Basin)',
      date: 'Acquired 2026-09-04 14:08 UTC',
      resolution: '16m Medium Res',
      areaEstimate: '~4.2 km²',
      description: 'Condensate and produced water sheen near offshore export manifold.',
    },
  ];

  const handleStartAnalysis = () => {
    setStep('processing');
    setProcessingStep(1);

    const timer1 = setTimeout(() => setProcessingStep(2), 700);
    const timer2 = setTimeout(() => setProcessingStep(3), 1500);
    const timer3 = setTimeout(() => setProcessingStep(4), 2200);
    const timer4 = setTimeout(() => setProcessingStep(5), 2900);
    const timer5 = setTimeout(() => {
      setStep('ready');
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  };

  const handleFinalize = () => {
    // Generate a fresh analyzed incident based on the selected scene
    const newInc: SpillIncident = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      code: `MS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: selectedPreset === 'preset-malacca' 
        ? 'Strait of Malacca - One Fathom Bank' 
        : selectedPreset === 'preset-northsea'
        ? 'North Sea - Forties Field Approach'
        : 'Gulf of Mexico - Mississippi Canyon Block 72',
      region: selectedPreset === 'preset-malacca' ? 'Southeast Asia' : 'Gulf of Mexico',
      seaArea: 'International Shipping Channel / EEZ',
      coordinates: selectedPreset === 'preset-malacca' 
        ? { lat: 2.8940, lng: 101.0120 } 
        : { lat: 28.3412, lng: -89.4187 },
      timestamp: new Date().toISOString(),
      status: 'ACTIVE_MONITORING',
      severity: 'HIGH',
      satellite: {
        sensor: selectedSensor === 'SAR_C' ? 'SAR C-Band (Sentinel-1C)' : 'High-Res SAR X-Band',
        satellite: 'Sentinel-1C Copernicus',
        instrument: 'C-SAR Interferometric Wide',
        mode: 'Level-1 GRD',
        resolution: '10m x 10m',
        polarization: 'Dual VV + VH',
        incidenceAngle: '34.6°',
        acquisitionTime: new Date().toISOString(),
        passDirection: 'Ascending',
        orbitNumber: '38194',
        cloudCoverPercent: 78,
      },
      characteristics: {
        areaSqKm: 18.42,
        lengthKm: 8.4,
        widthKm: 2.3,
        perimeterKm: 26.8,
        estimatedVolumeM3: 412.0,
        estimatedAgeHours: backtrackHours,
        confidenceScore: 96.8,
        slickType: 'Crude Oil',
        bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Oil Discoloration',
        darkSpotContrastRatio: -7.8,
        dampingFactor: 4.6,
        centroid: { lat: 28.3412, lng: -89.4187 },
        polygonPoints: [
          [-35, -12], [-20, -18], [0, -22], [24, -16], [45, -8],
          [58, 4], [62, 14], [48, 20], [25, 24], [5, 20],
          [-15, 16], [-32, 8], [-38, -2]
        ],
      },
      drift: {
        predictedOrigin: { lat: 28.4850, lng: -89.6210 },
        originConfidencePercent: 94.2,
        driftConfidencePercent: 88.5,
        predicted24hDistanceNM: 26.8,
        driftDirectionDeg: 134,
        driftSpeedKnots: 1.15,
        oceanCurrentKnots: 1.35,
        oceanCurrentDirDeg: 142,
        windSpeedKnots: 16.5,
        windDirDeg: 305,
        windDriftFactorPercent: 3.2,
        estimatedArrivalArea: 'Breton National Wildlife Refuge Seaward Margin',
        coastalImpactETA: '38 hours (T+38h)',
        shorelineDistanceKm: 64.2,
        timeline: [
          {
            timeOffsetHours: -backtrackHours,
            label: `T-${backtrackHours}h (Suspected Origin)`,
            timestamp: 'Origin Window',
            spillCenter: { lat: 28.4850, lng: -89.6210 },
            slickRadiusKm: 0.8,
            description: 'Probable primary discharge event based on hydrodynamic backtrack simulation.'
          },
          {
            timeOffsetHours: 0,
            label: 'Now (Acquisition)',
            timestamp: 'Present Time',
            spillCenter: { lat: 28.3412, lng: -89.4187 },
            slickRadiusKm: 2.3,
            description: 'Detected continuous slick.'
          },
          {
            timeOffsetHours: 24,
            label: 'T+24h (Forecast)',
            timestamp: '+24h Projection',
            spillCenter: { lat: 28.0850, lng: -89.0490 },
            slickRadiusKm: 5.6,
            description: 'Projected slick arrival corridor.'
          }
        ]
      },
      vessels: [
        {
          rank: 1,
          name: 'MV Ocean Star',
          mmsi: '235089140',
          imo: '9481237',
          callsign: '2CEX8',
          flag: 'Liberia',
          flagCode: 'LR',
          type: 'Crude Oil Tanker',
          lengthM: 274,
          beamM: 48,
          draughtM: 16.2,
          destination: 'Houston Offshore Terminal',
          overallScore: 92,
          confidence: 'High',
          coordinates: { lat: 28.4720, lng: -89.6050 },
          trackHistory: [
            { timestamp: '02:00', lat: 28.5910, lng: -89.7820, speedKnots: 13.8, headingDeg: 128, navStatus: 'Underway' },
            { timestamp: '04:05', lat: 28.4830, lng: -89.6190, speedKnots: 4.2, headingDeg: 172, navStatus: 'Loitering' }
          ],
          evidence: {
            distanceAtOriginNM: 0.8,
            timeDifferenceMinutes: -12,
            trajectoryMatchPercent: 94.6,
            speedAtOriginKnots: 4.2,
            averageVoyageSpeedKnots: 13.9,
            courseAtOriginDeg: 172,
            behaviorAnomalies: [
              'Sharp speed drop near suspected origin coordinates',
              'AIS broadcast gap: 142 minutes during transit'
            ],
            aisContinuity: 'Gap Detected (3.5h)',
            speedDropDetected: true,
            loiteringDetected: true,
            scoreBreakdown: {
              spatialProximity: 96,
              temporalAlignment: 94,
              trajectoryCorrelation: 92,
              behavioralPenalty: 86
            }
          }
        }
      ],
      weather: {
        seaSurfaceTempC: 28.4,
        waveHeightM: 1.2,
        visibilityNM: 10,
        weatherCondition: 'Overcast with light southerly swell; wind NW 16 kts'
      }
    };

    onSpillAnalyzed(newInc);
    onClose();
  };

  const processingSteps = [
    { title: 'Satellite Image Ingestion', desc: 'Validating SAR Level-1 GRD geo-referencing & radiometric calibration' },
    { title: 'Dark-Spot Detection & Lookalike Filtering', desc: 'Capillary wave damping segmentation & biogenic rejection filter' },
    { title: 'Hydrodynamic Drift Backtracking', desc: 'Coupled ocean current & atmospheric wind leeway modeling' },
    { title: 'AIS Spatiotemporal Correlator', desc: `Scanning vessel positions within ${searchRadiusNM} NM of origin window` },
    { title: 'Vessel Attribution & Anomaly Ranking', desc: 'Evaluating speed drops, loitering patterns & track intersections' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        id="new-spill-analysis-modal"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Satellite className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Analyze New Satellite Scene</h2>
              <p className="text-xs text-slate-400">Automated Detection, Drift Reconstruction & Vessel Attribution Pipeline</p>
            </div>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'upload' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Sentinel-1 / SAR Satellite Scene or Upload Custom Raster
                </label>
                <div className="space-y-2">
                  {presets.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedPreset === p.id 
                          ? 'bg-blue-950/60 border-sky-400 ring-1 ring-sky-400/30' 
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-200">{p.name}</span>
                        <span className="text-[11px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                          {p.resolution}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{p.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>{p.date}</span>
                        <span>•</span>
                        <span>Estimated Slick: {p.areaEstimate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Or Upload Direct GeoTIFF / SAR Sentinel SAFE File
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl p-5 text-center bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-medium text-slate-200">
                    Drop satellite imagery file here, or <span className="text-sky-400 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports GeoTIFF, Sentinel SAFE, NetCDF, or optical PNG/JPEG (Max 500MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Sensor & Polarization Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SAR_C', label: 'C-Band SAR (Sentinel-1)', desc: 'Best for all-weather ocean rough surface' },
                    { id: 'SAR_X', label: 'X-Band SAR (TerraSAR)', desc: 'Ultra high spatial resolution' },
                    { id: 'OPTICAL', label: 'Multi-Spectral (Sentinel-2)', desc: 'Visible & NIR spectral indices' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSensor(s.id as any)}
                      className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                        selectedSensor === s.id 
                          ? 'bg-blue-950 border-sky-400 text-sky-200' 
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold mb-1">{s.label}</div>
                      <div className="text-[10px] text-slate-400">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Backtrack Horizon (Hours)
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="4" 
                      max="36" 
                      value={backtrackHours}
                      onChange={(e) => setBacktrackHours(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                    <span className="font-mono text-sm font-bold text-sky-400 w-12 text-right">
                      T-{backtrackHours}h
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Simulates hydrodynamic reverse advection to isolate release window.
                  </p>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    AIS Correlation Radius
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      value={searchRadiusNM}
                      onChange={(e) => setSearchRadiusNM(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                    <span className="font-mono text-sm font-bold text-sky-400 w-12 text-right">
                      {searchRadiusNM} NM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Radius around suspected origin to interrogate AIS vessel tracks.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Biogenic Slick & Wind Lookalike Rejection
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Filters low-wind calm water zones and algal blooms using gradient edge heuristics.
                  </span>
                </div>
                <input 
                  type="checkbox"
                  checked={lookalikeFilter}
                  onChange={(e) => setLookalikeFilter(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0 w-4 h-4"
                />
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-white">Processing Satellite Scene</h3>
                <p className="text-xs text-slate-400 mt-1">Executing geospatial detection and maritime intelligence correlator</p>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-3 max-w-lg mx-auto">
                {processingSteps.map((s, idx) => {
                  const isDone = processingStep > idx + 1;
                  const isCurrent = processingStep === idx + 1;
                  return (
                    <div 
                      key={idx}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                        isCurrent 
                          ? 'bg-blue-950/80 border border-sky-400/50 shadow-sm' 
                          : isDone 
                          ? 'bg-slate-800/40 opacity-80' 
                          : 'opacity-40'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-400">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200">{s.title}</div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Analysis Pipeline Complete</h3>
                <p className="text-xs text-slate-400 mt-1">
                  18.42 km² oil slick confirmed with 96.8% confidence. Suspected origin backtracked to T-14h.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left max-w-lg mx-auto">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Slick Area</span>
                  <span className="text-sm font-bold text-slate-100 font-mono">18.42 km²</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Top Suspect</span>
                  <span className="text-sm font-bold text-red-400 truncate block">MV Ocean Star</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Attribution</span>
                  <span className="text-sm font-bold text-sky-400 font-mono">92% Match</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button 
            id="modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'upload' && (
              <button
                id="modal-next-config-btn"
                onClick={() => setStep('configure')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <span>Configure Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'configure' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  id="modal-run-pipeline-btn"
                  onClick={handleStartAnalysis}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                  <span>Run Attribution Pipeline</span>
                </button>
              </>
            )}

            {step === 'ready' && (
              <button
                id="modal-view-results-btn"
                onClick={handleFinalize}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg"
              >
                <span>Open Incident Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
