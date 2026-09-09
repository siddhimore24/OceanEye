/**
 * OceanEye - GeoJSON to Google Maps JavaScript API Adapter Layer
 * 
 * Adapts project GeoJSON contracts (spill.geojson, source_zone.geojson, AIS candidate vessels)
 * to Google Maps LatLngLiteral, Polygon, and Polyline formats without mutating source contracts.
 */

import { SpillIncident, Coordinates, VesselAttribution } from '../types';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Exact GeoJSON coordinates from data/sample/spill.geojson
export const CASE_001_SPILL_GEOJSON = [
  { lat: 18.9789, lng: 72.0229 },
  { lat: 18.9765, lng: 72.0301 },
  { lat: 18.9712, lng: 72.0315 },
  { lat: 18.9688, lng: 72.0278 },
  { lat: 18.9705, lng: 72.0210 },
  { lat: 18.9754, lng: 72.0185 },
  { lat: 18.9789, lng: 72.0229 }
];

// Exact GeoJSON coordinates from data/CASE_001/source_zone.geojson (MultiPolygon)
export const CASE_001_SOURCE_ZONE_GEOJSON: LatLng[][] = [
  // Outer polygon ring 1
  [
    { lat: 19.062, lng: 71.938 },
    { lat: 19.058, lng: 71.968 },
    { lat: 19.035, lng: 71.972 },
    { lat: 19.028, lng: 71.945 },
    { lat: 19.045, lng: 71.928 },
    { lat: 19.062, lng: 71.938 }
  ],
  // Core high-confidence zone ring 2
  [
    { lat: 19.038, lng: 71.948 },
    { lat: 19.035, lng: 71.962 },
    { lat: 19.022, lng: 71.958 },
    { lat: 19.025, lng: 71.942 },
    { lat: 19.038, lng: 71.948 }
  ]
];

/**
 * Converts a GeoJSON coordinate [lon, lat] to a Google Maps LatLng
 */
export function geoJsonPointToLatLng(coord: [number, number]): LatLng {
  return {
    lng: coord[0],
    lat: coord[1]
  };
}

/**
 * Returns the geographic polygon vertices for an incident's oil spill.
 * Uses exact GeoJSON geometry for CASE_001 or translates relative polygonPoints.
 */
export function getSpillPolygonPaths(incident: SpillIncident): LatLng[] {
  if (incident.id === 'inc-case001' || incident.name.includes('CASE_001') || incident.code.includes('CASE001')) {
    return CASE_001_SPILL_GEOJSON;
  }

  // Convert characteristic polygon points to geographic coordinates centered on centroid
  const center = incident.characteristics.centroid || incident.coordinates;
  const degScale = 0.00085; // Approx scale factor for polygon dispersion

  if (incident.characteristics.polygonPoints && incident.characteristics.polygonPoints.length > 0) {
    return incident.characteristics.polygonPoints.map(([dx, dy]) => ({
      lat: center.lat + (dy * degScale),
      lng: center.lng + (dx * degScale)
    }));
  }

  // Fallback 6-point regular polygon if no points exist
  const radius = (incident.characteristics.lengthKm || 5) * 0.0045;
  const points: LatLng[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    points.push({
      lat: center.lat + Math.sin(angle) * radius,
      lng: center.lng + Math.cos(angle) * (radius * 1.3)
    });
  }
  return points;
}

/**
 * Returns the geographic polygon paths for an incident's estimated source zone.
 * Supports MultiPolygon (array of rings).
 */
export function getSourceZonePolygons(incident: SpillIncident): LatLng[][] {
  if (incident.id === 'inc-case001' || incident.name.includes('CASE_001') || incident.code.includes('CASE001')) {
    return CASE_001_SOURCE_ZONE_GEOJSON;
  }

  // Generate uncertainty polygon around predicted origin
  const origin = incident.drift?.predictedOrigin || {
    lat: incident.coordinates.lat + 0.08,
    lng: incident.coordinates.lng - 0.08
  };

  const ring1: LatLng[] = [];
  const ring2: LatLng[] = [];
  const radius1 = 0.022; // ~1.3 NM
  const radius2 = 0.012; // ~0.7 NM

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    ring1.push({
      lat: origin.lat + Math.sin(angle) * radius1 * 0.85,
      lng: origin.lng + Math.cos(angle) * radius1 * 1.15
    });
  }
  ring1.push(ring1[0]);

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    ring2.push({
      lat: origin.lat + Math.sin(angle) * radius2 * 0.85,
      lng: origin.lng + Math.cos(angle) * radius2 * 1.15
    });
  }
  ring2.push(ring2[0]);

  return [ring1, ring2];
}

/**
 * Returns backtrack and future drift polyline paths
 */
export function getDriftTrajectoryLines(incident: SpillIncident): {
  backtrack: LatLng[];
  futureDrift: LatLng[];
} {
  const spillCenter = incident.characteristics.centroid || incident.coordinates;
  const origin = incident.drift?.predictedOrigin || spillCenter;

  const backtrack: LatLng[] = [
    { lat: origin.lat, lng: origin.lng },
    {
      lat: (origin.lat + spillCenter.lat) / 2 + 0.005,
      lng: (origin.lng + spillCenter.lng) / 2 - 0.005
    },
    { lat: spillCenter.lat, lng: spillCenter.lng }
  ];

  const futureDrift: LatLng[] = [{ lat: spillCenter.lat, lng: spillCenter.lng }];
  if (incident.drift?.timeline) {
    incident.drift.timeline
      .filter((t) => t.timeOffsetHours > 0)
      .forEach((t) => {
        futureDrift.push({ lat: t.spillCenter.lat, lng: t.spillCenter.lng });
      });
  }

  return { backtrack, futureDrift };
}

/**
 * Computes bounding box encompassing spill, source zone, and all candidate vessels
 */
export function computeIncidentBounds(incident: SpillIncident): BoundsLiteral {
  const spillPaths = getSpillPolygonPaths(incident);
  const sourcePolys = getSourceZonePolygons(incident);

  let minLat = incident.coordinates.lat;
  let maxLat = incident.coordinates.lat;
  let minLng = incident.coordinates.lng;
  let maxLng = incident.coordinates.lng;

  const updateBounds = (pt: { lat: number; lng: number }) => {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lng > maxLng) maxLng = pt.lng;
  };

  spillPaths.forEach(updateBounds);
  sourcePolys.forEach((ring) => ring.forEach(updateBounds));

  if (incident.vessels && incident.vessels.length > 0) {
    incident.vessels.forEach((v) => {
      if (v.coordinates) updateBounds(v.coordinates);
      if (v.trackHistory) {
        v.trackHistory.forEach((th) => updateBounds({ lat: th.lat, lng: th.lng }));
      }
    });
  }

  if (incident.drift?.predictedOrigin) {
    updateBounds(incident.drift.predictedOrigin);
  }

  // Add 15% padding so markers and labels don't touch map edges
  const latSpan = Math.max(maxLat - minLat, 0.04);
  const lngSpan = Math.max(maxLng - minLng, 0.04);
  const paddingRatio = 0.18;

  return {
    north: maxLat + latSpan * paddingRatio,
    south: minLat - latSpan * paddingRatio,
    east: maxLng + lngSpan * paddingRatio,
    west: minLng - lngSpan * paddingRatio
  };
}
