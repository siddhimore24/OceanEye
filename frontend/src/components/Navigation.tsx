import React, { useState } from 'react';
import { 
  Waves, Radar, Activity, Compass, Ship, 
  FileText, PlusCircle, ChevronDown, Menu, X, Satellite, CheckCircle2,
  ShieldAlert, ShieldCheck, KeyRound, Lock, User as UserIcon, LogIn
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageId, SpillIncident } from '../types';
import { useApp } from '../context/AppContext';
import oceanEyeLogo from '../assets/images/ocean_eye_logo_1788876296898.jpg';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  activeIncident: SpillIncident;
  incidents: SpillIncident[];
  onSelectIncident: (incident: SpillIncident) => void;
  onOpenNewSpillModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  activeIncident,
  incidents,
  onSelectIncident,
  onOpenNewSpillModal,
}) => {
  const { currentUser, isAdmin } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isIncidentDropdownOpen, setIsIncidentDropdownOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: React.FC<{ className?: string }>; isAdminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'detection', label: 'Spill Detection', icon: Satellite },
    { id: 'analysis', label: 'Spill Analysis', icon: Radar },
    { id: 'drift', label: 'Drift Prediction', icon: Compass },
    { id: 'ais', label: 'AIS Intelligence', icon: Waves },
    { id: 'attribution', label: 'Vessel Attribution', icon: Ship },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin Console', icon: ShieldAlert, isAdminOnly: true },
    { id: 'login', label: 'Login', icon: LogIn },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-sm text-slate-100">
      {/* Top operational banner bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-[11px] font-poppins flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-poppins">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL WATCH ACTIVE
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300 font-poppins">
            OFFICER: <strong className="text-white font-semibold">{currentUser.name}</strong> ({currentUser.role.toUpperCase()} • L{currentUser.clearanceLevel})
          </span>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="hidden lg:inline text-slate-400 font-poppins">
            {isAdmin ? 'CLEARANCE: LEVEL-5 TOP SECRET (UNRESTRICTED)' : 'CLEARANCE: PARTITIONED PUBLIC/ANALYST'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('login')}
            className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 font-semibold font-poppins"
          >
            <KeyRound className="w-3 h-3" />
            <span>Login / Access Terminal</span>
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-poppins">UTC {new Date().toISOString().slice(11, 19)}Z</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold text-[10px] font-poppins">
            v3.4.2
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          <button 
            id="nav-brand-logo-btn"
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-3 text-left group focus:outline-none font-poppins"
          >
            <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-sky-400/50 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:border-sky-300 group-hover:shadow-sky-400/30 transition-all overflow-hidden shrink-0">
              <img 
                src={oceanEyeLogo} 
                alt="OceanEye Logo" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/ocean-eye-logo.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wide text-white font-poppins">
                  OCEANEYE
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-sky-900/60 border border-sky-600/40 text-sky-300 font-poppins font-semibold">
                  INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide font-poppins">
                Surveillance & Vessel Attribution
              </p>
            </div>
          </button>

          {/* Active Incident Selector Dropdown */}
          <div className="relative hidden md:block ml-4 pl-4 border-l border-slate-800">
            <button
              id="active-incident-selector-btn"
              onClick={() => setIsIncidentDropdownOpen(!isIncidentDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors font-poppins"
            >
              <span className="text-slate-400">Incident:</span>
              <span className="font-semibold text-white max-w-[180px] truncate">{activeIncident.code}</span>
              <span className={`w-2 h-2 rounded-full ${activeIncident.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isIncidentDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Monitored Spill Incidents
                </div>
                {incidents.map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => {
                      onSelectIncident(inc);
                      setIsIncidentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-800/90 transition-colors ${
                      inc.id === activeIncident.id ? 'bg-blue-950/60 border-l-2 border-sky-400' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${inc.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 font-mono">{inc.code}</span>
                        <span className="text-[10px] text-slate-400">{inc.characteristics.areaSqKm} km²</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{inc.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary CTA & User Profile Controls */}
        <div className="flex items-center gap-2.5">
          {/* User Role Badge / Authentication Terminal Button */}
          <button
            id="nav-user-clearance-btn"
            onClick={() => onNavigate('login')}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-poppins font-semibold ${
              currentUser.role === 'admin'
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                : currentUser.role === 'analyst'
                ? 'bg-sky-950/50 border-sky-500/50 text-sky-300 hover:bg-sky-900/60'
                : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
            }`}
            title="Click to manage clearance or switch roles"
          >
            {currentUser.role === 'admin' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span className="uppercase">{currentUser.role} (L{currentUser.clearanceLevel})</span>
          </button>

          <button
            id="nav-analyze-new-spill-btn"
            onClick={onOpenNewSpillModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs font-poppins transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 active:translate-y-px"
          >
            <PlusCircle className="w-4 h-4 text-sky-200" />
            <span className="whitespace-nowrap">Analyze New Spill</span>
          </button>

          {/* Mobile menu toggle button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-poppins"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Header Options Navigation Section - Displays all options in header section */}
      <div id="header-options-section" className="border-t border-slate-800/90 bg-slate-900/95 px-3 sm:px-6 py-1.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-1.5 min-w-max">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold font-poppins transition-all duration-150 flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-sky-300 bg-blue-950/80 border border-sky-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap font-poppins">{item.label}</span>
                {item.isAdminOnly && !isAdmin && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 border border-amber-600/40 text-amber-400 font-poppins font-semibold">
                    ADMIN
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-1.5 left-2 right-2 h-0.5 bg-sky-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile navigation menu drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {/* Mobile User Clearance Status */}
          <div className="p-3 mb-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin' ? 'bg-amber-400' : currentUser.role === 'analyst' ? 'bg-sky-400' : 'bg-emerald-400'
              }`} />
              <span className="text-white font-bold">{currentUser.name}</span>
              <span className="text-[10px] font-mono text-slate-400">({currentUser.role.toUpperCase()})</span>
            </div>
            <button
              onClick={() => {
                onNavigate('login');
                setIsMobileMenuOpen(false);
              }}
              className="text-[11px] font-mono text-sky-400 hover:underline"
            >
              Login Terminal
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
            Navigation Modules
          </div>
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-900/60 text-sky-400 border border-blue-700/50' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 mt-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
              Active Incident
            </div>
            {incidents.map(inc => (
              <button
                key={inc.id}
                onClick={() => {
                  onSelectIncident(inc);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between ${
                  inc.id === activeIncident.id ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <span className="truncate">{inc.name}</span>
                {inc.id === activeIncident.id && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
