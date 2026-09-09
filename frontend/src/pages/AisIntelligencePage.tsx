import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Waves, Ship, Search, Filter, AlertTriangle, 
  Clock, Compass, ArrowUpDown, ChevronRight, Eye, CheckCircle2, ArrowRight,
  RotateCcw, Loader2, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle,
  Gauge, X
} from 'lucide-react';
import { SpillIncident, PageId, VesselAttribution } from '../types';
import { OceanMap } from '../components/OceanMap';
import { interrogateAis, AisQueryParams } from '../services/apiService';

interface AisIntelligencePageProps {
  incident: SpillIncident;
  selectedVessel: VesselAttribution | null;
  onSelectVessel: (vessel: VesselAttribution | null) => void;
  onNavigate: (page: PageId) => void;
}

export const AisIntelligencePage: React.FC<AisIntelligencePageProps> = ({
  incident,
  selectedVessel,
  onSelectVessel,
  onNavigate,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [maxDistanceNM, setMaxDistanceNM] = useState<number>(30);
  const [minDistanceNM, setMinDistanceNM] = useState<string>('');
  const [minSog, setMinSog] = useState<string>('');
  const [maxSog, setMaxSog] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [timeWindowHours, setTimeWindowHours] = useState<number>(18);
  const [onlyAnomalies, setOnlyAnomalies] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Pagination & Results State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [vessels, setVessels] = useState<VesselAttribution[]>(incident?.vessels || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  /**
   * Dispatches search / interrogation to the backend AIS service
   */
  const executeSearch = useCallback(async (targetPage = 1) => {
    // 1. Client-side input validation
    if (minSog !== '' && maxSog !== '') {
      const numMinSog = parseFloat(minSog);
      const numMaxSog = parseFloat(maxSog);
      if (!isNaN(numMinSog) && !isNaN(numMaxSog) && numMinSog > numMaxSog) {
        setValidationError('Minimum SOG cannot be greater than Maximum SOG');
        return;
      }
    }

    if (minDistanceNM !== '') {
      const numMinDist = parseFloat(minDistanceNM);
      if (!isNaN(numMinDist) && numMinDist > maxDistanceNM) {
        setValidationError('Minimum distance cannot be greater than Maximum distance');
        return;
      }
    }

    if (minScore !== '' && maxScore !== '') {
      const numMinScore = parseFloat(minScore);
      const numMaxScore = parseFloat(maxScore);
      if (!isNaN(numMinScore) && !isNaN(numMaxScore) && numMinScore > numMaxScore) {
        setValidationError('Minimum score cannot be greater than Maximum score');
        return;
      }
    }

    setValidationError(null);
    setIsLoading(true);

    const params: AisQueryParams = {
      query: searchQuery.trim() || undefined,
      shipType: selectedType !== 'ALL' ? selectedType : undefined,
      maxDistanceNM: maxDistanceNM,
      minDistanceNM: minDistanceNM !== '' ? parseFloat(minDistanceNM) : undefined,
      minSog: minSog !== '' ? parseFloat(minSog) : undefined,
      maxSog: maxSog !== '' ? parseFloat(maxSog) : undefined,
      minScore: minScore !== '' ? parseFloat(minScore) : undefined,
      maxScore: maxScore !== '' ? parseFloat(maxScore) : undefined,
      timeWindowHours: timeWindowHours,
      onlyAnomalies: onlyAnomalies,
      incidentId: incident?.id,
      page: targetPage,
      pageSize: pageSize,
    };

    try {
      const response = await interrogateAis(params, incident?.vessels);

      if (response.success) {
        setVessels(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.totalPages || 1);
        setPage(targetPage);
        setHasSearched(true);
        setValidationError(null);

        // If currently selected vessel is no longer in search results, deselect it
        if (selectedVessel && !response.data.some((v) => v.mmsi === selectedVessel.mmsi)) {
          onSelectVessel(null);
        }
      } else {
        setVessels([]);
        setTotalCount(0);
        setTotalPages(1);
        setValidationError(response.error || 'Failed to retrieve AIS records matching your criteria');
      }
    } catch (err: any) {
      setValidationError('Error connecting to AIS interrogation service');
      setVessels([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery, selectedType, maxDistanceNM, minDistanceNM, 
    minSog, maxSog, minScore, maxScore, timeWindowHours, 
    onlyAnomalies, incident, pageSize, selectedVessel, onSelectVessel
  ]);

  // Load initial AIS dataset on mount or when incident changes
  useEffect(() => {
    executeSearch(1);
  }, [incident?.id]);

  /**
   * Resets all search parameters to initial defaults
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setMaxDistanceNM(30);
    setMinDistanceNM('');
    setMinSog('');
    setMaxSog('');
    setMinScore('');
    setMaxScore('');
    setTimeWindowHours(18);
    setOnlyAnomalies(false);
    setValidationError(null);
    setPage(1);

    // Re-fetch default dataset
    setIsLoading(true);
    interrogateAis({ incidentId: incident?.id, maxDistanceNM: 30, timeWindowHours: 18, page: 1, pageSize: 25 }, incident?.vessels)
      .then((res) => {
        if (res.success) {
          setVessels(res.data);
          setTotalCount(res.total);
          setTotalPages(res.totalPages);
          setHasSearched(false);
        }
      })
      .finally(() => setIsLoading(false));
  };

  /**
   * Map receives the dynamic filtered incident so map markers strictly reflect query results
   */
  const displayIncident = useMemo(() => {
    return {
      ...incident,
      vessels: vessels,
    };
  }, [incident, vessels]);

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AIS Maritime Traffic & Spatiotemporal Interrogator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              AIS CORRELATOR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing commercial vessel trajectories, kinematic anomalies, and speed profiles around suspected spill origin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('attribution')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <span>Proceed to Vessel Attribution</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AIS Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>AIS Interrogation Parameters</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="ais-toggle-advanced-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-500 hover:text-red-800 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Search Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* MMSI / Vessel Name Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              id="ais-search-input"
              type="text"
              placeholder="Search MMSI, Name, Callsign, Flag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch(1);
                }
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vessel Type Filter */}
          <div>
            <select
              id="ais-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            >
              <option value="ALL">All Vessel Types</option>
              <option value="Crude Oil Tanker">Crude Oil Tanker</option>
              <option value="Product Tanker">Product Tanker</option>
              <option value="Bulk Carrier">Bulk Carrier</option>
              <option value="Container Ship">Container Ship</option>
              <option value="Offshore Supply Vessel">Offshore Supply Vessel</option>
            </select>
          </div>

          {/* Search Radius Slider */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 whitespace-nowrap font-semibold">Radius:</span>
            <input 
              id="ais-radius-slider"
              type="range"
              min="5"
              max="50"
              step="1"
              value={maxDistanceNM}
              onChange={(e) => setMaxDistanceNM(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-xs text-blue-600 w-12 text-right">{maxDistanceNM}NM</span>
          </div>

          {/* Time Window Selector */}
          <div>
            <select
              id="ais-timewindow-select"
              value={timeWindowHours}
              onChange={(e) => setTimeWindowHours(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            >
              <option value={6}>Window: ±6 Hours</option>
              <option value={12}>Window: ±12 Hours</option>
              <option value={18}>Window: ±18 Hours</option>
              <option value={24}>Window: ±24 Hours</option>
            </select>
          </div>

          {/* Action Buttons: Search & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="ais-search-submit-btn"
              disabled={isLoading}
              onClick={() => executeSearch(1)}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="ais-reset-filters-btn"
              disabled={isLoading}
              onClick={handleResetFilters}
              title="Reset all filters to default"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Drawer (Speed, Min Dist, Scores, Anomalies) */}
        {showAdvanced && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span>Numeric Thresholds & Anomaly Correlators</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Speed Over Ground (SOG) Range */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Speed Over Ground (kts)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="ais-minsog-input"
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    placeholder="Min kts"
                    value={minSog}
                    onChange={(e) => setMinSog(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    id="ais-maxsog-input"
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    placeholder="Max kts"
                    value={maxSog}
                    onChange={(e) => setMaxSog(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Min Distance to Source (NM) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Min Distance (NM)
                </label>
                <input
                  id="ais-mindist-input"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="e.g. 2.0"
                  value={minDistanceNM}
                  onChange={(e) => setMinDistanceNM(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Attribution Score Range (%) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Attribution Score (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="ais-minscore-input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Min %"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    id="ais-maxscore-input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Max %"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Anomaly Checkbox */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors">
                  <input 
                    id="ais-anomalies-checkbox"
                    type="checkbox"
                    checked={onlyAnomalies}
                    onChange={(e) => setOnlyAnomalies(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-red-600">Only Anomaly Flags</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main AIS Map Viewport (Primary Visual Focus) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">AIS Vessel Track Corroboration Around Spill Origin</h2>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Showing <strong className="text-blue-600 font-bold">{vessels.length}</strong> of <strong className="text-slate-800">{totalCount}</strong> correlated vessels
          </div>
        </div>

        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-300">
          <OceanMap
            incident={displayIncident}
            selectedVessel={selectedVessel}
            onSelectVessel={onSelectVessel}
            showControls={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* AIS Vessel Telemetry Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Correlated Vessel Telemetry & AIS Kinematics
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              {totalCount > 0 ? `Displaying ${vessels.length} records (Page ${page} of ${totalPages})` : '0 records found'}
            </span>
          </div>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Interrogating AIS spatiotemporal database...</p>
          </div>
        ) : vessels.length === 0 ? (
          /* Empty State */
          <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-300 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
              <Ship className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No vessels found.</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No vessels matched your query. Try loosening speed or distance thresholds, checking for typos in the MMSI, or resetting all filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-xs"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          /* Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Vessel / Flag</th>
                  <th className="py-2.5 px-3">MMSI / IMO</th>
                  <th className="py-2.5 px-3">Ship Type</th>
                  <th className="py-2.5 px-3">Origin Distance</th>
                  <th className="py-2.5 px-3">Time Delta</th>
                  <th className="py-2.5 px-3">Speed at Origin</th>
                  <th className="py-2.5 px-3">Behavioral Anomaly</th>
                  <th className="py-2.5 px-3 text-right">Attribution</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {vessels.map((v) => {
                  const isSelected = selectedVessel?.mmsi === v.mmsi;
                  return (
                    <tr 
                      key={v.mmsi}
                      onClick={() => onSelectVessel(v)}
                      className={`hover:bg-blue-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Ship className={`w-3.5 h-3.5 ${v.rank === 1 ? 'text-red-500' : 'text-blue-600'}`} />
                          <span>{v.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{v.flag} ({v.flagCode})</span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-bold text-slate-800">{v.mmsi}</div>
                        <div className="text-[10px] text-slate-400">IMO {v.imo}</div>
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-700">
                        {v.type}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900">
                        {v.evidence.distanceAtOriginNM} NM
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {v.evidence.timeDifferenceMinutes > 0 ? `+${v.evidence.timeDifferenceMinutes}m` : `${v.evidence.timeDifferenceMinutes}m`}
                      </td>

                      <td className="py-3 px-3">
                        <span className={v.evidence.speedDropDetected ? 'text-red-600 font-bold' : 'text-slate-700'}>
                          {v.evidence.speedAtOriginKnots} kts
                        </span>
                        <span className="text-[10px] text-slate-400 block">(Avg: {v.evidence.averageVoyageSpeedKnots} kts)</span>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        {v.evidence.behaviorAnomalies && v.evidence.behaviorAnomalies.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[200px]">{v.evidence.behaviorAnomalies[0]}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal Passage</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-1 rounded font-bold text-xs ${
                          v.rank === 1 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {v.overallScore}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVessel(v);
                            onNavigate('attribution');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-sans font-semibold transition-colors cursor-pointer"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} vessels)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => executeSearch(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => executeSearch(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
