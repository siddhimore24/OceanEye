import { SpillIncident } from '../types';

export const MOCK_INCIDENTS: SpillIncident[] = [
  // 1. ARABIAN SEA / MUMBAI OFFSHORE SHELF (CASE_001) - PRIMARY DEFAULT CASE
  {
    id: 'inc-case001',
    code: 'IN-2026-CASE001',
    name: 'Arabian Sea - Mumbai Offshore Basin (CASE_001)',
    region: 'Indian Ocean / West Coast EEZ',
    seaArea: 'Mumbai High Oil Field / INCOIS Sector',
    coordinates: { lat: 18.9749, lng: 72.0250 },
    timestamp: '2026-09-07T06:11:14Z',
    status: 'ACTIVE_MONITORING',
    severity: 'HIGH',
    satellite: {
      sensor: 'SAR C-Band Synthetic Aperture Radar',
      satellite: 'Sentinel-1B / RISAT-1A',
      instrument: 'C-SAR IW GRD Stripmap',
      mode: 'Level-1 GRD High Res',
      resolution: '10m x 10m spatial pixel',
      polarization: 'Dual VV + VH',
      incidenceAngle: '36.8°',
      acquisitionTime: '2026-09-07T06:05:00Z',
      passDirection: 'Ascending',
      orbitNumber: '41209',
      cloudCoverPercent: 90,
    },
    characteristics: {
      areaSqKm: 14.56,
      lengthKm: 7.2,
      widthKm: 2.1,
      perimeterKm: 21.4,
      estimatedVolumeM3: 345.0,
      estimatedAgeHours: 11.5,
      confidenceScore: 96.8,
      slickType: 'Crude Oil',
      bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Discoloration',
      darkSpotContrastRatio: -8.4,
      dampingFactor: 4.8,
      centroid: { lat: 18.9749, lng: 72.0250 },
      polygonPoints: [
        [-30, -10], [-18, -16], [2, -18], [22, -12], [40, -5],
        [50, 6], [48, 16], [32, 18], [12, 20], [-8, 16],
        [-24, 10], [-34, 0]
      ],
    },
    drift: {
      predictedOrigin: { lat: 19.0450, lng: 71.9520 },
      originConfidencePercent: 93.8,
      driftConfidencePercent: 89.2,
      predicted24hDistanceNM: 22.4,
      driftDirectionDeg: 128,
      driftSpeedKnots: 1.2,
      oceanCurrentKnots: 1.4,
      oceanCurrentDirDeg: 135,
      windSpeedKnots: 15.0,
      windDirDeg: 300,
      windDriftFactorPercent: 3.1,
      estimatedArrivalArea: 'Alibaug & Raigad Coastal Mangrove Belt',
      coastalImpactETA: '34 hours',
      shorelineDistanceKm: 48.6,
      timeline: [
        {
          timeOffsetHours: -12,
          label: 'T-12h (Discharge Point)',
          timestamp: '2026-09-06 18:00 UTC',
          spillCenter: { lat: 19.0450, lng: 71.9520 },
          slickRadiusKm: 0.6,
          description: 'Suspected illicit tank de-ballasting along westbound tanker fairway.'
        },
        {
          timeOffsetHours: 0,
          label: 'Now (Acquisition)',
          timestamp: '2026-09-07 06:11 UTC',
          spillCenter: { lat: 18.9749, lng: 72.0250 },
          slickRadiusKm: 2.1,
          description: 'Radar backscatter anomaly validated by INCOIS ocean buoy network.'
        },
        {
          timeOffsetHours: 24,
          label: 'T+24h (Forecast)',
          timestamp: '2026-09-08 06:00 UTC',
          spillCenter: { lat: 18.8800, lng: 72.1600 },
          slickRadiusKm: 4.8,
          description: 'Trajectory approaching outer harbour anchorage of JNPT/Mumbai port.'
        }
      ]
    },
    vessels: [
      {
        rank: 1,
        name: 'MT Desh Shanti',
        mmsi: '419000124',
        imo: '9272890',
        callsign: 'AUCR',
        flag: 'India',
        flagCode: 'IN',
        type: 'Crude Oil Tanker',
        lengthM: 280,
        beamM: 50,
        draughtM: 16.8,
        destination: 'Mumbai Marine Terminal',
        overallScore: 94,
        confidence: 'High',
        coordinates: { lat: 19.0380, lng: 71.9610 },
        trackHistory: [
          { timestamp: '17:00', lat: 19.1200, lng: 71.8400, speedKnots: 13.6, headingDeg: 128, navStatus: 'Underway' },
          { timestamp: '18:15', lat: 19.0420, lng: 71.9560, speedKnots: 3.9, headingDeg: 165, navStatus: 'Restricted Manoeuvrability' },
          { timestamp: '19:40', lat: 19.0100, lng: 71.9950, speedKnots: 12.8, headingDeg: 124, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 0.6,
          timeDifferenceMinutes: -15,
          trajectoryMatchPercent: 96.8,
          speedAtOriginKnots: 3.9,
          averageVoyageSpeedKnots: 13.5,
          courseAtOriginDeg: 165,
          behaviorAnomalies: [
            'Severe speed drop from 13.6 kts down to 3.9 kts within 0.6 NM of backward drift origin',
            'AIS gap: Transponder silent for 85 minutes between 18:15 and 19:40 UTC',
            'Direct trajectory intersection with CASE_001 source zone polygon'
          ],
          aisContinuity: 'Gap Detected (3.5h)',
          speedDropDetected: true,
          loiteringDetected: true,
          scoreBreakdown: {
            spatialProximity: 98,
            temporalAlignment: 96,
            trajectoryCorrelation: 94,
            behavioralPenalty: 88
          }
        }
      },
      {
        rank: 2,
        name: 'MV Sagar Kanya',
        mmsi: '419000350',
        imo: '8215431',
        callsign: 'ATSK',
        flag: 'India',
        flagCode: 'IN',
        type: 'Offshore Supply Vessel',
        lengthM: 100,
        beamM: 16,
        draughtM: 5.6,
        destination: 'Bombay High South Rig',
        overallScore: 74,
        confidence: 'Moderate',
        coordinates: { lat: 19.0820, lng: 71.9100 },
        trackHistory: [
          { timestamp: '17:30', lat: 19.0950, lng: 71.8900, speedKnots: 9.8, headingDeg: 130, navStatus: 'Underway' },
          { timestamp: '18:45', lat: 19.0700, lng: 71.9300, speedKnots: 8.5, headingDeg: 135, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 2.8,
          timeDifferenceMinutes: +45,
          trajectoryMatchPercent: 78.4,
          speedAtOriginKnots: 8.5,
          averageVoyageSpeedKnots: 9.5,
          courseAtOriginDeg: 135,
          behaviorAnomalies: [
            'Proximity within 3 NM of spill origin buffer zone',
            'Moderate course deviation observed during transit'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 74,
            temporalAlignment: 76,
            trajectoryCorrelation: 72,
            behavioralPenalty: 70
          }
        }
      },
      {
        rank: 3,
        name: 'Chemical Pioneer',
        mmsi: '352001420',
        imo: '9184512',
        callsign: 'HP8820',
        flag: 'Panama',
        flagCode: 'PA',
        type: 'Chemical Tanker',
        lengthM: 160,
        beamM: 26,
        draughtM: 9.8,
        destination: 'Hazira Chemical Jetty',
        overallScore: 58,
        confidence: 'Moderate',
        coordinates: { lat: 19.1200, lng: 72.0400 },
        trackHistory: [
          { timestamp: '17:00', lat: 19.1800, lng: 71.9800, speedKnots: 14.2, headingDeg: 45, navStatus: 'Underway' },
          { timestamp: '19:00', lat: 19.1000, lng: 72.0800, speedKnots: 13.9, headingDeg: 48, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 5.2,
          timeDifferenceMinutes: -60,
          trajectoryMatchPercent: 62.0,
          speedAtOriginKnots: 14.0,
          averageVoyageSpeedKnots: 14.1,
          courseAtOriginDeg: 45,
          behaviorAnomalies: [
            'Crossed northern edge of AIS search radius'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 56,
            temporalAlignment: 60,
            trajectoryCorrelation: 58,
            behavioralPenalty: 54
          }
        }
      },
      {
        rank: 4,
        name: 'Jal Vahini',
        mmsi: '419000582',
        imo: '9345671',
        callsign: 'AVTR',
        flag: 'India',
        flagCode: 'IN',
        type: 'Bulk Carrier',
        lengthM: 220,
        beamM: 32,
        draughtM: 13.2,
        destination: 'Goa Port',
        overallScore: 32,
        confidence: 'Low',
        coordinates: { lat: 18.9100, lng: 71.8500 },
        trackHistory: [
          { timestamp: '18:00', lat: 18.9300, lng: 71.8200, speedKnots: 11.2, headingDeg: 155, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 8.4,
          timeDifferenceMinutes: +150,
          trajectoryMatchPercent: 28.0,
          speedAtOriginKnots: 11.2,
          averageVoyageSpeedKnots: 11.4,
          courseAtOriginDeg: 155,
          behaviorAnomalies: [
            'Consistent course and speed, no significant kinematic anomalies'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 32,
            temporalAlignment: 35,
            trajectoryCorrelation: 30,
            behavioralPenalty: 31
          }
        }
      }
    ],
    weather: {
      seaSurfaceTempC: 28.8,
      waveHeightM: 1.45,
      visibilityNM: 9,
      weatherCondition: 'Moderate southwest monsoon chop; surface currents 1.4 kts'
    }
  },

  // 2. GULF OF MEXICO
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
      cloudCoverPercent: 82,
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
  // 3. STRAIT OF MALACCA
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
      },
      {
        rank: 2,
        name: 'MT Bintang Samudra',
        mmsi: '525001920',
        imo: '9428190',
        callsign: 'POXB',
        flag: 'Indonesia',
        flagCode: 'ID',
        type: 'Product Tanker',
        lengthM: 165,
        beamM: 28,
        draughtM: 10.2,
        destination: 'Batam Refinery',
        overallScore: 76,
        confidence: 'Moderate',
        coordinates: { lat: 2.9520, lng: 100.9350 },
        trackHistory: [
          { timestamp: '23:45', lat: 3.0200, lng: 100.8200, speedKnots: 12.1, headingDeg: 130, navStatus: 'Underway' },
          { timestamp: '00:30', lat: 2.9550, lng: 100.9300, speedKnots: 9.4, headingDeg: 132, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 1.8,
          timeDifferenceMinutes: +15,
          trajectoryMatchPercent: 79.5,
          speedAtOriginKnots: 9.4,
          averageVoyageSpeedKnots: 11.8,
          courseAtOriginDeg: 132,
          behaviorAnomalies: [
            'Speed drop from 12.1 to 9.4 kts near Strait junction',
            'Product tanker carrying high viscosity fuel oil'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: true,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 79,
            temporalAlignment: 82,
            trajectoryCorrelation: 74,
            behavioralPenalty: 69
          }
        }
      },
      {
        rank: 3,
        name: 'Ever Glory',
        mmsi: '416000280',
        imo: '9812401',
        callsign: 'BKMA',
        flag: 'Panama',
        flagCode: 'PA',
        type: 'Container Ship',
        lengthM: 366,
        beamM: 51,
        draughtM: 15.4,
        destination: 'Singapore Port',
        overallScore: 62,
        confidence: 'Moderate',
        coordinates: { lat: 2.9100, lng: 100.9800 },
        trackHistory: [
          { timestamp: '00:10', lat: 2.9600, lng: 100.9000, speedKnots: 19.2, headingDeg: 126, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 3.4,
          timeDifferenceMinutes: -25,
          trajectoryMatchPercent: 68.0,
          speedAtOriginKnots: 19.2,
          averageVoyageSpeedKnots: 19.0,
          courseAtOriginDeg: 126,
          behaviorAnomalies: [
            'Transited TSS corridor within 3.5 NM of detection zone'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 65,
            temporalAlignment: 64,
            trajectoryCorrelation: 62,
            behavioralPenalty: 57
          }
        }
      },
      {
        rank: 4,
        name: 'KM Sejahtera',
        mmsi: '525009810',
        imo: '9120892',
        callsign: 'YDSA',
        flag: 'Indonesia',
        flagCode: 'ID',
        type: 'Bulk Carrier',
        lengthM: 140,
        beamM: 22,
        draughtM: 7.8,
        destination: 'Dumai Port',
        overallScore: 35,
        confidence: 'Low',
        coordinates: { lat: 2.8700, lng: 100.8600 },
        trackHistory: [
          { timestamp: '01:00', lat: 2.8800, lng: 100.8400, speedKnots: 10.4, headingDeg: 210, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 6.8,
          timeDifferenceMinutes: +120,
          trajectoryMatchPercent: 32.0,
          speedAtOriginKnots: 10.4,
          averageVoyageSpeedKnots: 10.5,
          courseAtOriginDeg: 210,
          behaviorAnomalies: [
            'Divergent cross-strait track heading toward Sumatra coast'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 38,
            temporalAlignment: 34,
            trajectoryCorrelation: 35,
            behavioralPenalty: 33
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

  // 4. NORTH SEA (Forties Field)
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
            'Proximity within 0.9 NM of origin during condensate discharge window',
            'Tank washing protocol anomaly logged on voyage record'
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
      },
      {
        rank: 2,
        name: 'Stena Explorer',
        mmsi: '232001880',
        imo: '9321804',
        callsign: 'MBQX',
        flag: 'United Kingdom',
        flagCode: 'GB',
        type: 'Crude Oil Tanker',
        lengthM: 240,
        beamM: 42,
        draughtM: 15.1,
        destination: 'Teesport Crude Terminal',
        overallScore: 71,
        confidence: 'Moderate',
        coordinates: { lat: 57.7900, lng: 0.8400 },
        trackHistory: [
          { timestamp: '07:45', lat: 57.8100, lng: 0.8100, speedKnots: 13.4, headingDeg: 142, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 2.2,
          timeDifferenceMinutes: -35,
          trajectoryMatchPercent: 74.0,
          speedAtOriginKnots: 13.4,
          averageVoyageSpeedKnots: 13.2,
          courseAtOriginDeg: 142,
          behaviorAnomalies: [
            'Speed drop from 14.1 kts to 12.8 kts while transiting upstream'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: true,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 74,
            temporalAlignment: 72,
            trajectoryCorrelation: 70,
            behavioralPenalty: 68
          }
        }
      },
      {
        rank: 3,
        name: 'Highland Sentinel',
        mmsi: '235002190',
        imo: '9651230',
        callsign: '2BWE',
        flag: 'United Kingdom',
        flagCode: 'GB',
        type: 'Offshore Supply Vessel',
        lengthM: 82,
        beamM: 17,
        draughtM: 5.2,
        destination: 'Forties Charlie Platform',
        overallScore: 42,
        confidence: 'Low',
        coordinates: { lat: 57.7300, lng: 0.9800 },
        trackHistory: [
          { timestamp: '08:15', lat: 57.7350, lng: 0.9750, speedKnots: 3.2, headingDeg: 90, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 4.8,
          timeDifferenceMinutes: +60,
          trajectoryMatchPercent: 38.0,
          speedAtOriginKnots: 3.2,
          averageVoyageSpeedKnots: 4.0,
          courseAtOriginDeg: 90,
          behaviorAnomalies: [
            'Routine field supply run, no abnormal engine load or tank purge'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 44,
            temporalAlignment: 42,
            trajectoryCorrelation: 40,
            behavioralPenalty: 42
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
  },

  // 5. GULF OF FINLAND / BALTIC SHIPPING CHANNEL
  {
    id: 'inc-gof001',
    code: 'BALTIC-2026-GOF1',
    name: 'Baltic Sea - Gulf of Finland Shipping Channel',
    region: 'Baltic Sea / Gulf of Finland',
    seaArea: 'International TSS Fairway (Tallinn-Helsinki Sector)',
    coordinates: { lat: 59.5500, lng: 24.7500 },
    timestamp: '2026-09-08T11:30:00Z',
    status: 'ACTIVE_MONITORING',
    severity: 'HIGH',
    satellite: {
      sensor: 'SAR C-Band Synthetic Aperture Radar',
      satellite: 'Sentinel-1A (ESA)',
      instrument: 'C-SAR IW GRD',
      mode: 'Level-1 GRD High Res',
      resolution: '10m x 10m',
      polarization: 'Dual VV + VH',
      incidenceAngle: '35.2°',
      acquisitionTime: '2026-09-08T11:15:00Z',
      passDirection: 'Ascending',
      orbitNumber: '39410',
      cloudCoverPercent: 88,
    },
    characteristics: {
      areaSqKm: 12.30,
      lengthKm: 6.8,
      widthKm: 1.8,
      perimeterKm: 18.5,
      estimatedVolumeM3: 280.0,
      estimatedAgeHours: 8.0,
      confidenceScore: 95.4,
      slickType: 'Heavy Fuel Oil (Bunker C)',
      bonnCode: 'Bonn Agreement Level 3: Metallic to True Discoloration',
      darkSpotContrastRatio: -8.1,
      dampingFactor: 4.5,
      centroid: { lat: 59.5500, lng: 24.7500 },
      polygonPoints: [
        [-25, -8], [-12, -14], [8, -15], [25, -9], [35, 2],
        [32, 12], [18, 15], [-4, 12], [-20, 6]
      ],
    },
    drift: {
      predictedOrigin: { lat: 59.6200, lng: 24.6400 },
      originConfidencePercent: 92.5,
      driftConfidencePercent: 87.0,
      predicted24hDistanceNM: 19.8,
      driftDirectionDeg: 115,
      driftSpeedKnots: 1.05,
      oceanCurrentKnots: 1.2,
      oceanCurrentDirDeg: 120,
      windSpeedKnots: 14.0,
      windDirDeg: 290,
      windDriftFactorPercent: 3.0,
      estimatedArrivalArea: 'Prangli Island Coastal Marine Reserve',
      coastalImpactETA: '28 hours',
      shorelineDistanceKm: 32.0,
      timeline: [
        {
          timeOffsetHours: -8,
          label: 'T-8h (Discharge Release)',
          timestamp: '2026-09-08 03:30 UTC',
          spillCenter: { lat: 59.6200, lng: 24.6400 },
          slickRadiusKm: 0.5,
          description: 'Early morning discharge event along eastbound transit route.'
        },
        {
          timeOffsetHours: 0,
          label: 'Now (Acquisition)',
          timestamp: '2026-09-08 11:30 UTC',
          spillCenter: { lat: 59.5500, lng: 24.7500 },
          slickRadiusKm: 1.8,
          description: 'Confirmed dark patch with severe capillary wave damping.'
        }
      ]
    },
    vessels: [
      {
        rank: 1,
        name: 'EVA-318',
        mmsi: '276432000',
        imo: '9341208',
        callsign: 'ES2410',
        flag: 'Estonia',
        flagCode: 'EE',
        type: 'Product Tanker',
        lengthM: 148,
        beamM: 24,
        draughtM: 9.1,
        destination: 'Muuga Harbour',
        overallScore: 91,
        confidence: 'High',
        coordinates: { lat: 59.4577, lng: 24.7197 },
        trackHistory: [
          { timestamp: '03:10', lat: 59.6300, lng: 24.6200, speedKnots: 12.8, headingDeg: 118, navStatus: 'Underway' },
          { timestamp: '03:35', lat: 59.6180, lng: 24.6420, speedKnots: 3.6, headingDeg: 155, navStatus: 'Restricted Manoeuvrability' },
          { timestamp: '05:00', lat: 59.5400, lng: 24.7100, speedKnots: 12.5, headingDeg: 114, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 0.5,
          timeDifferenceMinutes: -8,
          trajectoryMatchPercent: 95.0,
          speedAtOriginKnots: 3.6,
          averageVoyageSpeedKnots: 12.6,
          courseAtOriginDeg: 155,
          behaviorAnomalies: [
            'Pronounced speed drop from 12.8 kts down to 3.6 kts near suspected release coordinates',
            'AIS broadcast gap: 118 minutes recorded in Gulf of Finland traffic log',
            'Track intersects Member 4 backward drift polygon zone'
          ],
          aisContinuity: 'Gap Detected (3.5h)',
          speedDropDetected: true,
          loiteringDetected: true,
          scoreBreakdown: {
            spatialProximity: 96,
            temporalAlignment: 94,
            trajectoryCorrelation: 91,
            behavioralPenalty: 83
          }
        }
      },
      {
        rank: 2,
        name: 'AXOPAR (ANDRESA)',
        mmsi: '276010780',
        imo: '9180021',
        callsign: 'ES8891',
        flag: 'Estonia',
        flagCode: 'EE',
        type: 'Offshore Supply Vessel',
        lengthM: 37,
        beamM: 9,
        draughtM: 3.2,
        destination: 'Tallinn Bay Port',
        overallScore: 68,
        confidence: 'Moderate',
        coordinates: { lat: 59.4678, lng: 24.8263 },
        trackHistory: [
          { timestamp: '03:20', lat: 59.5900, lng: 24.6800, speedKnots: 3.0, headingDeg: 28, navStatus: 'Loitering' }
        ],
        evidence: {
          distanceAtOriginNM: 2.9,
          timeDifferenceMinutes: +22,
          trajectoryMatchPercent: 71.0,
          speedAtOriginKnots: 3.0,
          averageVoyageSpeedKnots: 3.1,
          courseAtOriginDeg: 28,
          behaviorAnomalies: [
            'Continuous low speed loitering (3.0 kts) in coastal approach fairway'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: true,
          scoreBreakdown: {
            spatialProximity: 70,
            temporalAlignment: 72,
            trajectoryCorrelation: 68,
            behavioralPenalty: 62
          }
        }
      },
      {
        rank: 3,
        name: 'Baltic Star',
        mmsi: '276884120',
        imo: '9451190',
        callsign: 'OHBS',
        flag: 'Finland',
        flagCode: 'FI',
        type: 'Chemical Tanker',
        lengthM: 175,
        beamM: 28,
        draughtM: 10.4,
        destination: 'Porvoo Refinery',
        overallScore: 49,
        confidence: 'Low',
        coordinates: { lat: 59.6800, lng: 24.5800 },
        trackHistory: [
          { timestamp: '03:00', lat: 59.7100, lng: 24.5200, speedKnots: 14.1, headingDeg: 65, navStatus: 'Underway' }
        ],
        evidence: {
          distanceAtOriginNM: 5.6,
          timeDifferenceMinutes: -50,
          trajectoryMatchPercent: 52.0,
          speedAtOriginKnots: 14.1,
          averageVoyageSpeedKnots: 14.0,
          courseAtOriginDeg: 65,
          behaviorAnomalies: [
            'Constant high speed transit along northern Finnish fairway'
          ],
          aisContinuity: 'Normal',
          speedDropDetected: false,
          loiteringDetected: false,
          scoreBreakdown: {
            spatialProximity: 50,
            temporalAlignment: 52,
            trajectoryCorrelation: 48,
            behavioralPenalty: 46
          }
        }
      }
    ],
    weather: {
      seaSurfaceTempC: 15.4,
      waveHeightM: 0.9,
      visibilityNM: 10,
      weatherCondition: 'Chilly autumn breeze, westerly swell 0.9m'
    }
  }
];
