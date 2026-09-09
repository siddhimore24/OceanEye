/**
 * OceanEye API Service
 * Connects frontend to the Express backend API with transparent fallback to local datasets
 */

import { SpillIncident, VesselAttribution } from '../types';
import { MOCK_INCIDENTS } from '../data/mockIncidents';

const API_BASE = '/api';

export interface LiveSpillSummary {
  id: string;
  code: string;
  name: string;
  region: string;
  seaArea: string;
  coordinates: { lat: number; lng: number };
  status: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  areaSqKm: number;
  estimatedVolumeM3: number;
  slickType: string;
  confidenceScore: number;
  satellite: string;
  sensor: string;
  topSuspect: {
    name: string;
    mmsi: string;
    overallScore: number;
    type: string;
  } | null;
  lastUpdated: string;
}

export interface LiveFeedResponse {
  success: boolean;
  totalNoticedSpills: number;
  highSeverityAlerts: number;
  timestamp: string;
  spills: LiveSpillSummary[];
}

/**
 * Fetches all monitored spill incidents from backend API (or returns local default if offline)
 */
export async function fetchAllSpills(): Promise<SpillIncident[]> {
  try {
    const res = await fetch(`${API_BASE}/spills`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    return MOCK_INCIDENTS;
  } catch {
    return MOCK_INCIDENTS;
  }
}

/**
 * Fetches real-time radar telemetry feed of all noticed spills
 */
export async function fetchLiveFeed(): Promise<LiveSpillSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/spills/live-feed`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: LiveFeedResponse = await res.json();
    if (data.success && Array.isArray(data.spills)) {
      return data.spills;
    }
  } catch {}

  // Fallback generation from mock incidents
  return MOCK_INCIDENTS.map((inc) => ({
    id: inc.id,
    code: inc.code,
    name: inc.name,
    region: inc.region,
    seaArea: inc.seaArea,
    coordinates: inc.coordinates,
    status: inc.status,
    severity: inc.severity,
    areaSqKm: inc.characteristics.areaSqKm,
    estimatedVolumeM3: inc.characteristics.estimatedVolumeM3,
    slickType: inc.characteristics.slickType,
    confidenceScore: inc.characteristics.confidenceScore,
    satellite: inc.satellite.satellite,
    sensor: inc.satellite.sensor,
    topSuspect: inc.vessels[0]
      ? {
          name: inc.vessels[0].name,
          mmsi: inc.vessels[0].mmsi,
          overallScore: inc.vessels[0].overallScore,
          type: inc.vessels[0].type,
        }
      : null,
    lastUpdated: new Date().toISOString(),
  }));
}

/**
 * Simulates drift projection using backend Lagrangian model
 */
export async function simulateDrift(params: {
  lat: number;
  lng: number;
  windSpeedKnots?: number;
  currentSpeedKnots?: number;
  currentDirDeg?: number;
  backtrackHours?: number;
}) {
  try {
    const res = await fetch(`${API_BASE}/drift/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Drift simulation API fallback:', err);
    return null;
  }
}

/**
 * Runs attribution ranking on candidates
 */
export async function rankCandidateVessels(incidentId: string, candidates?: VesselAttribution[]) {
  try {
    const res = await fetch(`${API_BASE}/attribution/rank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId, candidates }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Attribution ranking API fallback:', err);
    return null;
  }
}

export interface AisQueryParams {
  query?: string;
  mmsi?: string;
  shipType?: string;
  minSog?: number;
  maxSog?: number;
  minDistanceNM?: number;
  maxDistanceNM?: number;
  minScore?: number;
  maxScore?: number;
  timeWindowHours?: number;
  startTime?: string;
  endTime?: string;
  onlyAnomalies?: boolean;
  incidentId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'rank' | 'score' | 'distance' | 'sog' | 'mmsi' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface AisQueryResponse {
  success: boolean;
  total: number;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtersApplied: Record<string, any>;
  data: VesselAttribution[];
  timestamp: string;
  error?: string;
}

/**
 * Interrogates backend AIS database with multi-field search and filtering
 */
export async function interrogateAis(
  params: AisQueryParams,
  fallbackVessels?: VesselAttribution[]
): Promise<AisQueryResponse> {
  try {
    const res = await fetch(`${API_BASE}/ais/interrogate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json: AisQueryResponse = await res.json();
      if (json && Array.isArray(json.data)) {
        return json;
      }
    } else if (res.status === 400) {
      const errJson = await res.json();
      return {
        success: false,
        total: 0,
        count: 0,
        page: 1,
        pageSize: params.pageSize || 25,
        totalPages: 0,
        filtersApplied: params,
        data: [],
        timestamp: new Date().toISOString(),
        error: errJson.error || 'Invalid filter parameters',
      };
    }
  } catch (err) {
    console.warn('[AIS API Network Error - Switching to local indexed fallback]:', err);
  }

  // Robust Client-Side Query Fallback (for offline or disconnected demo mode)
  const pool: VesselAttribution[] = fallbackVessels && fallbackVessels.length > 0
    ? fallbackVessels
    : MOCK_INCIDENTS.flatMap((i) => i.vessels);

  const textQuery = (params.query || '').trim().toLowerCase();
  const targetMmsi = (params.mmsi || '').replace(/\s+/g, '').toLowerCase();
  const shipTypeFilter = (params.shipType || 'ALL').trim();
  const minSog = params.minSog !== undefined ? Number(params.minSog) : undefined;
  const maxSog = params.maxSog !== undefined ? Number(params.maxSog) : undefined;
  const minDistance = params.minDistanceNM !== undefined ? Number(params.minDistanceNM) : undefined;
  const maxDistance = params.maxDistanceNM !== undefined ? Number(params.maxDistanceNM) : undefined;
  const minScore = params.minScore !== undefined ? Number(params.minScore) : undefined;
  const maxScore = params.maxScore !== undefined ? Number(params.maxScore) : undefined;
  const timeWindowHours = params.timeWindowHours !== undefined ? Number(params.timeWindowHours) : undefined;
  const onlyAnomalies = params.onlyAnomalies === true || String(params.onlyAnomalies) === 'true';

  // Range validation
  if (minSog !== undefined && maxSog !== undefined && minSog > maxSog) {
    return {
      success: false,
      total: 0,
      count: 0,
      page: 1,
      pageSize: params.pageSize || 25,
      totalPages: 0,
      filtersApplied: params,
      data: [],
      timestamp: new Date().toISOString(),
      error: 'Minimum SOG cannot be greater than Maximum SOG',
    };
  }

  if (minDistance !== undefined && maxDistance !== undefined && minDistance > maxDistance) {
    return {
      success: false,
      total: 0,
      count: 0,
      page: 1,
      pageSize: params.pageSize || 25,
      totalPages: 0,
      filtersApplied: params,
      data: [],
      timestamp: new Date().toISOString(),
      error: 'Minimum distance cannot be greater than Maximum distance',
    };
  }

  if (minScore !== undefined && maxScore !== undefined && minScore > maxScore) {
    return {
      success: false,
      total: 0,
      count: 0,
      page: 1,
      pageSize: params.pageSize || 25,
      totalPages: 0,
      filtersApplied: params,
      data: [],
      timestamp: new Date().toISOString(),
      error: 'Minimum score cannot be greater than Maximum score',
    };
  }

  const filtered = pool.filter((v) => {
    if (targetMmsi && !v.mmsi.replace(/\s+/g, '').toLowerCase().includes(targetMmsi)) {
      return false;
    }
    if (textQuery) {
      const matchMmsi = v.mmsi.toLowerCase().includes(textQuery);
      const matchName = v.name?.toLowerCase().includes(textQuery);
      const matchImo = v.imo?.toLowerCase().includes(textQuery);
      const matchCall = v.callsign?.toLowerCase().includes(textQuery);
      const matchDest = v.destination?.toLowerCase().includes(textQuery);
      const matchFlag = v.flag?.toLowerCase().includes(textQuery);
      if (!matchMmsi && !matchName && !matchImo && !matchCall && !matchDest && !matchFlag) {
        return false;
      }
    }
    if (shipTypeFilter && shipTypeFilter !== 'ALL') {
      const vTypeNorm = v.type.toLowerCase();
      const tNorm = shipTypeFilter.toLowerCase();
      if (!vTypeNorm.includes(tNorm) && !tNorm.includes(vTypeNorm)) {
        return false;
      }
    }
    if (minSog !== undefined && v.evidence.speedAtOriginKnots < minSog) return false;
    if (maxSog !== undefined && v.evidence.speedAtOriginKnots > maxSog) return false;
    if (minDistance !== undefined && v.evidence.distanceAtOriginNM < minDistance) return false;
    if (maxDistance !== undefined && v.evidence.distanceAtOriginNM > maxDistance) return false;
    if (minScore !== undefined && v.overallScore < minScore) return false;
    if (maxScore !== undefined && v.overallScore > maxScore) return false;
    if (timeWindowHours !== undefined && Math.abs(v.evidence.timeDifferenceMinutes) > timeWindowHours * 60) return false;
    if (onlyAnomalies) {
      const hasAnomalies =
        v.evidence.speedDropDetected ||
        v.evidence.loiteringDetected ||
        (v.evidence.behaviorAnomalies && v.evidence.behaviorAnomalies.length > 0) ||
        v.evidence.aisContinuity.includes('Gap');
      if (!hasAnomalies) return false;
    }
    return true;
  });

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    success: true,
    total: total,
    count: paginated.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    filtersApplied: params,
    data: paginated,
    timestamp: new Date().toISOString(),
  };
}
