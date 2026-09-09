import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Database, PlusCircle, Edit3, 
  Trash2, AlertTriangle, CheckCircle2, Lock, FileText, 
  Users, Activity, Ship, Radio, Eye, EyeOff, Save, X, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SpillIncident, IncidentStatus, SeverityLevel, VesselAttribution, UserRole } from '../types';

export const AdminManagementPage: React.FC = () => {
  const { 
    currentUser, 
    isAdmin, 
    loginAsRole, 
    incidents, 
    activeIncident, 
    updateIncident, 
    addIncident, 
    deleteIncident, 
    updateVesselAttribution,
    classifiedIntel,
    addClassifiedIntel,
    deleteClassifiedIntel,
    users,
    updateUserRole,
    auditLogs,
    navigateTo,
    resetAllData,
  } = useApp();

  type AdminTab = 'intel' | 'incidents' | 'vessels' | 'users' | 'audit';
  const [activeTab, setActiveTab] = useState<AdminTab>('incidents');

  // Edit Incident Modal State
  const [editingIncident, setEditingIncident] = useState<SpillIncident | null>(null);
  const [editStatus, setEditStatus] = useState<IncidentStatus>('ACTIVE_MONITORING');
  const [editSeverity, setEditSeverity] = useState<SeverityLevel>('HIGH');
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState<number>(0);
  const [editVolume, setEditVolume] = useState<number>(0);
  const [editSlickType, setEditSlickType] = useState<any>('Crude Oil');
  const [editConfidence, setEditConfidence] = useState<number>(95);
  const [editCoastalETA, setEditCoastalETA] = useState('');

  // Add Incident Form State
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('Gulf of Mexico Deepwater');
  const [newSeaArea, setNewSeaArea] = useState('Northern Gulf / US EEZ');
  const [newLat, setNewLat] = useState('28.5210');
  const [newLng, setNewLng] = useState('-89.7120');
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>('HIGH');
  const [newArea, setNewArea] = useState('14.2');
  const [newVolume, setNewVolume] = useState('320.0');
  const [newSlickType, setNewSlickType] = useState<any>('Crude Oil');

  // Vessel Override State
  const [selectedIncidentForVessels, setSelectedIncidentForVessels] = useState<string>(activeIncident.id);
  const [editingVessel, setEditingVessel] = useState<{
    incidentId: string;
    vessel: VesselAttribution;
  } | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(90);
  const [overrideConfidence, setOverrideConfidence] = useState<'High' | 'Moderate' | 'Low'>('High');
  const [newPenaltyFlag, setNewPenaltyFlag] = useState('');

  // Add Classified Intel State
  const [isAddingIntel, setIsAddingIntel] = useState(false);
  const [intelTitle, setIntelTitle] = useState('');
  const [intelSource, setIntelSource] = useState('Naval SIGINT Division / Coast Guard Sector');
  const [intelSummary, setIntelSummary] = useState('');
  const [intelDetails, setIntelDetails] = useState('');
  const [intelBadge, setIntelBadge] = useState<any>('TOP SECRET // NOFORN');
  const [intelAction, setIntelAction] = useState('');
  const [intelMmsi, setIntelMmsi] = useState('');
  const [intelStatus, setIntelStatus] = useState<any>('ACTIVE_INVESTIGATION');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // If user is not admin, show restricted screen
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-slate-900 border border-amber-500/40 rounded-2xl p-8 text-center text-slate-100 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase mb-1">
          RESTRICTED ADMISSIBILITY // LEVEL 5 REQUIRED
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Administrator Command Console Restricted
        </h1>
        <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed mb-6">
          You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()} - Clearance Level {currentUser.clearanceLevel}). Data modification, classified defense intelligence, and attribution recalibration require Level-5 Administrator authorization.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              loginAsRole('admin');
              showFeedback('Elevated to Administrator credentials!');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Elevate to Administrator Role</span>
          </button>
          <button
            onClick={() => navigateTo('auth')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Return to Clearance Terminal
          </button>
        </div>
      </div>
    );
  }

  // Admin action handlers
  const handleOpenEditIncident = (inc: SpillIncident) => {
    setEditingIncident(inc);
    setEditStatus(inc.status);
    setEditSeverity(inc.severity);
    setEditName(inc.name);
    setEditArea(inc.characteristics.areaSqKm);
    setEditVolume(inc.characteristics.estimatedVolumeM3);
    setEditSlickType(inc.characteristics.slickType);
    setEditConfidence(inc.characteristics.confidenceScore);
    setEditCoastalETA(inc.drift.coastalImpactETA);
  };

  const handleSaveIncidentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;

    updateIncident(editingIncident.id, {
      name: editName,
      status: editStatus,
      severity: editSeverity,
      characteristics: {
        ...editingIncident.characteristics,
        areaSqKm: Number(editArea),
        estimatedVolumeM3: Number(editVolume),
        slickType: editSlickType,
        confidenceScore: Number(editConfidence),
      },
      drift: {
        ...editingIncident.drift,
        coastalImpactETA: editCoastalETA,
      }
    });

    setEditingIncident(null);
    showFeedback(`Successfully updated parameters for incident ${editingIncident.code}`);
  };

  const handleCreateNewIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = `inc-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCode = `MS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const latNum = parseFloat(newLat) || 28.3412;
    const lngNum = parseFloat(newLng) || -89.4187;
    const areaNum = parseFloat(newArea) || 12.5;
    const volumeNum = parseFloat(newVolume) || 250;

    const brandNewIncident: SpillIncident = {
      id: newId,
      code: newCode,
      name: newName.trim(),
      region: newRegion,
      seaArea: newSeaArea,
      coordinates: { lat: latNum, lng: lngNum },
      timestamp: new Date().toISOString(),
      status: 'ACTIVE_MONITORING',
      severity: newSeverity,
      satellite: {
        sensor: 'SAR C-Band Synthetic Aperture Radar',
        satellite: 'Sentinel-1C (ESA Copernicus)',
        instrument: 'C-SAR Interferometric Wide (IW)',
        mode: 'Level-1 Ground Range Detected (GRD)',
        resolution: '10m x 10m spatial pixel',
        polarization: 'Dual VV + VH cross-pol',
        incidenceAngle: '35.2° mid-swath',
        acquisitionTime: new Date().toISOString(),
        passDirection: 'Ascending',
        orbitNumber: '38210',
        cloudCoverPercent: 65,
      },
      characteristics: {
        areaSqKm: areaNum,
        lengthKm: Math.round(Math.sqrt(areaNum) * 2.1 * 10) / 10,
        widthKm: Math.round(Math.sqrt(areaNum) * 0.7 * 10) / 10,
        perimeterKm: Math.round(areaNum * 1.8 * 10) / 10,
        estimatedVolumeM3: volumeNum,
        estimatedAgeHours: 6.5,
        confidenceScore: 95.5,
        slickType: newSlickType,
        bonnCode: 'Bonn Agreement Level 3: Metallic Sheen to True Oil Discoloration',
        darkSpotContrastRatio: -7.2,
        dampingFactor: 4.2,
        centroid: { lat: latNum, lng: lngNum },
        polygonPoints: [
          [-20, -10], [-10, -15], [5, -12], [20, -5],
          [25, 8], [15, 16], [-5, 14], [-22, 5]
        ],
      },
      drift: {
        predictedOrigin: { lat: latNum + 0.1, lng: lngNum - 0.1 },
        originConfidencePercent: 91.0,
        driftConfidencePercent: 86.5,
        predicted24hDistanceNM: 22.4,
        driftDirectionDeg: 130,
        driftSpeedKnots: 1.1,
        oceanCurrentKnots: 1.2,
        oceanCurrentDirDeg: 140,
        windSpeedKnots: 15.0,
        windDirDeg: 310,
        windDriftFactorPercent: 3.1,
        estimatedArrivalArea: 'Breton Wildlife Margin / Outer Estuary',
        coastalImpactETA: '42 hours (T+42h)',
        shorelineDistanceKm: 58.4,
        timeline: [
          {
            timeOffsetHours: -8,
            label: 'T-8h (Suspected Release)',
            timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
            spillCenter: { lat: latNum + 0.1, lng: lngNum - 0.1 },
            slickRadiusKm: 0.6,
            description: 'Probable primary discharge based on hydrodynamic backtrack simulation.'
          },
          {
            timeOffsetHours: 0,
            label: 'Now (Acquisition)',
            timestamp: new Date().toISOString(),
            spillCenter: { lat: latNum, lng: lngNum },
            slickRadiusKm: 1.8,
            description: 'Current confirmed radar dark patch.'
          }
        ]
      },
      vessels: [
        {
          rank: 1,
          name: 'PACIFIC HORIZON',
          mmsi: '538009999',
          imo: '9481234',
          callsign: 'V7ZZ2',
          flag: 'Marshall Islands',
          flagCode: 'MH',
          type: 'Crude Oil Tanker',
          lengthM: 274,
          beamM: 48,
          draughtM: 16.2,
          destination: 'US HOUSTON',
          overallScore: 92.4,
          confidence: 'High',
          coordinates: { lat: latNum + 0.08, lng: lngNum - 0.08 },
          trackHistory: [
            {
              timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
              lat: latNum + 0.18,
              lng: lngNum - 0.18,
              speedKnots: 12.8,
              headingDeg: 145,
              navStatus: 'Underway using engine'
            },
            {
              timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
              lat: latNum + 0.08,
              lng: lngNum - 0.08,
              speedKnots: 9.1,
              headingDeg: 148,
              navStatus: 'Underway using engine'
            }
          ],
          evidence: {
            distanceAtOriginNM: 0.8,
            timeDifferenceMinutes: 18,
            trajectoryMatchPercent: 94.5,
            speedAtOriginKnots: 9.1,
            averageVoyageSpeedKnots: 13.0,
            courseAtOriginDeg: 148,
            behaviorAnomalies: [
              'Sudden speed drop from 13.2 to 9.1 knots near backtrack origin',
              'Suspicious 2.5h AIS transmission latency'
            ],
            aisContinuity: 'Intermittent',
            speedDropDetected: true,
            loiteringDetected: false,
            scoreBreakdown: {
              spatialProximity: 96,
              temporalAlignment: 94,
              trajectoryCorrelation: 92,
              behavioralPenalty: 88,
            }
          }
        }
      ],
      weather: {
        seaSurfaceTempC: 28.5,
        waveHeightM: 1.4,
        visibilityNM: 10,
        weatherCondition: 'Scattered clouds, moderate chop',
      }
    };

    addIncident(brandNewIncident);
    setIsAddingIncident(false);
    setNewName('');
    showFeedback(`New incident ${newCode} successfully created and indexed into live system!`);
  };

  const handleSaveVesselOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVessel) return;

    updateVesselAttribution(
      editingVessel.incidentId,
      editingVessel.vessel.mmsi,
      {
        overallScore: Number(overrideScore),
        confidence: overrideConfidence,
      }
    );

    setEditingVessel(null);
    showFeedback(`Attribution score for ${editingVessel.vessel.name} modified to ${overrideScore}%`);
  };

  const handleAddPenaltyTag = () => {
    if (!editingVessel || !newPenaltyFlag.trim()) return;
    const currentAnomalies = editingVessel.vessel.evidence.behaviorAnomalies || [];
    const updated = [...currentAnomalies, newPenaltyFlag.trim()];

    updateVesselAttribution(
      editingVessel.incidentId,
      editingVessel.vessel.mmsi,
      {
        evidence: {
          ...editingVessel.vessel.evidence,
          behaviorAnomalies: updated,
        }
      }
    );

    setEditingVessel({
      ...editingVessel,
      vessel: {
        ...editingVessel.vessel,
        evidence: {
          ...editingVessel.vessel.evidence,
          behaviorAnomalies: updated,
        }
      }
    });

    setNewPenaltyFlag('');
    showFeedback(`Added penalty tag: "${newPenaltyFlag.trim()}"`);
  };

  const handleRemovePenaltyTag = (tagToRemove: string) => {
    if (!editingVessel) return;
    const updated = editingVessel.vessel.evidence.behaviorAnomalies.filter(t => t !== tagToRemove);

    updateVesselAttribution(
      editingVessel.incidentId,
      editingVessel.vessel.mmsi,
      {
        evidence: {
          ...editingVessel.vessel.evidence,
          behaviorAnomalies: updated,
        }
      }
    );

    setEditingVessel({
      ...editingVessel,
      vessel: {
        ...editingVessel.vessel,
        evidence: {
          ...editingVessel.vessel.evidence,
          behaviorAnomalies: updated,
        }
      }
    });

    showFeedback(`Removed penalty tag`);
  };

  const handleCreateIntel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelTitle.trim() || !intelSummary.trim()) return;

    addClassifiedIntel({
      incidentId: activeIncident.id,
      title: intelTitle.trim(),
      source: intelSource.trim(),
      summary: intelSummary.trim(),
      details: intelDetails.trim() || intelSummary.trim(),
      classificationBadge: intelBadge,
      actionRequired: intelAction.trim(),
      flaggedVesselMmsi: intelMmsi.trim(),
      status: intelStatus,
    });

    setIsAddingIntel(false);
    setIntelTitle('');
    setIntelSummary('');
    setIntelDetails('');
    setIntelAction('');
    setIntelMmsi('');
    showFeedback('Classified intelligence dispatch logged to secure defense ledger.');
  };

  const targetIncidentForVessels = incidents.find(i => i.id === selectedIncidentForVessels) || activeIncident;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-medium text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Admin Command Header */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono text-xs mb-2.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>LEVEL 5 ADMINISTRATOR COMMAND CONSOLE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Classified Intelligence & System Management
            </h1>
            <p className="mt-1.5 text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Unrestricted supervisory console. Access covert defense SIGINT, modify incident telemetry, add new radar targets, recalibrate vessel attribution metrics, and manage personnel permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddingIncident(true)}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Spill Target</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all incidents, vessels, and intelligence back to default scenario state?')) {
                  resetAllData();
                  showFeedback('System restored to pristine baseline dataset.');
                }
              }}
              className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset to initial state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800 relative z-10">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'incidents'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Manage Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('intel')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'intel'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Classified Defense Intel ({classifiedIntel.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vessels')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'vessels'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Vessel Attribution & Sanctions</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Clearances ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MANAGE INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Spill Incident Directory & Direct Data Editor
              </h2>
              <p className="text-xs text-slate-500">
                Modify live satellite attributes, reclassify spill severity, adjust volumes, and recalibrate coastal ETAs.
              </p>
            </div>
            <button
              onClick={() => setIsAddingIncident(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Incident</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                    <th className="py-3 px-4">Code / Incident Name</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Slick Area / Vol</th>
                    <th className="py-3 px-3">Sensor</th>
                    <th className="py-3 px-3">Suspect Ships</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-600">{inc.code}</div>
                        <div className="font-semibold text-slate-900">{inc.name}</div>
                        <div className="text-[11px] text-slate-500">{inc.region}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          inc.status === 'ACTIVE_MONITORING'
                            ? 'bg-amber-100 text-amber-800'
                            : inc.status === 'CONTAINMENT_DISPATCHED'
                            ? 'bg-blue-100 text-blue-800'
                            : inc.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          inc.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : inc.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            inc.severity === 'HIGH' ? 'bg-red-500' : inc.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-800">{inc.characteristics.areaSqKm} km²</div>
                        <div className="text-[11px] text-slate-500">{inc.characteristics.estimatedVolumeM3} m³</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium truncate max-w-[140px]">{inc.satellite.satellite}</div>
                        <div className="text-[10px] font-mono text-slate-400">{inc.satellite.instrument}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {inc.vessels.length} tracked
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditIncident(inc)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition-colors"
                            title="Edit Incident Data"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {incidents.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Archive and delete incident ${inc.code}?`)) {
                                  deleteIncident(inc.id);
                                  showFeedback(`Incident ${inc.code} removed from active database.`);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Incident"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSIFIED DEFENSE INTEL */}
      {activeTab === 'intel' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Covert Naval & Law Enforcement Intelligence Vault
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 uppercase">
                  CLASSIFIED // LEVEL 5 ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                This material is strictly hidden from regular observers and standard analysts. Includes electronic warfare intercepts, dark fleet shadow tanker alerts, and seizure warrants.
              </p>
            </div>
            <button
              onClick={() => setIsAddingIntel(true)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Dispatch New Intelligence Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {classifiedIntel.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 shadow-md relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80">
                      {item.classificationBadge}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-sky-400 border border-blue-800/80">
                      STATUS: {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete classified dispatch "${item.title}"?`)) {
                          deleteClassifiedIntel(item.id);
                          showFeedback('Intelligence note purged from defense log.');
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Purge Intel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>{item.title}</span>
                </h3>

                <div className="text-xs text-slate-400 mb-3 font-mono">
                  Origin Source: <span className="text-slate-200 font-semibold">{item.source}</span>
                  {item.flaggedVesselMmsi && (
                    <> • Flagged MMSI: <span className="text-amber-400 font-bold">{item.flaggedVesselMmsi}</span></>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {item.summary}
                </p>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
                  <div className="text-slate-300 font-semibold text-[11px] uppercase tracking-wide">
                    Tactical Details:
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.details}</p>
                  {item.actionRequired && (
                    <div className="pt-2 text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Operational Directive: {item.actionRequired}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VESSEL ATTRIBUTION OVERRIDES */}
      {activeTab === 'vessels' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Suspect Vessel Attribution & Sanction Overrides
              </h2>
              <p className="text-xs text-slate-500">
                As an Administrator, you can override algorithmic vessel scores, toggle behavioral penalties, and certify legal evidence.
              </p>
            </div>

            {/* Target incident selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Incident:</span>
              <select
                value={selectedIncidentForVessels}
                onChange={(e) => setSelectedIncidentForVessels(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.code} - {inc.name.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targetIncidentForVessels.vessels.map((v) => (
              <div
                key={v.mmsi}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        Rank #{v.rank}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{v.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      MMSI: {v.mmsi} • IMO: {v.imo} • Flag: {v.flag}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-extrabold font-mono text-blue-600">
                      {v.overallScore}%
                    </div>
                    <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                      v.confidence === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {v.confidence} Confidence
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="font-semibold text-slate-700">Applied Behavioral Penalties:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {v.evidence.behaviorAnomalies && v.evidence.behaviorAnomalies.length > 0 ? (
                      v.evidence.behaviorAnomalies.map((anom, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium"
                        >
                          ⚠️ {anom}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No specific behavioral penalties registered</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400">
                    Proximity: {v.evidence.distanceAtOriginNM} NM • dT: {v.evidence.timeDifferenceMinutes}m
                  </span>
                  <button
                    onClick={() => {
                      setEditingVessel({
                        incidentId: targetIncidentForVessels.id,
                        vessel: v,
                      });
                      setOverrideScore(v.overallScore);
                      setOverrideConfidence(v.confidence);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Recalibrate / Override</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & CLEARANCES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                User Directory & Security Clearance Administration
              </h2>
              <p className="text-xs text-slate-500">
                Manage operational clearance tiers. Promote or demote accounts across Level 1 (Public), Level 3 (Analyst), and Level 5 (Admin).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                    <th className="py-3 px-4">Officer Name / Agency</th>
                    <th className="py-3 px-3">Agency Email</th>
                    <th className="py-3 px-3">Clearance Level</th>
                    <th className="py-3 px-3">Role Tier</th>
                    <th className="py-3 px-3">Badge ID</th>
                    <th className="py-3 px-4 text-right">Clearance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.title} • {u.agency}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{u.email}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.clearanceLevel === 5 ? 'bg-amber-100 text-amber-800' : u.clearanceLevel === 3 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Level {u.clearanceLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono uppercase font-bold text-slate-800">
                        {u.role}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{u.badgeNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newR = e.target.value as UserRole;
                            updateUserRole(u.id, newR);
                            showFeedback(`Updated ${u.name}'s clearance to ${newR.toUpperCase()}`);
                          }}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="admin">Promote to Admin (L5)</option>
                          <option value="analyst">Analyst (L3)</option>
                          <option value="public">Public Observer (L1)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                System Security & Modification Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all administrator edits, attribution recalibrations, and sensor retargetings.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-slate-100 font-mono text-xs shadow-inner max-h-[500px] overflow-y-auto space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400 font-bold">{log.action}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{log.userName} ({log.userRole.toUpperCase()})</span>
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed">{log.details}</p>
                  {log.targetId && (
                    <span className="text-[10px] text-slate-500">Target ID: {log.targetId}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT INCIDENT PARAMETERS */}
      {editingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Modify Incident Data: {editingIncident.code}
                </h3>
                <p className="text-xs text-slate-500">Admin Live Parameter Override</p>
              </div>
              <button
                onClick={() => setEditingIncident(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncidentEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Incident Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Operational Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE_MONITORING">ACTIVE_MONITORING</option>
                    <option value="CONTAINMENT_DISPATCHED">CONTAINMENT_DISPATCHED</option>
                    <option value="UNDER_ANALYSIS">UNDER_ANALYSIS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Severity Level
                  </label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Surface Area (km²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editArea}
                    onChange={(e) => setEditArea(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estimated Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editVolume}
                    onChange={(e) => setEditVolume(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slick Type
                  </label>
                  <select
                    value={editSlickType}
                    onChange={(e) => setEditSlickType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Crude Oil">Crude Oil</option>
                    <option value="Heavy Fuel Oil (Bunker C)">Heavy Fuel Oil (Bunker C)</option>
                    <option value="Refined Diesel/MDO">Refined Diesel/MDO</option>
                    <option value="Chemical / Condensate">Chemical / Condensate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Confidence Score (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editConfidence}
                    onChange={(e) => setEditConfidence(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Coastal Impact ETA & Horizon
                </label>
                <input
                  type="text"
                  value={editCoastalETA}
                  onChange={(e) => setEditCoastalETA(e.target.value)}
                  placeholder="e.g. 36 hours (T+36h)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIncident(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Incident Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BRAND NEW SPILL TARGET */}
      {isAddingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Provision New Spill Incident & Satellite Target
                </h3>
                <p className="text-xs text-slate-500">Administrator Direct Data Ingestion</p>
              </div>
              <button
                onClick={() => setIsAddingIncident(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Incident Title / Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Sea - Forties Field Pipeline Corridor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sea Area / Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={newSeaArea}
                    onChange={(e) => setNewSeaArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Longitude (°W)
                  </label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Area (km²)
                  </label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Est. Vol (m³)
                  </label>
                  <input
                    type="text"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hydrocarbon Classification
                </label>
                <select
                  value={newSlickType}
                  onChange={(e) => setNewSlickType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Crude Oil">Crude Oil (Heavy Viscosity)</option>
                  <option value="Heavy Fuel Oil (Bunker C)">Heavy Fuel Oil (Bunker C)</option>
                  <option value="Refined Diesel/MDO">Refined Marine Diesel Oil (MDO)</option>
                  <option value="Chemical / Condensate">Chemical / Condensate</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingIncident(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ingest & Create Incident</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECALIBRATE VESSEL ATTRIBUTION */}
      {editingVessel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Recalibrate Attribution: {editingVessel.vessel.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">MMSI: {editingVessel.vessel.mmsi}</p>
              </div>
              <button
                onClick={() => setEditingVessel(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVesselOverride} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Overall Attribution Score: <span className="text-blue-600 font-mono text-sm">{overrideScore}%</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confidence Tier
                </label>
                <select
                  value={overrideConfidence}
                  onChange={(e) => setOverrideConfidence(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="High">High Confidence</option>
                  <option value="Moderate">Moderate Confidence</option>
                  <option value="Low">Low Confidence</option>
                </select>
              </div>

              {/* Penalty Tags Management */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Behavioral Penalties & Legal Flags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editingVessel.vessel.evidence.behaviorAnomalies?.map((anom, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]"
                    >
                      <span>{anom}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePenaltyTag(anom)}
                        className="hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom penalty (e.g. Tank washing detected)"
                    value={newPenaltyFlag}
                    onChange={(e) => setNewPenaltyFlag(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPenaltyTag}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700"
                  >
                    Add Flag
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVessel(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Attribution Recalibration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH CLASSIFIED INTEL */}
      {isAddingIntel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Dispatch Classified Intelligence Note
                </h3>
                <p className="text-xs text-amber-400 font-mono">Level 5 Restricted Defense Ledger</p>
              </div>
              <button
                onClick={() => setIsAddingIntel(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Intelligence Subject / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COVERT ELINT: Electronic Warfare / GPS Jamming Detected"
                  value={intelTitle}
                  onChange={(e) => setIntelTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Classification Level
                  </label>
                  <select
                    value={intelBadge}
                    onChange={(e) => setIntelBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="TOP SECRET // NOFORN">TOP SECRET // NOFORN</option>
                    <option value="RESTRICTED // LAW ENFORCEMENT">RESTRICTED // LAW ENFORCEMENT</option>
                    <option value="CONFIDENTIAL // MARPOL">CONFIDENTIAL // MARPOL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Investigation Status
                  </label>
                  <select
                    value={intelStatus}
                    onChange={(e) => setIntelStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="ACTIVE_INVESTIGATION">ACTIVE_INVESTIGATION</option>
                    <option value="WARRANT_ISSUED">WARRANT_ISSUED</option>
                    <option value="MONITORING_ESCORT">MONITORING_ESCORT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Intelligence Source
                  </label>
                  <input
                    type="text"
                    value={intelSource}
                    onChange={(e) => setIntelSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Target Vessel MMSI (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 538009841"
                    value={intelMmsi}
                    onChange={(e) => setIntelMmsi(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Executive Intelligence Summary
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of covert findings, radar anomalies, or suspect behaviors..."
                  value={intelSummary}
                  onChange={(e) => setIntelSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Technical Details / Forensic Evidence
                </label>
                <textarea
                  rows={3}
                  placeholder="Raw radar telemetry, Doppler phase anomalies, RF interceptions..."
                  value={intelDetails}
                  onChange={(e) => setIntelDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Action Required / Coast Guard Directive
                </label>
                <input
                  type="text"
                  placeholder="e.g. Boarding party assigned with federal seizure warrant #882."
                  value={intelAction}
                  onChange={(e) => setIntelAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingIntel(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Dispatch Classified Intel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
