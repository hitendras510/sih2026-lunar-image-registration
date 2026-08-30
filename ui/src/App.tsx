import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { StarfieldCanvas } from './components/common/StarfieldCanvas';
import { BootPreloader } from './components/common/BootPreloader';
import { ToastContainer } from './components/common/ToastContainer';
import { AiAssistant } from './components/common/AiAssistant';
import { LandingPage } from './components/landing/LandingPage';
import { WorkbenchLayout } from './components/workbench/WorkbenchLayout';

const AppContent: React.FC = () => {
  const { isAppMode } = useApp();

  return (
    <>
      <BootPreloader />
      <StarfieldCanvas />
      <div className="nebula" />
      <div className="grid-overlay" />
      <div className="noise" />
      <div id="scroll-progress" />

      {isAppMode ? <WorkbenchLayout /> : <LandingPage />}

      <ToastContainer />
      <AiAssistant />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
