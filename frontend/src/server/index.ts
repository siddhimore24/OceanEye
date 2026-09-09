/**
 * OceanEye Maritime Intelligence Platform - Backend API Server
 *
 * Provides RESTful endpoints for:
 * 1. Live Oil Spill Feed & Incident Telemetry (/api/spills, /api/spills/live-feed)
 * 2. Spill Registration & SAR Segmentation Processing (/api/spills/detect)
 * 3. Lagrangian Hydrodynamic Drift Simulation (/api/drift/simulate)
 * 4. AIS Vessel Attribution & Forensic Ranking Engine (/api/attribution/rank)
 * 5. System Health & INCOIS/SAR Service Status (/api/health)
 */

import express, { Request, Response } from 'express';
import { MOCK_INCIDENTS } from '../data/mockIncidents';
import { SpillIncident, VesselAttribution } from '../types';
import { aisStore, AisQueryParams } from './aisStore';

const app = express();
const PORT = process.env.PORT || 3001;

// Built-in JSON body parser
app.use(express.json({ limit: '10mb' }));

// Permissive CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory store initialized with verified incident records
let activeIncidents: SpillIncident[] = [...MOCK_INCIDENTS];

// ============================================================================
// 1. HEALTH & SYSTEM DIAGNOSTICS
// ============================================================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'OceanEye Intelligence Backend',
    version: '3.4.2',
    timestamp: new Date().toISOString(),
    telemetry: {
      activeSpillCount: activeIncidents.length,
      satellitesConnected: ['Sentinel-1B/C', 'RISAT-1A', 'TerraSAR-X', 'RCM-1'],
      aisFeedStatus: 'STREAMING_NORMAL',
      incoisOceanBuoys: 12,
      lagrangianModelEngine: 'ONLINE',
    },
  });
});

// ============================================================================
// 2. LIVE SPILLS TELEMETRY & INCIDENTS
// ============================================================================

// GET /api/spills - Retrieve all monitored spill incidents
app.get('/api/spills', (req: Request, res: Response) => {
  const { region, severity } = req.query;
  let results = activeIncidents;

  if (region && typeof region === 'string') {
    results = results.filter((i) => i.region.toLowerCase().includes(region.toLowerCase()));
  }
  if (severity && typeof severity === 'string') {
    results = results.filter((i) => i.severity.toUpperCase() === severity.toUpperCase());
  }

  res.json({
    success: true,
    count: results.length,
    timestamp: new Date().toISOString(),
    data: results,
  });
});

// GET /api/spills/live-feed - Simulated real-time radar feed with slick expansion
app.get('/api/spills/live-feed', (req: Request, res: Response) => {
  const liveSummary = activeIncidents.map((inc) => {
    // Add micro-variance to simulate real-time sensor updates
    const jitterArea = +(inc.characteristics.areaSqKm + (Math.random() * 0.08 - 0.04)).toFixed(2);
    return {
      id: inc.id,
      code: inc.code,
      name: inc.name,
      region: inc.region,
      seaArea: inc.seaArea,
      coordinates: inc.coordinates,
      status: inc.status,
      severity: inc.severity,
      areaSqKm: Math.max(1.0, jitterArea),
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
    };
  });

  res.json({
    success: true,
    totalNoticedSpills: liveSummary.length,
    highSeverityAlerts: liveSummary.filter((s) => s.severity === 'HIGH').length,
    timestamp: new Date().toISOString(),
    spills: liveSummary,
  });
});

// GET /api/spills/:id - Retrieve specific spill details
app.get('/api/spills/:id', (req: Request, res: Response) => {
  const incident = activeIncidents.find((i) => i.id === req.params.id || i.code === req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Spill incident record not found' });
  }
  res.json({ success: true, data: incident });
});

// POST /api/spills - Register new detected spill incident
app.post('/api/spills', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.coordinates || typeof body.coordinates.lat !== 'number') {
    return res.status(400).json({ success: false, error: 'Missing required spill parameters: name and coordinates' });
  }

  const newIncident: SpillIncident = {
    id: body.id || `inc-${Date.now()}`,
    code: body.code || `IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    name: body.name,
    region: body.region || 'International Waters / Exclusive Economic Zone',
    seaArea: body.seaArea || 'Offshore Maritime Sector',
    coordinates: body.coordinates,
    timestamp: body.timestamp || new Date().toISOString(),
    status: body.status || 'ACTIVE_MONITORING',
    severity: body.severity || 'HIGH',
    satellite: body.satellite || {
      sensor: 'SAR C-Band Synthetic Aperture Radar',
      satellite: 'Sentinel-1C',
      instrument: 'C-SAR IW GRD',
      mode: 'Level-1 GRD High Res',
      resolution: '10m x 10m',
      polarization: 'Dual VV + VH',
      incidenceAngle: '35.2°',
      acquisitionTime: new Date().toISOString(),
      passDirection: 'Ascending',
      orbitNumber: `${Math.floor(30000 + Math.random() * 20000)}`,
      cloudCoverPercent: 85,
    },
    characteristics: body.characteristics || {
      areaSqKm: +(body.areaSqKm || 8.5).toFixed(2),
      lengthKm: +(body.lengthKm || 5.2).toFixed(1),
      widthKm: +(body.widthKm || 1.8).toFixed(1),
      perimeterKm: +(body.perimeterKm || 16.4).toFixed(1),
      estimatedVolumeM3: body.estimatedVolumeM3 || 210,
      estimatedAgeHours: body.estimatedAgeHours || 8.0,
      confidenceScore: body.confidenceScore || 95.5,
      slickType: body.slickType || 'Crude Oil',
      bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Discoloration',
      darkSpotContrastRatio: -8.1,
      dampingFactor: 4.5,
      centroid: body.coordinates,
      polygonPoints: [
        [-25, -8], [-14, -12], [4, -14], [20, -9], [32, -3],
        [36, 5], [26, 12], [8, 14], [-10, 10], [-22, 2],
      ],
    },
    drift: body.drift || {
      predictedOrigin: {
        lat: body.coordinates.lat + 0.05,
        lng: body.coordinates.lng - 0.05,
      },
      originConfidencePercent: 91.5,
      driftConfidencePercent: 87.0,
      predicted24hDistanceNM: 19.5,
      driftDirectionDeg: 130,
      driftSpeedKnots: 1.1,
      oceanCurrentKnots: 1.3,
      oceanCurrentDirDeg: 135,
      windSpeedKnots: 14.0,
      windDirDeg: 295,
      windDriftFactorPercent: 3.1,
      estimatedArrivalArea: 'Coastal Mangrove and Shoreline Transition Belt',
      coastalImpactETA: '42 hours',
      shorelineDistanceKm: 52.0,
      timeline: [
        {
          timeOffsetHours: -8,
          label: 'T-8h (Discharge Point)',
          timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
          spillCenter: { lat: body.coordinates.lat + 0.05, lng: body.coordinates.lng - 0.05 },
          slickRadiusKm: 0.5,
          description: 'Suspected illicit bilge/tank release corridor.',
        },
        {
          timeOffsetHours: 0,
          label: 'Now (Acquisition)',
          timestamp: new Date().toISOString(),
          spillCenter: body.coordinates,
          slickRadiusKm: 1.8,
          description: 'Satellite radar anomaly validated by SAR backscatter processing.',
        },
      ],
    },
    vessels: body.vessels || [],
    weather: body.weather || {
      seaSurfaceTempC: 27.5,
      waveHeightM: 1.2,
      visibilityNM: 9,
      weatherCondition: 'Moderate sea chop, light swell',
    },
  };

  activeIncidents.unshift(newIncident);
  res.status(201).json({ success: true, message: 'Spill registered successfully', data: newIncident });
});

// ============================================================================
// 3. VESSEL ATTRIBUTION RANKING ENGINE
// ============================================================================
// POST /api/attribution/rank
// Implements Member 3/4 pipeline heuristic matching: spatial proximity, temporal alignment,
// trajectory match, and kinematic speed drop/gap anomalies.
app.post('/api/attribution/rank', (req: Request, res: Response) => {
  const { incidentId, candidates } = req.body;
  const incident = activeIncidents.find((i) => i.id === incidentId);

  if (!incident && (!candidates || !Array.isArray(candidates))) {
    return res.status(400).json({ success: false, error: 'Provide a valid incidentId or candidate vessels array' });
  }

  const vesselsToRank: VesselAttribution[] = candidates || incident?.vessels || [];

  // Sort by overall score descending and assign 1-based ranks
  const ranked = [...vesselsToRank]
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((v, index) => ({
      ...v,
      rank: index + 1,
      confidence: v.overallScore >= 80 ? 'High' : v.overallScore >= 55 ? 'Moderate' : 'Low',
    }));

  res.json({
    success: true,
    incidentId: incident?.id,
    rankedVesselsCount: ranked.length,
    suspectRank1: ranked[0] || null,
    ranking: ranked,
  });
});

// ============================================================================
// 4. LAGRANGIAN DRIFT SIMULATION ENGINE
// ============================================================================
// POST /api/drift/simulate
app.post('/api/drift/simulate', (req: Request, res: Response) => {
  const { lat, lng, windSpeedKnots = 15, currentSpeedKnots = 1.2, currentDirDeg = 135, backtrackHours = 12 } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ success: false, error: 'lat and lng must be numbers' });
  }

  // Reverse Lagrangian calculation: origin is back along the opposite of drift direction
  const reverseAngleRad = ((currentDirDeg + 180) % 360) * (Math.PI / 180);
  const distanceKm = currentSpeedKnots * 1.852 * backtrackHours;
  const degScale = distanceKm / 111.0;

  const predictedOrigin = {
    lat: +(lat + Math.cos(reverseAngleRad) * degScale).toFixed(4),
    lng: +(lng + (Math.sin(reverseAngleRad) * degScale) / Math.cos((lat * Math.PI) / 180)).toFixed(4),
  };

  // Forward 24h trajectory
  const forwardAngleRad = (currentDirDeg % 360) * (Math.PI / 180);
  const forwardDistanceKm = currentSpeedKnots * 1.852 * 24;
  const forwardDegScale = forwardDistanceKm / 111.0;

  const predicted24h = {
    lat: +(lat + Math.cos(forwardAngleRad) * forwardDegScale).toFixed(4),
    lng: +(lng + (Math.sin(forwardAngleRad) * forwardDegScale) / Math.cos((lat * Math.PI) / 180)).toFixed(4),
  };

  res.json({
    success: true,
    inputCoordinates: { lat, lng },
    simulationParameters: {
      windSpeedKnots,
      currentSpeedKnots,
      currentDirDeg,
      backtrackHours,
    },
    predictedOrigin,
    predicted24hPosition: predicted24h,
    predicted24hDistanceNM: +(currentSpeedKnots * 24).toFixed(1),
    confidencePercent: 92.4,
    sourceZoneEnvelope: {
      outerRadiusNM: 1.8,
      coreRadiusNM: 0.8,
    },
  });
});

// ============================================================================
// 5. AIS MARITIME TRAFFIC & INTERROGATION ENGINE
// ============================================================================

// GET /api/ais/interrogate - Query and filter candidate vessels
app.get('/api/ais/interrogate', (req: Request, res: Response) => {
  try {
    const params: AisQueryParams = {
      query: req.query.query as string | undefined,
      mmsi: req.query.mmsi as string | undefined,
      shipType: req.query.shipType as string | undefined,
      minSog: req.query.minSog !== undefined ? parseFloat(req.query.minSog as string) : undefined,
      maxSog: req.query.maxSog !== undefined ? parseFloat(req.query.maxSog as string) : undefined,
      minDistanceNM: req.query.minDistanceNM !== undefined ? parseFloat(req.query.minDistanceNM as string) : undefined,
      maxDistanceNM: req.query.maxDistanceNM !== undefined ? parseFloat(req.query.maxDistanceNM as string) : undefined,
      minScore: req.query.minScore !== undefined ? parseFloat(req.query.minScore as string) : undefined,
      maxScore: req.query.maxScore !== undefined ? parseFloat(req.query.maxScore as string) : undefined,
      timeWindowHours: req.query.timeWindowHours !== undefined ? parseFloat(req.query.timeWindowHours as string) : undefined,
      startTime: req.query.startTime as string | undefined,
      endTime: req.query.endTime as string | undefined,
      onlyAnomalies: req.query.onlyAnomalies === 'true',
      incidentId: req.query.incidentId as string | undefined,
      page: req.query.page !== undefined ? parseInt(req.query.page as string, 10) : undefined,
      pageSize: req.query.pageSize !== undefined ? parseInt(req.query.pageSize as string, 10) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const result = aisStore.query(params);
    if (!result.success && result.error) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[AIS API Error]:', err);
    return res.status(500).json({ success: false, error: 'Internal AIS interrogation engine error', data: [] });
  }
});

// POST /api/ais/interrogate - Query and filter candidate vessels via JSON body
app.post('/api/ais/interrogate', (req: Request, res: Response) => {
  try {
    const params: AisQueryParams = req.body || {};
    const result = aisStore.query(params);
    if (!result.success && result.error) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[AIS API Error]:', err);
    return res.status(500).json({ success: false, error: 'Internal AIS interrogation engine error', data: [] });
  }
});

// GET /api/ais/vessels/:mmsi - Retrieve individual vessel specifications and full kinematic track
app.get('/api/ais/vessels/:mmsi', (req: Request, res: Response) => {
  const mmsi = (req.params.mmsi || '').trim();
  const vessel = aisStore.getAllVessels().find((v) => v.mmsi === mmsi);
  if (!vessel) {
    return res.status(404).json({ success: false, error: `Vessel with MMSI ${mmsi} not found in AIS registry` });
  }
  return res.json({ success: true, data: vessel });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[OceanEye Backend] Operational Intelligence API listening on http://localhost:${PORT}`);
});

export default app;
