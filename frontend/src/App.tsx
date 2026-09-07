import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, SpillIncident, VesselAttribution } from './types';
import { MOCK_INCIDENTS } from './data/mockIncidents';
import { Navigation } from './components/Navigation';
import { NewSpillModal } from './components/NewSpillModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { SpillDetectionPage } from './pages/SpillDetectionPage';
import { SpillAnalysisPage } from './pages/SpillAnalysisPage';
import { DriftPredictionPage } from './pages/DriftPredictionPage';
import { AisIntelligencePage } from './pages/AisIntelligencePage';
import { VesselAttributionPage } from './pages/VesselAttributionPage';
import { ReportsPage } from './pages/ReportsPage';

export default function App() {
  const [incidents, setIncidents] = useState<SpillIncident[]>(MOCK_INCIDENTS);
  const [activeIncident, setActiveIncident] = useState<SpillIncident>(MOCK_INCIDENTS[0]);
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [selectedVessel, setSelectedVessel] = useState<VesselAttribution | null>(null);
  const [isNewSpillModalOpen, setIsNewSpillModalOpen] = useState<boolean>(false);

  const handleSelectIncident = (incident: SpillIncident) => {
    setActiveIncident(incident);
    setSelectedVessel(null);
  };

  const handleSpillAnalyzed = (newIncident: SpillIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    setActiveIncident(newIncident);
    setSelectedVessel(null);
    setCurrentPage('detection');
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        activeIncident={activeIncident}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
        onOpenNewSpillModal={() => setIsNewSpillModalOpen(true)}
      />

      {/* Main Content Area with Page Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
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
                onNavigate={handleNavigate}
                onOpenNewSpillModal={() => setIsNewSpillModalOpen(true)}
                onSelectVessel={setSelectedVessel}
              />
            )}

            {currentPage === 'detection' && (
              <SpillDetectionPage
                incident={activeIncident}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'analysis' && (
              <SpillAnalysisPage
                incident={activeIncident}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'drift' && (
              <DriftPredictionPage
                incident={activeIncident}
                onNavigate={handleNavigate}
                onSelectVessel={setSelectedVessel}
              />
            )}

            {currentPage === 'ais' && (
              <AisIntelligencePage
                incident={activeIncident}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'attribution' && (
              <VesselAttributionPage
                incident={activeIncident}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage
                incident={activeIncident}
                onNavigate={handleNavigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent System Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-semibold">Marine Oil Spill Intelligence Platform</span>
            <span className="text-slate-600">|</span>
            <span>Sensor Feeds: ESA Copernicus Sentinel-1C • TerraSAR-X • Class-A AIS Stream</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button 
              onClick={() => handleNavigate('overview')}
              className="hover:text-sky-400 transition-colors"
            >
              Overview
            </button>
            <button 
              onClick={() => handleNavigate('detection')}
              className="hover:text-sky-400 transition-colors"
            >
              Spill Detection
            </button>
            <button 
              onClick={() => handleNavigate('drift')}
              className="hover:text-sky-400 transition-colors"
            >
              Drift Model
            </button>
            <button 
              onClick={() => handleNavigate('attribution')}
              className="hover:text-sky-400 transition-colors"
            >
              Vessel Attribution
            </button>
            <button 
              onClick={() => handleNavigate('reports')}
              className="hover:text-sky-400 transition-colors"
            >
              Dossier
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">ISO 14001 / IMO MARPOL ANNEX I COMPLIANT</span>
          </div>
        </div>
      </footer>

      {/* New Spill Analysis Wizard Modal */}
      <NewSpillModal
        isOpen={isNewSpillModalOpen}
        onClose={() => setIsNewSpillModalOpen(false)}
        onSpillAnalyzed={handleSpillAnalyzed}
      />
    </div>
  );
}
