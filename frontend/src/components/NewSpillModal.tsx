import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Upload, Satellite, CheckCircle2, ArrowRight, 
  Layers, Compass, Ship, Loader2, Sparkles, AlertCircle,
  MapPin, Clock, Globe, FileCode, Check, RefreshCw, RotateCcw
} from 'lucide-react';
import { SpillIncident, VesselAttribution } from '../types';
import { MOCK_INCIDENTS } from '../data/mockIncidents';
import { useApp } from '../context/AppContext';

interface NewSpillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpillAnalyzed: (newIncident: SpillIncident) => void;
}

/**
 * Derives the next sequential Case Identifier (CASE_002, CASE_003, etc.)
 * so each newly analyzed spill has an unambiguous, non-colliding identity.
 */
function getNextCaseIdentifier(incidents: SpillIncident[]): { id: string; code: string; caseNumber: number } {
  let maxCaseNum = 1;
  const caseRegex = /CASE[_-]?0*(\d+)/i;
  for (const inc of incidents || []) {
    const codeMatch = (inc.code || '').match(caseRegex);
    const idMatch = (inc.id || '').match(caseRegex);
    const match = codeMatch || idMatch;
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxCaseNum) {
        maxCaseNum = num;
      }
    }
  }
  const nextNum = maxCaseNum + 1;
  const formattedNum = String(nextNum).padStart(3, '0');
  return {
    id: `inc-case${formattedNum}`,
    code: `IN-2026-CASE${formattedNum}`,
    caseNumber: nextNum,
  };
}

export const NewSpillModal: React.FC<NewSpillModalProps> = ({
  isOpen,
  onClose,
  onSpillAnalyzed,
}) => {
  const { incidents } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 'select' (IDLE) -> 'configure' -> 'processing' (ANALYSING) -> 'ready' (COMPLETE)
  const [step, setStep] = useState<'select' | 'configure' | 'processing' | 'ready'>('select');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  
  // Selected preset from available scenes
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-case001');

  // Custom spill parameters
  const [customName, setCustomName] = useState<string>('');
  const [customCodeOverride, setCustomCodeOverride] = useState<string>('');
  const [customRegion, setCustomRegion] = useState<string>('Indian Ocean / EEZ');
  const [customLat, setCustomLat] = useState<number>(18.975);
  const [customLng, setCustomLng] = useState<number>(72.025);
  const [customArea, setCustomArea] = useState<number>(12.8);
  const [customOilType, setCustomOilType] = useState<string>('Crude Oil');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Configuration options
  const [selectedSensor, setSelectedSensor] = useState<'SAR_C' | 'SAR_X' | 'OPTICAL'>('SAR_C');
  const [searchRadiusNM, setSearchRadiusNM] = useState<number>(25);
  const [backtrackHours, setBacktrackHours] = useState<number>(12);
  const [lookalikeFilter, setLookalikeFilter] = useState<boolean>(true);
  const [processingStep, setProcessingStep] = useState<number>(0);
  
  // Generated result preview
  const [analyzedResult, setAnalyzedResult] = useState<SpillIncident | null>(null);

  // Initialize and reset session state whenever opening or resetting
  const resetSession = useCallback(() => {
    const nextCase = getNextCaseIdentifier(incidents);
    setStep('select');
    setActiveTab('preset');
    setSelectedPresetId('preset-case001');
    setCustomName(`Arabian Sea - Sector ${nextCase.caseNumber} Investigation`);
    setCustomCodeOverride(nextCase.code);
    setCustomRegion('Indian Ocean / EEZ');
    setCustomLat(18.975);
    setCustomLng(72.025);
    setCustomArea(12.8);
    setCustomOilType('Crude Oil');
    setUploadedFileName(null);
    setProcessingStep(0);
    setAnalyzedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [incidents]);

  // Ensure fresh defaults on initial mount
  useEffect(() => {
    resetSession();
  }, []);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'preset-case001',
      code: 'IN-2026-CASE001',
      name: 'Arabian Sea - Mumbai Offshore (CASE_001)',
      region: 'Indian Ocean / West Coast EEZ',
      date: 'Acquired 2026-09-07 06:11 UTC',
      resolution: '10m C-SAR IW GRD',
      areaEstimate: '14.56 km²',
      sensor: 'Sentinel-1B / RISAT-1A',
      suspect: 'MT Desh Shanti (Crude Tanker)',
      score: '94%',
      description: 'Active Bombay High oil sector slick validated with INCOIS wave buoys and Sentinel SAR.',
      sourceIncident: MOCK_INCIDENTS.find(i => i.id === 'inc-case001') || MOCK_INCIDENTS[1]
    },
    {
      id: 'preset-gom',
      code: 'MS-2026-0884',
      name: 'Gulf of Mexico - Mississippi Canyon Block 72',
      region: 'Gulf of Mexico Deepwater',
      date: 'Acquired 2026-09-06 18:31 UTC',
      resolution: '10m C-SAR VV+VH',
      areaEstimate: '18.42 km²',
      sensor: 'Sentinel-1C Copernicus',
      suspect: 'MV Ocean Star (Crude Tanker)',
      score: '92%',
      description: 'Large surface slick in offshore extraction corridor with high dark-spot backscatter contrast.',
      sourceIncident: MOCK_INCIDENTS.find(i => i.id === 'inc-0884') || MOCK_INCIDENTS[0]
    },
    {
      id: 'preset-malacca',
      code: 'MS-2026-0712',
      name: 'Strait of Malacca - One Fathom Bank',
      region: 'Southeast Asia Straits',
      date: 'Acquired 2026-09-05 09:05 UTC',
      resolution: '3m X-Band StripMap',
      areaEstimate: '7.24 km²',
      sensor: 'TerraSAR-X (DLR/Airbus)',
      suspect: 'MV Malacca Navigator (Container Ship)',
      score: '89%',
      description: 'Narrow linear wake discharge along westbound Traffic Separation Scheme (TSS).',
      sourceIncident: MOCK_INCIDENTS.find(i => i.id === 'inc-0712') || MOCK_INCIDENTS[2]
    },
    {
      id: 'preset-gof',
      code: 'BALTIC-2026-GOF1',
      name: 'Baltic Sea - Gulf of Finland Fairway',
      region: 'Baltic Sea / Gulf of Finland',
      date: 'Acquired 2026-09-08 11:30 UTC',
      resolution: '10m C-SAR IW GRD',
      areaEstimate: '12.30 km²',
      sensor: 'Sentinel-1A (ESA)',
      suspect: 'EVA-318 (Product Tanker)',
      score: '91%',
      description: 'Member 3 clean AIS benchmark dataset correlation with hydrodynamic backward drift.',
      sourceIncident: MOCK_INCIDENTS.find(i => i.id === 'inc-gof001') || MOCK_INCIDENTS[4]
    },
    {
      id: 'preset-northsea',
      code: 'MS-2026-0549',
      name: 'North Sea - Forties Field Approach',
      region: 'North Sea Basin',
      date: 'Acquired 2026-09-04 14:08 UTC',
      resolution: '16m ScanSAR Narrow',
      areaEstimate: '4.15 km²',
      sensor: 'Radarsat RCM-1',
      suspect: 'MT Viking Trader (Chemical Tanker)',
      score: '84%',
      description: 'Chemical condensate and produced water sheen near offshore export manifold.',
      sourceIncident: MOCK_INCIDENTS.find(i => i.id === 'inc-0549') || MOCK_INCIDENTS[3]
    },
  ];

  // Enhanced file upload with GeoJSON parsing adhering to DATA_CONTRACTS.md
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setCustomName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase() + ' SPILL');
      setActiveTab('custom');

      // Attempt parsing GeoJSON or JSON files
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const parsed = JSON.parse(text);

            // Respect contract spill_id if provided
            const contractId = parsed.properties?.spill_id || parsed.spill_id || parsed.properties?.id;
            if (contractId) {
              setCustomCodeOverride(String(contractId));
            }

            // Extract coordinates or centroid
            if (parsed.centroid && typeof parsed.centroid.lat === 'number') {
              setCustomLat(+parsed.centroid.lat.toFixed(4));
              setCustomLng(+parsed.centroid.lng.toFixed(4));
            } else if (parsed.geometry?.type === 'Polygon' && Array.isArray(parsed.geometry.coordinates?.[0])) {
              const ring = parsed.geometry.coordinates[0];
              const avgLng = ring.reduce((sum: number, pt: number[]) => sum + pt[0], 0) / ring.length;
              const avgLat = ring.reduce((sum: number, pt: number[]) => sum + pt[1], 0) / ring.length;
              setCustomLat(+avgLat.toFixed(4));
              setCustomLng(+avgLng.toFixed(4));
            } else if (parsed.geometry?.type === 'Point' && Array.isArray(parsed.geometry.coordinates)) {
              setCustomLng(+parsed.geometry.coordinates[0].toFixed(4));
              setCustomLat(+parsed.geometry.coordinates[1].toFixed(4));
            }

            // Extract area_km2
            const area = parsed.area_km2 || parsed.properties?.area_km2 || parsed.properties?.area;
            if (typeof area === 'number' && area > 0) {
              setCustomArea(+area.toFixed(2));
            }
          } catch (err) {
            console.warn('[NewSpillModal] GeoJSON parse note:', err);
          }
        };
        reader.readAsText(file);
      }

      // Reset file input value so re-selecting the same file fires onChange cleanly
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleQuickSelect = (presetItem: (typeof presets)[0]) => {
    const nextCase = getNextCaseIdentifier(incidents);
    const base = presetItem.sourceIncident;
    // Clone with fresh unique case id
    const clonedIncident: SpillIncident = {
      ...base,
      id: nextCase.id,
      code: nextCase.code,
      timestamp: new Date().toISOString(),
    };
    onSpillAnalyzed(clonedIncident);
    resetSession();
    onClose();
  };

  const handleStartAnalysis = () => {
    setStep('processing');
    setProcessingStep(1);

    // Build the incident object ahead of time
    let incidentToCreate: SpillIncident;

    if (activeTab === 'preset') {
      const chosenPreset = presets.find(p => p.id === selectedPresetId) || presets[0];
      const base = chosenPreset.sourceIncident;
      const nextCase = getNextCaseIdentifier(incidents);
      
      // Clone base incident with fresh unique identifier and tuned config
      incidentToCreate = {
        ...base,
        id: nextCase.id,
        code: nextCase.code,
        name: `${chosenPreset.name.split(' (')[0]} (${nextCase.code})`,
        timestamp: new Date().toISOString(),
        characteristics: {
          ...base.characteristics,
          estimatedAgeHours: backtrackHours,
        },
        drift: {
          ...base.drift,
          timeline: base.drift.timeline.map(t => ({
            ...t,
            timeOffsetHours: t.timeOffsetHours < 0 ? -backtrackHours : t.timeOffsetHours,
          }))
        }
      };
    } else {
      // Build dynamic custom spill incident with synthesized realistic vessels
      const lat = customLat;
      const lng = customLng;
      const originLat = Number((lat + 0.07).toFixed(4));
      const originLng = Number((lng - 0.08).toFixed(4));

      const customVessels: VesselAttribution[] = [
        {
          rank: 1,
          name: 'MT Sovereign Pioneer',
          mmsi: '419998120',
          imo: '9518290',
          callsign: 'ATSP',
          flag: 'Marshall Islands',
          flagCode: 'MH',
          type: 'Crude Oil Tanker',
          lengthM: 274,
          beamM: 48,
          draughtM: 15.8,
          destination: `${customName.split(' ')[0]} Marine Terminal`,
          overallScore: 93,
          confidence: 'High',
          coordinates: { lat: Number((originLat - 0.008).toFixed(4)), lng: Number((originLng + 0.006).toFixed(4)) },
          trackHistory: [
            { timestamp: 'T-14h', lat: Number((originLat + 0.06).toFixed(4)), lng: Number((originLng - 0.08).toFixed(4)), speedKnots: 13.8, headingDeg: 125, navStatus: 'Underway' },
            { timestamp: `T-${backtrackHours}h`, lat: originLat, lng: originLng, speedKnots: 3.4, headingDeg: 165, navStatus: 'Restricted Manoeuvrability' },
            { timestamp: 'T-4h', lat: Number((originLat - 0.04).toFixed(4)), lng: Number((originLng + 0.05).toFixed(4)), speedKnots: 12.6, headingDeg: 120, navStatus: 'Underway' }
          ],
          evidence: {
            distanceAtOriginNM: 0.6,
            timeDifferenceMinutes: -10,
            trajectoryMatchPercent: 96.2,
            speedAtOriginKnots: 3.4,
            averageVoyageSpeedKnots: 13.5,
            courseAtOriginDeg: 165,
            behaviorAnomalies: [
              `Speed dropped from 13.8 kts down to 3.4 kts within 0.6 NM of backward drift origin`,
              `AIS broadcast silence: 124 minutes logged during transit window`,
              `Vessel track directly intersects estimated source zone polygon`
            ],
            aisContinuity: 'Gap Detected (3.5h)',
            speedDropDetected: true,
            loiteringDetected: true,
            scoreBreakdown: {
              spatialProximity: 98,
              temporalAlignment: 95,
              trajectoryCorrelation: 94,
              behavioralPenalty: 85
            }
          }
        },
        {
          rank: 2,
          name: 'MV Global Mariner',
          mmsi: '354881000',
          imo: '9381140',
          callsign: '3FGB',
          flag: 'Panama',
          flagCode: 'PA',
          type: 'Product Tanker',
          lengthM: 182,
          beamM: 32,
          draughtM: 11.2,
          destination: 'Regional Anchorage',
          overallScore: 74,
          confidence: 'Moderate',
          coordinates: { lat: Number((originLat + 0.025).toFixed(4)), lng: Number((originLng + 0.03).toFixed(4)) },
          trackHistory: [
            { timestamp: `T-${backtrackHours}h`, lat: Number((originLat + 0.03).toFixed(4)), lng: Number((originLng + 0.02).toFixed(4)), speedKnots: 9.8, headingDeg: 135, navStatus: 'Underway' }
          ],
          evidence: {
            distanceAtOriginNM: 2.3,
            timeDifferenceMinutes: +32,
            trajectoryMatchPercent: 78.0,
            speedAtOriginKnots: 9.8,
            averageVoyageSpeedKnots: 11.0,
            courseAtOriginDeg: 135,
            behaviorAnomalies: [
              `Passed within ${searchRadiusNM > 10 ? '3 NM' : '1.5 NM'} of suspected release origin corridor`
            ],
            aisContinuity: 'Normal',
            speedDropDetected: false,
            loiteringDetected: false,
            scoreBreakdown: {
              spatialProximity: 76,
              temporalAlignment: 78,
              trajectoryCorrelation: 72,
              behavioralPenalty: 70
            }
          }
        },
        {
          rank: 3,
          name: 'Atlantic Pioneer',
          mmsi: '636015400',
          imo: '9610420',
          callsign: 'A8ZN',
          flag: 'Liberia',
          flagCode: 'LR',
          type: 'Bulk Carrier',
          lengthM: 225,
          beamM: 32,
          draughtM: 13.4,
          destination: 'Commercial Bulk Dock',
          overallScore: 56,
          confidence: 'Moderate',
          coordinates: { lat: Number((originLat - 0.05).toFixed(4)), lng: Number((originLng - 0.04).toFixed(4)) },
          trackHistory: [
            { timestamp: `T-${backtrackHours}h`, lat: Number((originLat - 0.04).toFixed(4)), lng: Number((originLng - 0.03).toFixed(4)), speedKnots: 12.1, headingDeg: 90, navStatus: 'Underway' }
          ],
          evidence: {
            distanceAtOriginNM: 4.8,
            timeDifferenceMinutes: -45,
            trajectoryMatchPercent: 61.0,
            speedAtOriginKnots: 12.1,
            averageVoyageSpeedKnots: 12.2,
            courseAtOriginDeg: 90,
            behaviorAnomalies: [
              `Transited peripheral sector of search radius`
            ],
            aisContinuity: 'Normal',
            speedDropDetected: false,
            loiteringDetected: false,
            scoreBreakdown: {
              spatialProximity: 55,
              temporalAlignment: 58,
              trajectoryCorrelation: 57,
              behavioralPenalty: 54
            }
          }
        },
        {
          rank: 4,
          name: 'Harbour Star OSV',
          mmsi: '419001920',
          imo: '9780010',
          callsign: 'AUHB',
          flag: 'India',
          flagCode: 'IN',
          type: 'Offshore Supply Vessel',
          lengthM: 78,
          beamM: 17,
          draughtM: 5.1,
          destination: 'Offshore Platform Zone',
          overallScore: 33,
          confidence: 'Low',
          coordinates: { lat: Number((originLat + 0.06).toFixed(4)), lng: Number((originLng - 0.06).toFixed(4)) },
          trackHistory: [
            { timestamp: `T-${backtrackHours}h`, lat: Number((originLat + 0.05).toFixed(4)), lng: Number((originLng - 0.05).toFixed(4)), speedKnots: 2.4, headingDeg: 45, navStatus: 'Dynamic Positioning' }
          ],
          evidence: {
            distanceAtOriginNM: 6.5,
            timeDifferenceMinutes: +120,
            trajectoryMatchPercent: 30.0,
            speedAtOriginKnots: 2.4,
            averageVoyageSpeedKnots: 2.5,
            courseAtOriginDeg: 45,
            behaviorAnomalies: [
              `Routine platform maintenance standby mode`
            ],
            aisContinuity: 'Normal',
            speedDropDetected: false,
            loiteringDetected: false,
            scoreBreakdown: {
              spatialProximity: 35,
              temporalAlignment: 32,
              trajectoryCorrelation: 31,
              behavioralPenalty: 34
            }
          }
        }
      ];

      const nextCase = getNextCaseIdentifier(incidents);
      const assignedCode = customCodeOverride || nextCase.code;
      const assignedId = nextCase.id;

      incidentToCreate = {
        id: assignedId,
        code: assignedCode,
        name: customName || `Offshore Surveillance Target (${assignedCode})`,
        region: customRegion,
        seaArea: 'Designated Maritime EEZ Surveillance Corridor',
        coordinates: { lat, lng },
        timestamp: new Date().toISOString(),
        status: 'ACTIVE_MONITORING',
        severity: customArea > 15 ? 'HIGH' : customArea > 6 ? 'HIGH' : 'MEDIUM',
        satellite: {
          sensor: selectedSensor === 'SAR_C' ? 'C-Band Synthetic Aperture Radar (Sentinel-1)' : selectedSensor === 'SAR_X' ? 'High-Res X-Band SAR (TerraSAR-X)' : 'Multi-Spectral Sentinel-2',
          satellite: selectedSensor === 'SAR_C' ? 'Sentinel-1C Copernicus' : selectedSensor === 'SAR_X' ? 'TerraSAR-X' : 'Sentinel-2B',
          instrument: 'Interferometric Wide GRD',
          mode: 'Level-1 GRD High Res',
          resolution: selectedSensor === 'SAR_X' ? '3m x 3m' : '10m x 10m',
          polarization: 'Dual VV + VH',
          incidenceAngle: '35.4°',
          acquisitionTime: new Date().toISOString(),
          passDirection: 'Ascending',
          orbitNumber: String(Math.floor(30000 + Math.random() * 10000)),
          cloudCoverPercent: 85,
        },
        characteristics: {
          areaSqKm: Number(customArea.toFixed(2)),
          lengthKm: Number((Math.sqrt(customArea) * 1.8).toFixed(1)),
          widthKm: Number((Math.sqrt(customArea) * 0.55).toFixed(1)),
          perimeterKm: Number((Math.sqrt(customArea) * 5.8).toFixed(1)),
          estimatedVolumeM3: Number((customArea * 22).toFixed(1)),
          estimatedAgeHours: backtrackHours,
          confidenceScore: 95.8,
          slickType: customOilType as any,
          bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Discoloration',
          darkSpotContrastRatio: -8.2,
          dampingFactor: 4.7,
          centroid: { lat, lng },
          polygonPoints: [
            [-28, -9], [-16, -14], [4, -16], [24, -10], [42, -3],
            [48, 8], [36, 16], [16, 18], [-6, 14], [-22, 7]
          ]
        },
        drift: {
          predictedOrigin: { lat: originLat, lng: originLng },
          originConfidencePercent: 93.5,
          driftConfidencePercent: 88.0,
          predicted24hDistanceNM: 21.5,
          driftDirectionDeg: 130,
          driftSpeedKnots: 1.15,
          oceanCurrentKnots: 1.35,
          oceanCurrentDirDeg: 138,
          windSpeedKnots: 15.5,
          windDirDeg: 300,
          windDriftFactorPercent: 3.1,
          estimatedArrivalArea: 'Coastal Shoreline Environmental Protection Perimeter',
          coastalImpactETA: '36 hours (T+36h)',
          shorelineDistanceKm: 52.4,
          timeline: [
            {
              timeOffsetHours: -backtrackHours,
              label: `T-${backtrackHours}h (Suspected Discharge)`,
              timestamp: 'Origin Release Window',
              spillCenter: { lat: originLat, lng: originLng },
              slickRadiusKm: 0.6,
              description: `Backtracked hydrodynamic particle ensemble origin.`
            },
            {
              timeOffsetHours: 0,
              label: 'Now (Detection)',
              timestamp: 'Acquisition Time',
              spillCenter: { lat, lng },
              slickRadiusKm: 1.9,
              description: `Satellite SAR confirmed ${customArea} km² continuous slick.`
            },
            {
              timeOffsetHours: 24,
              label: 'T+24h (Projection)',
              timestamp: 'Forecast T+24h',
              spillCenter: { lat: Number((lat - 0.08).toFixed(4)), lng: Number((lng + 0.10).toFixed(4)) },
              slickRadiusKm: 4.5,
              description: 'Projected dispersion zone.'
            }
          ]
        },
        vessels: customVessels,
        weather: {
          seaSurfaceTempC: 28.2,
          waveHeightM: 1.3,
          visibilityNM: 9,
          weatherCondition: 'Moderate sea state, gentle swell 1.3m, wind 15 kts'
        }
      };
    }

    setAnalyzedResult(incidentToCreate);

    // Synchronize with backend API
    try {
      fetch('/api/spills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentToCreate),
      }).catch(() => {});
    } catch {}

    const timer1 = setTimeout(() => setProcessingStep(2), 500);
    const timer2 = setTimeout(() => setProcessingStep(3), 1100);
    const timer3 = setTimeout(() => setProcessingStep(4), 1700);
    const timer4 = setTimeout(() => setProcessingStep(5), 2300);
    const timer5 = setTimeout(() => {
      setStep('ready');
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  };

  const handleFinalize = () => {
    if (analyzedResult) {
      onSpillAnalyzed(analyzedResult);
    }
    resetSession();
    onClose();
  };

  const handleClose = () => {
    resetSession();
    onClose();
  };

  const processingSteps = [
    { title: 'Satellite Scene Ingestion & SAR Preprocessing', desc: 'Radiometric calibration, speckle filtering and terrain correction' },
    { title: 'Oil Slick Segmentation & Lookalike Filter', desc: 'Capillary wave damping classification and biogenic film rejection' },
    { title: 'Lagrangian Hydrodynamic Reverse Drift Model', desc: `Hindcasting advection particles ${backtrackHours}h back to identify origin zone` },
    { title: 'Spatiotemporal AIS Vessel Interrogation', desc: `Correlating all ship tracks within ${searchRadiusNM} NM of origin window` },
    { title: 'Bayesian Vessel Attribution & Anomaly Ranking', desc: 'Scoring proximity, speed drops, transponder gaps and loitering' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md font-poppins">
      <div 
        id="new-spill-analysis-modal"
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Satellite className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Analyze New Spill Investigation</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-sky-300 font-semibold uppercase">
                  Detection & Attribution
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Select a monitored scene or enter custom coordinates for instant ship attribution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              id="modal-reset-session-btn"
              type="button"
              onClick={resetSession}
              title="Reset all inputs and start completely fresh"
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reset</span>
            </button>
            <button 
              id="close-modal-btn"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {step === 'select' && (
            <div className="space-y-4">
              {/* Tab Selector: Presets vs Custom Spill */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  id="modal-tab-presets"
                  onClick={() => setActiveTab('preset')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'preset'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Curated Satellite Scenes ({presets.length})</span>
                </button>

                <button
                  type="button"
                  id="modal-tab-custom"
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'custom'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Custom Spill & File Ingestion</span>
                </button>
              </div>

              {activeTab === 'preset' ? (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Choose a Satellite Scene to Analyze & Correlate:
                  </label>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {presets.map(p => (
                      <div
                        key={p.id}
                        id={`preset-card-${p.id}`}
                        onClick={() => setSelectedPresetId(p.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedPresetId === p.id 
                            ? 'bg-blue-950/70 border-sky-400 ring-2 ring-sky-400/30 shadow-lg' 
                            : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-100">{p.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                                {p.code}
                              </span>
                            </div>
                            <span className="text-xs text-sky-400 font-medium">{p.region}</span>
                          </div>

                          <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                            {p.areaEstimate}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-2.5">{p.description}</p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60 text-[11px] font-mono">
                          <span className="text-slate-400">{p.sensor} ({p.resolution})</span>
                          <span className="text-amber-400 font-semibold">
                            Suspect: {p.suspect} ({p.score})
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-700/40">
                          <span className="text-[10px] text-slate-400">
                            {selectedPresetId === p.id ? '✓ Selected for pipeline analysis' : 'Click card to select'}
                          </span>
                          <button
                            type="button"
                            id={`quick-load-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickSelect(p);
                            }}
                            className="px-2.5 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-sky-200" />
                            <span>Quick Load Scene</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload Zone */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Upload Satellite Raster (.TIF / .GEOJSON / .CSV / .ZIP)
                      </label>
                      {uploadedFileName && (
                        <button
                          type="button"
                          id="clear-uploaded-file-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUploadedFileName(null);
                            setUploadedFileContent(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 hover:underline"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove file</span>
                        </button>
                      )}
                    </div>
                    <label className="border-2 border-dashed border-slate-700 hover:border-sky-500/70 rounded-xl p-5 text-center bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer block">
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".tif,.tiff,.geojson,.json,.csv,.zip,.nc"
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                      <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-semibold text-slate-200">
                        {uploadedFileName ? (
                          <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Loaded: {uploadedFileName}
                          </span>
                        ) : (
                          <>Drop satellite raster / AIS log file, or <span className="text-sky-400 underline">browse files</span></>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Supports Sentinel-1 GeoTIFF, GeoJSON vectors, pyais CSV logs, or NetCDF
                      </p>
                    </label>
                  </div>

                  {/* Custom Parameters Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Incident Name</label>
                      <input 
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-poppins"
                        placeholder="e.g. Kochi Coast Oil Sheen"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Region / Basin</label>
                      <input 
                        type="text"
                        value={customRegion}
                        onChange={(e) => setCustomRegion(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-poppins"
                        placeholder="e.g. Indian Ocean / EEZ"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Latitude (°N)</label>
                      <input 
                        type="number"
                        step="0.001"
                        value={customLat}
                        onChange={(e) => setCustomLat(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Longitude (°E)</label>
                      <input 
                        type="number"
                        step="0.001"
                        value={customLng}
                        onChange={(e) => setCustomLng(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Estimated Area (km²)</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={customArea}
                        onChange={(e) => setCustomArea(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Oil / Hydrocarbon Type</label>
                      <select 
                        value={customOilType}
                        onChange={(e) => setCustomOilType(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-poppins"
                      >
                        <option value="Crude Oil">Crude Oil (Heavy Arabian / Bombay High)</option>
                        <option value="Heavy Fuel Oil (Bunker C)">Heavy Fuel Oil (Bunker C / Sludge)</option>
                        <option value="Chemical / Condensate">Chemical Sheen / Condensate</option>
                        <option value="Marine Diesel Oil">Marine Diesel Oil (Light Fractions)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sensor Mode & Wave Scattering Polarization
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'SAR_C', label: 'C-Band SAR (Sentinel-1)', desc: 'Bragg wave capillary damping (All-weather)' },
                    { id: 'SAR_X', label: 'X-Band SAR (TerraSAR)', desc: 'Sub-3m ultra high resolution stripmap' },
                    { id: 'OPTICAL', label: 'Multi-Spectral (Sentinel-2)', desc: 'Sun-glint & NIR spectral reflection' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSensor(s.id as any)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        selectedSensor === s.id 
                          ? 'bg-blue-950 border-sky-400 text-sky-200 ring-1 ring-sky-400/40 shadow-sm' 
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1">{s.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Drift Backtrack Horizon
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                      T-{backtrackHours}h Window
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="4" 
                    max="48" 
                    value={backtrackHours}
                    onChange={(e) => setBacktrackHours(Number(e.target.value))}
                    className="w-full accent-sky-500 mt-2"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lagrangian backward particle tracker coupling current & wind leeway.
                  </p>
                </div>

                <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      AIS Spatial Interrogation Radius
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                      {searchRadiusNM} NM
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={searchRadiusNM}
                    onChange={(e) => setSearchRadiusNM(Number(e.target.value))}
                    className="w-full accent-sky-500 mt-2"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Extracts and ranks suspect tracks within radius of suspected release.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Automatic Lookalike & Biogenic Slick Filter
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Rejects wind shelters, internal waves, and natural algal blooms using boundary gradient slope heuristics.
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
            <div className="py-6 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-white">Running OceanEye AI Attribution Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">Correlating satellite radar data, reverse drift physics, and commercial AIS trajectories</p>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-2.5 max-w-lg mx-auto">
                {processingSteps.map((s, idx) => {
                  const isDone = processingStep > idx + 1;
                  const isCurrent = processingStep === idx + 1;
                  return (
                    <div 
                      key={idx}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                        isCurrent 
                          ? 'bg-blue-950/80 border border-sky-400/50 shadow-md' 
                          : isDone 
                          ? 'bg-slate-800/40 opacity-80' 
                          : 'opacity-40'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
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
                        <div className="text-xs font-bold text-slate-200">{s.title}</div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'ready' && analyzedResult && (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Spill Analysis & Ship Attribution Complete!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Successfully identified <strong className="text-emerald-400 font-semibold">{analyzedResult.characteristics.areaSqKm} km²</strong> slick in <strong className="text-white font-semibold">{analyzedResult.region}</strong> and ranked {analyzedResult.vessels.length} candidate vessels.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-left max-w-xl mx-auto font-poppins">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Incident Target</span>
                  <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{analyzedResult.name}</span>
                  <span className="text-[11px] text-sky-400 font-mono">{analyzedResult.code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Top Suspect Ship</span>
                  <span className="text-xs font-bold text-amber-400 truncate block mt-0.5">
                    {analyzedResult.vessels[0]?.name || 'N/A'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    MMSI: {analyzedResult.vessels[0]?.mmsi || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Attribution Score</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono block mt-0.5">
                    {analyzedResult.vessels[0]?.overallScore || 90}% Match
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {analyzedResult.vessels.length} Ships Correlated
                  </span>
                </div>
              </div>

              {/* Ranked Vessels Preview Strip */}
              <div className="max-w-xl mx-auto bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Candidate Vessels Ready for Inspection:
                </span>
                <div className="space-y-1">
                  {analyzedResult.vessels.slice(0, 3).map((v) => (
                    <div key={v.mmsi} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded ${v.rank === 1 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-400'}`}>
                          #{v.rank}
                        </span>
                        <span className="font-semibold text-slate-200">{v.name}</span>
                        <span className="text-[10px] text-slate-400">({v.type})</span>
                      </div>
                      <span className="font-mono font-bold text-sky-400">{v.overallScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button 
            id="modal-cancel-btn"
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'select' && (
              <button
                id="modal-next-config-btn"
                type="button"
                onClick={() => setStep('configure')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:translate-y-px"
              >
                <span>Configure Pipeline Parameters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'configure' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  id="modal-run-pipeline-btn"
                  type="button"
                  onClick={handleStartAnalysis}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:translate-y-px"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
                  <span>Execute Analysis & Correlate Ships</span>
                </button>
              </>
            )}

            {step === 'ready' && (
              <button
                id="modal-view-results-btn"
                type="button"
                onClick={handleFinalize}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 active:translate-y-px"
              >
                <span>Load Spill & Inspect Ships</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
