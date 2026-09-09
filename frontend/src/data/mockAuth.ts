import { User, ClassifiedIntelItem, AuditLogEntry } from '../types';

export const ADMIN_CREDENTIALS = {
  email: 'pranav.naik24@spit.ac.in',
  password: 'LoveIsAllAboutGiving',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-pranav',
    email: 'pranav.naik24@spit.ac.in',
    name: 'Pranav Naik',
    role: 'admin',
    clearanceLevel: 5,
    agency: 'International Maritime Surveillance & Disaster Intelligence Command',
    title: 'Chief Maritime Security Administrator',
    badgeNumber: 'OCEANEYE-DIR-001',
    lastLogin: '2026-09-08T03:19:00Z',
  },
  {
    id: 'usr-admin-01',
    email: 'admin@oceaneye.org',
    name: 'Cmdr. Elena Vance',
    role: 'admin',
    clearanceLevel: 5,
    agency: 'US Coast Guard / International Maritime Security Command',
    title: 'Chief Maritime Surveillance Officer',
    badgeNumber: 'USCG-INTEL-8842',
    lastLogin: '2026-09-08T03:04:12Z',
  },
  {
    id: 'usr-analyst-02',
    email: 'analyst@oceaneye.org',
    name: 'Dr. Liam Chen',
    role: 'analyst',
    clearanceLevel: 3,
    agency: 'Copernicus Marine Environment Monitoring Service',
    title: 'Senior SAR & Hydrodynamics Specialist',
    badgeNumber: 'CMEMS-RES-4109',
    lastLogin: '2026-09-07T19:22:00Z',
  },
  {
    id: 'usr-public-03',
    email: 'visitor@oceaneye.org',
    name: 'Alex Rivera',
    role: 'public',
    clearanceLevel: 1,
    agency: 'Public Environmental Registry / Observer',
    title: 'Citizen Scientist / Maritime Observer',
    badgeNumber: 'PUB-OBS-1002',
    lastLogin: '2026-09-08T01:15:30Z',
  }
];

export const INITIAL_CLASSIFIED_INTEL: ClassifiedIntelItem[] = [
  {
    id: 'intel-001',
    incidentId: 'inc-0884',
    title: 'COVERT ELINT: Electronic Warfare / GPS Spoofing Intercept',
    classificationBadge: 'TOP SECRET // NOFORN',
    timestamp: '2026-09-06T03:45:10Z',
    source: 'National Reconnaissance Office (NRO) OceanSIGINT Subsystem 4',
    summary: 'Carrier crude vessel PACIFIC MARINER experienced artificial GPS altitude spikes (+400m) and switched off Class-A AIS transmitter for 3 hours 20 minutes.',
    details: 'Satellite RF interception confirmed that between 03:20 UTC and 06:40 UTC, the transponder broadcast ceased while auxiliary propulsion maintained 9.8 knots. Thermal infrared imagery captured high-temperature surface discharge plume matching heated crude tank-washing effluent.',
    actionRequired: 'USCG Sector New Orleans boarding team dispatched with federal warrant #MARPOL-2026-LA-901.',
    flaggedVesselMmsi: '538009841',
    status: 'WARRANT_ISSUED'
  },
  {
    id: 'intel-002',
    incidentId: 'inc-0884',
    title: 'INTERPOL PURPLE NOTICE: Flag-of-Convenience Dark Fleet Shadow Tanker Alert',
    classificationBadge: 'RESTRICTED // LAW ENFORCEMENT',
    timestamp: '2026-09-05T21:10:00Z',
    source: 'INTERPOL Environmental Security Sub-Directorate (ENS)',
    summary: 'Sister vessel under same single-ship shell entity previously cited for illegal bilge dumping off Straits of Malacca.',
    details: 'Ownership tracing through Marshall Islands registry identified beneficial owner sanctioned under OFAC Maritime Advisory. Vessel P&I insurance lapsed in August 2026 without renewal.',
    actionRequired: 'Flag state requested to revoke safety management certificate upon next port call.',
    flaggedVesselMmsi: '538009841',
    status: 'ACTIVE_INVESTIGATION'
  },
  {
    id: 'intel-003',
    incidentId: 'inc-0885',
    title: 'DEFENSE SATELLITE PASS: Raw X-Band Spotlight Phase Doppler Matrix',
    classificationBadge: 'TOP SECRET // NOFORN',
    timestamp: '2026-09-07T08:12:30Z',
    source: 'TerraSAR-X High-Resolution Tactical Ground Station (KIRUNA)',
    summary: 'Sub-meter 0.25m spotlight SAR verified direct slick trail emanating from port-side ballast eductor pipe.',
    details: 'Interferometric analysis yields phase coherence loss of 0.88 along the ship wake, confirming concentrated oil-emulsion layer exceeding 120 microns thickness.',
    actionRequired: 'Preserve raw SAR phase data as certified evidentiary payload for international maritime tribunal.',
    flaggedVesselMmsi: '636019882',
    status: 'MONITORING_ESCORT'
  },
  {
    id: 'intel-004',
    incidentId: 'inc-0886',
    title: 'PORT AUTHORITY WARRANT: Impoundment Directive & Seizure Notice',
    classificationBadge: 'RESTRICTED // LAW ENFORCEMENT',
    timestamp: '2026-09-07T14:30:00Z',
    source: 'St. Lawrence Seaway Management Corporation & Transport Canada',
    summary: 'Mandatory vessel hold instruction issued for upcoming lock entry.',
    details: 'Vessel fuel log inspection ordered immediately upon mooring. Oil discharge monitoring equipment (ODME) memory module extraction to be conducted under Transport Canada supervision.',
    actionRequired: 'Port State Control inspectors alerted to seize digital engine room logs and oil record book Part II.',
    flaggedVesselMmsi: '311000924',
    status: 'WARRANT_ISSUED'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-09-08T02:45:10Z',
    userId: 'usr-admin-01',
    userName: 'Cmdr. Elena Vance',
    userRole: 'admin',
    action: 'INCIDENT_SEVERITY_OVERRIDE',
    details: 'Elevated incident MS-2026-0884 from MEDIUM to HIGH severity following hydrodynamic drift proximity to Breton Wildlife Refuge.',
    targetId: 'inc-0884'
  },
  {
    id: 'audit-002',
    timestamp: '2026-09-07T22:15:00Z',
    userId: 'usr-admin-01',
    userName: 'Cmdr. Elena Vance',
    userRole: 'admin',
    action: 'VESSEL_ATTRIBUTION_PENALTY_ADDED',
    details: 'Added behavioral penalty: "AIS Transponder Tampering & 3.5h Data Gap" to PACIFIC MARINER (MMSI: 538009841). Attribution score adjusted to 94.6%.',
    targetId: '538009841'
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-07T18:30:20Z',
    userId: 'usr-analyst-02',
    userName: 'Dr. Liam Chen',
    userRole: 'analyst',
    action: 'DRIFT_MODEL_RECALCULATED',
    details: 'Updated hydrodynamic backtrack with buoy NOAA-42040 wave current vectors (+1.35 kt SE).',
    targetId: 'inc-0884'
  }
];
