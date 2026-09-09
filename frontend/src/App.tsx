import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, SpillIncident, VesselAttribution } from './types';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { NewSpillModal } from './components/NewSpillModal';
import { SpillSelectorBar } from './components/SpillSelectorBar';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { SpillDetectionPage } from './pages/SpillDetectionPage';
import { SpillAnalysisPage } from './pages/SpillAnalysisPage';
import { DriftPredictionPage } from './pages/DriftPredictionPage';
import { AisIntelligencePage } from './pages/AisIntelligencePage';
import { VesselAttributionPage } from './pages/VesselAttributionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthPage } from './pages/AuthPage';
import { AdminManagementPage } from './pages/AdminManagementPage';

function AppInner() {
  const { 
    incidents, 
    activeIncident, 
    setActiveIncident, 
    addIncident, 
    currentPage, 
    navigateTo, 
    currentUser, 
    isAdmin 
  } = useApp();

  const [selectedVessel, setSelectedVessel] = useState<VesselAttribution | null>(null);
  const [isNewSpillModalOpen, setIsNewSpillModalOpen] = useState<boolean>(false);
  const [newSpillSessionId, setNewSpillSessionId] = useState<number>(1);

  // Automatically reset selected vessel when incident changes so new spill suspect is highlighted
  useEffect(() => {
    setSelectedVessel(null);
  }, [activeIncident.id]);

  const handleSelectIncident = (incident: SpillIncident) => {
    setActiveIncident(incident);
    setSelectedVessel(null);
  };

  const handleOpenNewSpillModal = () => {
    setNewSpillSessionId(prev => prev + 1);
    setIsNewSpillModalOpen(true);
  };

  const handleSpillAnalyzed = (newIncident: SpillIncident) => {
    addIncident(newIncident);
    setSelectedVessel(null);
    navigateTo('attribution');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navigation
        currentPage={currentPage}
        onNavigate={navigateTo}
        activeIncident={activeIncident}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
        onOpenNewSpillModal={handleOpenNewSpillModal}
      />

      {/* Persistent Incident Context & Quick Spill Switcher Bar (displayed across all intelligence pages) */}
      {!['auth', 'login', 'admin'].includes(currentPage) && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <SpillSelectorBar
            onOpenNewSpillModal={handleOpenNewSpillModal}
            onSelectVessel={setSelectedVessel}
          />
        </div>
      )}

      {/* Main Content Area with Page Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 font-poppins">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${activeIncident.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {currentPage === 'overview' && (
              <OverviewPage
                incident={activeIncident}
                incidents={incidents}
                onNavigate={navigateTo}
                onOpenNewSpillModal={handleOpenNewSpillModal}
                onSelectVessel={setSelectedVessel}
              />
            )}

            {currentPage === 'detection' && (
              <SpillDetectionPage
                incident={activeIncident}
                onNavigate={navigateTo}
              />
            )}

            {currentPage === 'analysis' && (
              <SpillAnalysisPage
                incident={activeIncident}
                onNavigate={navigateTo}
              />
            )}

            {currentPage === 'drift' && (
              <DriftPredictionPage
                incident={activeIncident}
                onNavigate={navigateTo}
                onSelectVessel={setSelectedVessel}
              />
            )}

            {currentPage === 'ais' && (
              <AisIntelligencePage
                incident={activeIncident}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
                onNavigate={navigateTo}
              />
            )}

            {currentPage === 'attribution' && (
              <VesselAttributionPage
                incident={activeIncident}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
                onNavigate={navigateTo}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage
                incident={activeIncident}
                onNavigate={navigateTo}
              />
            )}

            {(currentPage === 'auth' || currentPage === 'login') && (
              <AuthPage />
            )}

            {currentPage === 'admin' && (
              <AdminManagementPage />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent System Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-semibold">OCEANEYE Intelligence Platform</span>
            <span className="text-slate-600">|</span>
            <span>Operator: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button 
              onClick={() => navigateTo('overview')}
              className="hover:text-sky-400 transition-colors"
            >
              Overview
            </button>
            <button 
              onClick={() => navigateTo('detection')}
              className="hover:text-sky-400 transition-colors"
            >
              Spill Detection
            </button>
            <button 
              onClick={() => navigateTo('drift')}
              className="hover:text-sky-400 transition-colors"
            >
              Drift Model
            </button>
            <button 
              onClick={() => navigateTo('attribution')}
              className="hover:text-sky-400 transition-colors"
            >
              Vessel Attribution
            </button>
            <button 
              onClick={() => navigateTo('reports')}
              className="hover:text-sky-400 transition-colors"
            >
              Dossier
            </button>
            <button 
              onClick={() => navigateTo('auth')}
              className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Auth Terminal
            </button>
            {isAdmin && (
              <button 
                onClick={() => navigateTo('admin')}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1"
              >
                <span>Admin Console</span>
              </button>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">IMO MARPOL ANNEX I COMPLIANT</span>
          </div>
        </div>
      </footer>

      {/* New Spill Analysis Wizard Modal */}
      <NewSpillModal
        key={newSpillSessionId}
        isOpen={isNewSpillModalOpen}
        onClose={() => setIsNewSpillModalOpen(false)}
        onSpillAnalyzed={handleSpillAnalyzed}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
