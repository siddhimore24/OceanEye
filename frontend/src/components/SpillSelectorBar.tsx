import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, PlusCircle, ChevronDown, Ship, MapPin, 
  Layers, AlertTriangle, CheckCircle2, Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SpillIncident, VesselAttribution } from '../types';

interface SpillSelectorBarProps {
  onOpenNewSpillModal?: () => void;
  onSelectVessel?: (vessel: VesselAttribution | null) => void;
  className?: string;
}

export const SpillSelectorBar: React.FC<SpillSelectorBarProps> = ({
  onOpenNewSpillModal,
  onSelectVessel,
  className = '',
}) => {
  const { incidents, activeIncident, setActiveIncident } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (inc: SpillIncident) => {
    setActiveIncident(inc);
    if (onSelectVessel) {
      onSelectVessel(null);
    }
    setIsOpen(false);
  };

  const topSuspect = activeIncident.vessels?.[0];

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Spill Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Radar className="w-4 h-4 text-sky-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
                Active Spill Target:
              </span>
              <span className={`w-2 h-2 rounded-full ${activeIncident.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
            </div>

            {/* Dropdown Button */}
            <div ref={dropdownRef} className="relative mt-0.5">
              <button
                id="spill-selector-dropdown-btn"
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-bold text-white hover:text-sky-300 transition-colors bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-poppins"
              >
                <span className="font-mono text-sky-400 text-xs">{activeIncident.code}</span>
                <span>•</span>
                <span className="max-w-[220px] sm:max-w-[320px] truncate">{activeIncident.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 divide-y divide-slate-800/80 max-h-96 overflow-y-auto font-poppins">
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Available Spill Investigations</span>
                    <span className="text-[10px] text-sky-400 font-mono">{incidents.length} Scenes</span>
                  </div>

                  <div className="py-1">
                    {incidents.map((inc) => {
                      const isSelected = inc.id === activeIncident.id;
                      const suspectCount = inc.vessels?.length || 0;
                      const primarySuspect = inc.vessels?.[0];

                      return (
                        <button
                          key={inc.id}
                          id={`select-spill-${inc.id}`}
                          type="button"
                          onClick={() => handleSelect(inc)}
                          className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-slate-800/90 transition-colors ${
                            isSelected ? 'bg-blue-950/70 border-l-4 border-sky-400' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${inc.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200 font-mono">{inc.code}</span>
                              <span className="text-[10px] text-sky-400 font-semibold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 font-mono">
                                {inc.characteristics.areaSqKm} km²
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{inc.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                              <span>{suspectCount} candidate {suspectCount === 1 ? 'vessel' : 'vessels'}</span>
                              {primarySuspect && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400 truncate">Top: {primarySuspect.name} ({primarySuspect.overallScore}%)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add New Spill Direct Trigger in Dropdown */}
                  <div className="p-2 bg-slate-950/60">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenNewSpillModal?.();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Analyze New Spill Scene</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Overview Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-300 border-x border-slate-800 px-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeIncident.coordinates.lat.toFixed(3)}°, {activeIncident.coordinates.lng.toFixed(3)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-blue-400" />
            <span>{activeIncident.vessels?.length || 0} Ships Ranked</span>
          </div>
          {topSuspect && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Suspect #1:</span>
              <span className="text-amber-400 font-semibold">{topSuspect.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800 font-bold">
                {topSuspect.overallScore}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Analyze New Spill Button */}
        <div className="flex items-center gap-2">
          <button
            id="spill-bar-analyze-new-btn"
            type="button"
            onClick={onOpenNewSpillModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 active:translate-y-px"
          >
            <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
            <span className="font-poppins">Analyze New Spill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
