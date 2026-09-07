export type IncidentStatus = 'ACTIVE_MONITORING' | 'CONTAINMENT_DISPATCHED' | 'UNDER_ANALYSIS' | 'RESOLVED';
export type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SatelliteMetadata {
  sensor: string;
  satellite: string;
  instrument: string;
  mode: string;
  resolution: string;
  polarization: string;
  incidenceAngle: string;
  acquisitionTime: string;
  passDirection: 'Ascending' | 'Descending';
  orbitNumber: string;
  cloudCoverPercent?: number;
}

export interface SpillCharacteristics {
  areaSqKm: number;
  lengthKm: number;
  widthKm: number;
  perimeterKm: number;
  estimatedVolumeM3: number;
  estimatedAgeHours: number;
  confidenceScore: number;
  slickType: 'Crude Oil' | 'Heavy Fuel Oil (Bunker C)' | 'Refined Diesel/MDO' | 'Chemical / Condensate';
  bonnCode: string; // e.g. "Bonn Code 3: Metallic / True Oil"
  darkSpotContrastRatio: number;
  dampingFactor: number;
  centroid: Coordinates;
  polygonPoints: [number, number][]; // relative [x, y] or geo coords
}

export interface TimelineStep {
  timeOffsetHours: number;
  label: string;
  timestamp: string;
  spillCenter: Coordinates;
  slickRadiusKm: number;
  description: string;
}

export interface DriftModelData {
  predictedOrigin: Coordinates;
  originConfidencePercent: number;
  driftConfidencePercent: number;
  predicted24hDistanceNM: number;
  driftDirectionDeg: number;
  driftSpeedKnots: number;
  oceanCurrentKnots: number;
  oceanCurrentDirDeg: number;
  windSpeedKnots: number;
  windDirDeg: number;
  windDriftFactorPercent: number;
  estimatedArrivalArea: string;
  coastalImpactETA: string;
  shorelineDistanceKm: number;
  timeline: TimelineStep[];
}

export interface VesselEvidence {
  distanceAtOriginNM: number;
  timeDifferenceMinutes: number;
  trajectoryMatchPercent: number;
  speedAtOriginKnots: number;
  averageVoyageSpeedKnots: number;
  courseAtOriginDeg: number;
  behaviorAnomalies: string[];
  aisContinuity: 'Normal' | 'Intermittent' | 'Gap Detected (3.5h)';
  speedDropDetected: boolean;
  loiteringDetected: boolean;
  scoreBreakdown: {
    spatialProximity: number; // /100
    temporalAlignment: number;
    trajectoryCorrelation: number;
    behavioralPenalty: number;
  };
}

export interface VesselAttribution {
  rank: number;
  name: string;
  mmsi: string;
  imo: string;
  callsign: string;
  flag: string;
  flagCode: string;
  type: 'Crude Oil Tanker' | 'Chemical Tanker' | 'Product Tanker' | 'Bulk Carrier' | 'Container Ship' | 'Offshore Supply Vessel';
  lengthM: number;
  beamM: number;
  draughtM: number;
  destination: string;
  overallScore: number;
  confidence: 'High' | 'Moderate' | 'Low';
  coordinates: Coordinates;
  trackHistory: {
    timestamp: string;
    lat: number;
    lng: number;
    speedKnots: number;
    headingDeg: number;
    navStatus: string;
  }[];
  evidence: VesselEvidence;
}

export interface SpillIncident {
  id: string;
  code: string;
  name: string;
  region: string;
  seaArea: string;
  coordinates: Coordinates;
  timestamp: string;
  status: IncidentStatus;
  severity: SeverityLevel;
  satellite: SatelliteMetadata;
  characteristics: SpillCharacteristics;
  drift: DriftModelData;
  vessels: VesselAttribution[];
  weather: {
    seaSurfaceTempC: number;
    waveHeightM: number;
    visibilityNM: number;
    weatherCondition: string;
  };
}

export type PageId = 
  | 'overview' 
  | 'detection' 
  | 'analysis' 
  | 'drift' 
  | 'ais' 
  | 'attribution' 
  | 'reports';

export interface MapLayerConfig {
  satellite: boolean;
  ais: boolean;
  drift: boolean;
  spill: boolean;
  origin: boolean;
  currents: boolean;
  grid: boolean;
}
