import { SpillIncident } from '../types';

export const MOCK_INCIDENTS: SpillIncident[] = [
  {
    id: 'inc-0884',
    code: 'MS-2026-0884',
    name: 'Gulf of Mexico - Mississippi Canyon Block 72',
    region: 'Gulf of Mexico Deepwater',
    seaArea: 'Northern Gulf / US EEZ',
    coordinates: { lat: 28.3412, lng: -89.4187 },
    timestamp: '2026-09-06T18:42:00Z',
    status: 'ACTIVE_MONITORING',
    severity: 'HIGH',
    satellite: {
      sensor: 'SAR C-Band Synthetic Aperture Radar',
      satellite: 'Sentinel-1C (ESA Copernicus)',
      instrument: 'C-SAR Interferometric Wide (IW)',
      mode: 'Level-1 Ground Range Detected (GRD)',
      resolution: '10m x 10m spatial pixel',
      polarization: 'Dual VV + VH cross-pol',
      incidenceAngle: '34.6° mid-swath',
      acquisitionTime: '2026-09-06T18:31:45Z',
      passDirection: 'Ascending',
      orbitNumber: '38192',
      cloudCoverPercent: 82, // SAR penetrates clouds 100%!
    },
    characteristics: {
      areaSqKm: 18.42,
      lengthKm: 8.4,
      widthKm: 2.3,
      perimeterKm: 26.8,
      estimatedVolumeM3: 412.0,
      estimatedAgeHours: 14.5,
      confidenceScore: 96.8,
      slickType: 'Crude Oil',
      bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Oil Discoloration',
      darkSpotContrastRatio: -7.8, // dB SAR backscatter contrast
      dampingFactor: 4.6, // capillary wave damping
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
      windDirDeg: 305, // from NW
      windDriftFactorPercent: 3.2,
      estimatedArrivalArea: 'Breton National Wildlife Refuge Seaward Margin',
      coastalImpactETA: '38 hours (T+38h)',
      shorelineDistanceKm: 64.2,
      timeline: [
        {
          timeOffsetHours: -14,
          label: 'T-14h (Suspected Origin)',
          timestamp: '2026-09-06 04:00 UTC',
          spillCenter: { lat: 28.4850, lng: -89.6210 },
          slickRadiusKm: 0.8,
          description: 'Probable primary discharge event based on hydrodynamic backtrack simulation.'
        },
        {
          timeOffsetHours: -8,
          label: 'T-8h (Advection Phase)',
          timestamp: '2026-09-06 10:00 UTC',
          spillCenter: { lat: 28.4210, lng: -89.5310 },
          slickRadiusKm: 1.4,
          description: 'Surface slick spreading under Loop Current eddy shear and 15kt NW wind.'
        },
        {
          timeOffsetHours: 0,
          label: 'Now (SAR Acquisition)',
          timestamp: '2026-09-06 18:31 UTC',
          spillCenter: { lat: 28.3412, lng: -89.4187 },
          slickRadiusKm: 2.3,
          description: 'Sentinel-1C radar pass captured 18.4 km² continuous dark slick.'
        },
        {
          timeOffsetHours: 6,
          label: 'T+6h (Forecast)',
          timestamp: '2026-09-07 00:30 UTC',
          spillCenter: { lat: 28.2750, lng: -89.3240 },
          slickRadiusKm: 3.1,
          description: 'Continued advection ESE; natural evaporation estimated at 18% light fractions.'
        },
        {
          timeOffsetHours: 12,
          label: 'T+12h (Forecast)',
          timestamp: '2026-09-07 06:30 UTC',
          spillCenter: { lat: 28.2100, lng: -89.2310 },
          slickRadiusKm: 4.0,
          description: 'Approaching offshore deepwater shipping fairway; emulsification commencing.'
        },
        {
          timeOffsetHours: 24,
          label: 'T+24h (Critical Horizon)',
          timestamp: '2026-09-07 18:30 UTC',
          spillCenter: { lat: 28.0850, lng: -89.0490 },
          slickRadiusKm: 5.6,
          description: 'Dispersed slick edge 28 NM from origin; boom containment response window closing.'
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
          { timestamp: '02:00', lat: 28.5910, lng: -89.7820, speedKnots: 13.8, headingDeg: 128, navStatus: 'Underway Using Engine' },
          { timestamp: '03:15', lat: 28.5320, lng: -89.6910, speedKnots: 11.2, headingDeg: 134, navStatus: 'Underway' },
          { timestamp: '04:05', lat: 28.4830, lng: -89.6190, speedKnots: 4.2, headingDeg: 172, navStatus: 'Restricted Manoeuvrability' },
          { timestamp: '05:30', lat: 28.4750, lng: -89.6100, speedKnots: 3.8, headingDeg: 185, navStatus: 'Loitering / Drifting' },
          { timestamp: '07:15', lat: 28.4320, lng: -89.5410, speedKnots: 12.9, headingDeg: 125, navStatus: 'Underway Using Engine' },
          { timestamp: '12:00', lat: 28.2910, lng: -89.3120, speedKnots: 14.1, headingDeg: 122, navStatus: 'Underway' },
          { timestamp: '18:30', lat: 28.1800, lng: -89.1400, speedKnots: 13.6, headingDeg: 120, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 0.8,
          timeDifferenceMinutes: -12,
          trajectoryMatchPercent: 94.6,
          speedAtOriginKnots: 4.2,
          averageVoyageSpeedKnots: 13.9,
          courseAtOriginDeg: 172,
          behaviorAnomalies: [
            'Sharp speed drop from 13.8 kts down to 4.2 kts near suspected origin coordinates',
            'AIS broadcast gap: 142 minutes during transit (04:15 - 06:37 UTC)',
            'Vessel type matches crude cargo carrier with active slop tank operations'
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
      },
      {
        rank: 2,
        name: 'MV Blue Horizon',
        mmsi: '354921000',
        imo: '9377482',
        callsign: '3FZL9',
        flag: 'Panama',
        flagCode: 'PA',
        type: 'Product Tanker',
        lengthM: 183,
        beamM: 32,
        draughtM: 11.4,
        destination: 'New Orleans',
        overallScore: 78,
        confidence: 'Moderate',
        coordinates: { lat: 28.5110, lng: -89.5890 },
        trackHistory: [
          { timestamp: '02:00', lat: 28.6210, lng: -89.7120, speedKnots: 12.4, headingDeg: 145, navStatus: 'Underway' },
          { timestamp: '03:45', lat: 28.5200, lng: -89.6050, speedKnots: 8.1, headingDeg: 158, navStatus: 'Underway' },
          { timestamp: '05:00', lat: 28.4600, lng: -89.5200, speedKnots: 12.1, headingDeg: 140, navStatus: 'Underway' },
          { timestamp: '18:30', lat: 28.0200, lng: -88.9200, speedKnots: 12.8, headingDeg: 138, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 2.4,
          timeDifferenceMinutes: +34,
          trajectoryMatchPercent: 81.2,
          speedAtOriginKnots: 8.1,
          averageVoyageSpeedKnots: 12.5,
          courseAtOriginDeg: 158,
          behaviorAnomalies: [
            'Unscheduled course deviation (18°) 2.4 NM north-east of origin',
            'Brief speed dip from 12.4 kts to 8.1 kts'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: true,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 78,
            temporalAlignment: 82,
            trajectoryCorrelation: 80,
            behavioralPenalty: 72
          }
        }
      },
      {
        rank: 3,
        name: 'MV Eastern Pearl',
        mmsi: '477120300',
        imo: '9620014',
        callsign: 'VRKM2',
        flag: 'Hong Kong',
        flagCode: 'HK',
        type: 'Bulk Carrier',
        lengthM: 225,
        beamM: 32,
        draughtM: 13.8,
        destination: 'Pascagoula Bulk Dock',
        overallScore: 64,
        confidence: 'Moderate',
        coordinates: { lat: 28.4420, lng: -89.6780 },
        trackHistory: [
          { timestamp: '02:30', lat: 28.5400, lng: -89.8100, speedKnots: 11.5, headingDeg: 110, navStatus: 'Underway' },
          { timestamp: '04:10', lat: 28.4710, lng: -89.6500, speedKnots: 11.4, headingDeg: 112, navStatus: 'Underway' },
          { timestamp: '06:00', lat: 28.4050, lng: -89.4900, speedKnots: 11.6, headingDeg: 111, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 4.1,
          timeDifferenceMinutes: -48,
          trajectoryMatchPercent: 68.0,
          speedAtOriginKnots: 11.4,
          averageVoyageSpeedKnots: 11.5,
          courseAtOriginDeg: 112,
          behaviorAnomalies: [
            'Proximity within 5 NM of origin corridor during 04:00 UTC window',
            'Dry bulk vessel with heavy bunker fuel inventory (HFO)'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 62,
            temporalAlignment: 68,
            trajectoryCorrelation: 65,
            behavioralPenalty: 61
          }
        }
      },
      {
        rank: 4,
        name: 'OSV Gulf Sentinel',
        mmsi: '367412990',
        imo: '9781190',
        callsign: 'WDD4102',
        flag: 'United States',
        flagCode: 'US',
        type: 'Offshore Supply Vessel',
        lengthM: 88,
        beamM: 18,
        draughtM: 5.6,
        destination: 'Offshore Rig MC-72',
        overallScore: 31,
        confidence: 'Low',
        coordinates: { lat: 28.5200, lng: -89.6500 },
        trackHistory: [
          { timestamp: '03:00', lat: 28.5250, lng: -89.6600, speedKnots: 2.1, headingDeg: 45, navStatus: 'Dynamic Positioning' },
          { timestamp: '05:00', lat: 28.5220, lng: -89.6550, speedKnots: 1.8, headingDeg: 50, navStatus: 'Dynamic Positioning' }
        ],
        evidence: {
          distanceAtOriginNM: 3.8,
          timeDifferenceMinutes: +120,
          trajectoryMatchPercent: 24.5,
          speedAtOriginKnots: 1.8,
          averageVoyageSpeedKnots: 2.0,
          courseAtOriginDeg: 45,
          behaviorAnomalies: [
            'Stationary dynamic positioning operation at designated platform tether',
            'No fuel discharge anomalies reported by field operations'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 45,
            temporalAlignment: 30,
            trajectoryCorrelation: 20,
            behavioralPenalty: 29
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
  },
  {
    id: 'inc-0712',
    code: 'MS-2026-0712',
    name: 'Strait of Malacca - One Fathom Bank',
    region: 'Southeast Asia Straits',
    seaArea: 'International Shipping Fairway (TSS)',
    coordinates: { lat: 2.8940, lng: 101.0120 },
    timestamp: '2026-09-05T09:15:00Z',
    status: 'CONTAINMENT_DISPATCHED',
    severity: 'MEDIUM',
    satellite: {
      sensor: 'X-Band SAR High Resolution',
      satellite: 'TerraSAR-X (DLR/Airbus)',
      instrument: 'StripMap Mode',
      mode: 'High-Res SAR 3m',
      resolution: '3.0m x 3.0m',
      polarization: 'Single VV',
      incidenceAngle: '38.2°',
      acquisitionTime: '2026-09-05T09:05:12Z',
      passDirection: 'Descending',
      orbitNumber: '19442',
      cloudCoverPercent: 95
    },
    characteristics: {
      areaSqKm: 7.24,
      lengthKm: 6.1,
      widthKm: 1.2,
      perimeterKm: 15.2,
      estimatedVolumeM3: 98.0,
      estimatedAgeHours: 9.0,
      confidenceScore: 94.2,
      slickType: 'Heavy Fuel Oil (Bunker C)',
      bonnCode: 'Bonn Agreement Level 2: Rainbow Sheen to Metallic',
      darkSpotContrastRatio: -9.2,
      dampingFactor: 5.1,
      centroid: { lat: 2.8940, lng: 101.0120 },
      polygonPoints: [
        [-28, -6], [-15, -10], [5, -12], [22, -8], [35, -2],
        [38, 6], [24, 10], [4, 8], [-12, 6], [-25, 2]
      ]
    },
    drift: {
      predictedOrigin: { lat: 2.9810, lng: 100.9100 },
      originConfidencePercent: 91.0,
      driftConfidencePercent: 86.4,
      predicted24hDistanceNM: 18.2,
      driftDirectionDeg: 122,
      driftSpeedKnots: 0.95,
      oceanCurrentKnots: 1.1,
      oceanCurrentDirDeg: 125,
      windSpeedKnots: 9.0,
      windDirDeg: 280,
      windDriftFactorPercent: 3.0,
      estimatedArrivalArea: 'Selangor Coastline Mangrove Buffer',
      coastalImpactETA: '46 hours',
      shorelineDistanceKm: 42.0,
      timeline: [
        {
          timeOffsetHours: -9,
          label: 'T-9h (Suspected Bilge Dump)',
          timestamp: '2026-09-05 00:15 UTC',
          spillCenter: { lat: 2.9810, lng: 100.9100 },
          slickRadiusKm: 0.5,
          description: 'Nighttime illicit oily water separator bypass during transit.'
        },
        {
          timeOffsetHours: 0,
          label: 'Now (Detection)',
          timestamp: '2026-09-05 09:15 UTC',
          spillCenter: { lat: 2.8940, lng: 101.0120 },
          slickRadiusKm: 1.2,
          description: 'TerraSAR-X captured narrow 6.1 km linear slick along TSS fairway.'
        },
        {
          timeOffsetHours: 12,
          label: 'T+12h (Forecast)',
          timestamp: '2026-09-05 21:15 UTC',
          spillCenter: { lat: 2.8100, lng: 101.1200 },
          slickRadiusKm: 2.1,
          description: 'Malacca coastguard patrol boat KD Gagah dispatched.'
        }
      ]
    },
    vessels: [
      {
        rank: 1,
        name: 'MV Malacca Navigator',
        mmsi: '563189000',
        imo: '9512349',
        callsign: '9V8812',
        flag: 'Singapore',
        flagCode: 'SG',
        type: 'Container Ship',
        lengthM: 300,
        beamM: 40,
        draughtM: 14.5,
        destination: 'Port Klang',
        overallScore: 89,
        confidence: 'High',
        coordinates: { lat: 2.9750, lng: 100.9180 },
        trackHistory: [
          { timestamp: '00:00', lat: 3.0100, lng: 100.8600, speedKnots: 17.5, headingDeg: 125, navStatus: 'Underway' },
          { timestamp: '00:20', lat: 2.9800, lng: 100.9120, speedKnots: 17.2, headingDeg: 124, navStatus: 'Underway' },
          { timestamp: '01:00', lat: 2.9200, lng: 101.0050, speedKnots: 16.8, headingDeg: 126, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 0.3,
          timeDifferenceMinutes: +5,
          trajectoryMatchPercent: 96.2,
          speedAtOriginKnots: 17.2,
          averageVoyageSpeedKnots: 17.0,
          courseAtOriginDeg: 124,
          behaviorAnomalies: [
            'Direct spatial-temporal co-location with origin within 300 meters',
            'Linear slick geometry matches trailing vessel wake discharge pattern',
            'Port State Control history of OWS maintenance deficiency (2025)'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 98,
            temporalAlignment: 96,
            trajectoryCorrelation: 94,
            behavioralPenalty: 68
          }
        }
      }
    ],
    weather: {
      seaSurfaceTempC: 30.1,
      waveHeightM: 0.6,
      visibilityNM: 8,
      weatherCondition: 'Calm waters, light westerly breeze'
    }
  },
  {
    id: 'inc-0549',
    code: 'MS-2026-0549',
    name: 'North Sea - Forties Field Approach',
    region: 'North Sea Basin',
    seaArea: 'UK / Norwegian Continental Shelf Border',
    coordinates: { lat: 57.7210, lng: 0.9410 },
    timestamp: '2026-09-04T14:20:00Z',
    status: 'UNDER_ANALYSIS',
    severity: 'LOW',
    satellite: {
      sensor: 'C-Band Radar Constellation',
      satellite: 'RCM-1 (Canadian Space Agency)',
      instrument: 'Medium Resolution 16m',
      mode: 'ScanSAR Narrow',
      resolution: '16m x 16m',
      polarization: 'Compact Polarimetry',
      incidenceAngle: '31.5°',
      acquisitionTime: '2026-09-04T14:08:20Z',
      passDirection: 'Ascending',
      orbitNumber: '41908',
      cloudCoverPercent: 100
    },
    characteristics: {
      areaSqKm: 4.15,
      lengthKm: 3.8,
      widthKm: 1.1,
      perimeterKm: 9.8,
      estimatedVolumeM3: 42.0,
      estimatedAgeHours: 6.5,
      confidenceScore: 89.1,
      slickType: 'Chemical / Condensate',
      bonnCode: 'Bonn Agreement Level 1: Barely Visible Silvery Sheen',
      darkSpotContrastRatio: -6.4,
      dampingFactor: 3.8,
      centroid: { lat: 57.7210, lng: 0.9410 },
      polygonPoints: [
        [-18, -4], [-8, -8], [6, -9], [18, -4], [22, 3],
        [14, 7], [2, 6], [-10, 4]
      ]
    },
    drift: {
      predictedOrigin: { lat: 57.7650, lng: 0.8820 },
      originConfidencePercent: 88.0,
      driftConfidencePercent: 84.0,
      predicted24hDistanceNM: 14.5,
      driftDirectionDeg: 140,
      driftSpeedKnots: 0.8,
      oceanCurrentKnots: 0.9,
      oceanCurrentDirDeg: 145,
      windSpeedKnots: 22.0,
      windDirDeg: 315,
      windDriftFactorPercent: 3.4,
      estimatedArrivalArea: 'Open North Sea (High Evaporative Decay)',
      coastalImpactETA: 'No coastal landfall expected (>120 NM)',
      shorelineDistanceKm: 185.0,
      timeline: [
        {
          timeOffsetHours: -6,
          label: 'T-6h (Suspected Release)',
          timestamp: '2026-09-04 08:20 UTC',
          spillCenter: { lat: 57.7650, lng: 0.8820 },
          slickRadiusKm: 0.4,
          description: 'Produced water discharge with elevated condensate fraction.'
        },
        {
          timeOffsetHours: 0,
          label: 'Now',
          timestamp: '2026-09-04 14:20 UTC',
          spillCenter: { lat: 57.7210, lng: 0.9410 },
          slickRadiusKm: 1.1,
          description: 'Fast weathering condensate sheen observed on C-Band SAR.'
        }
      ]
    },
    vessels: [
      {
        rank: 1,
        name: 'MT Viking Trader',
        mmsi: '257129000',
        imo: '9419821',
        callsign: 'LADX7',
        flag: 'Norway',
        flagCode: 'NO',
        type: 'Chemical Tanker',
        lengthM: 145,
        beamM: 23,
        draughtM: 8.2,
        destination: 'Mongstad',
        overallScore: 84,
        confidence: 'High',
        coordinates: { lat: 57.7580, lng: 0.8910 },
        trackHistory: [
          { timestamp: '08:00', lat: 57.7720, lng: 0.8710, speedKnots: 11.8, headingDeg: 135, navStatus: 'Underway' },
          { timestamp: '08:30', lat: 57.7550, lng: 0.8950, speedKnots: 11.5, headingDeg: 138, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 0.9,
          timeDifferenceMinutes: +10,
          trajectoryMatchPercent: 91.0,
          speedAtOriginKnots: 11.5,
          averageVoyageSpeedKnots: 11.7,
          courseAtOriginDeg: 138,
          behaviorAnomalies: [
            'Proximity within 0.9 NM of origin during condensate discharge window'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 92,
            temporalAlignment: 90,
            trajectoryCorrelation: 88,
            behavioralPenalty: 66
          }
        }
      }
    ],
    weather: {
      seaSurfaceTempC: 13.2,
      waveHeightM: 2.4,
      visibilityNM: 7,
      weatherCondition: 'Rough chop, NW Force 5 gale gusts'
    }
  }
];
