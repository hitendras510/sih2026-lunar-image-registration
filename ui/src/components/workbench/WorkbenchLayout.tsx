import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { RegisterView } from './views/RegisterView';
import { ResultsView } from './views/ResultsView';
import { MatchesView } from './views/MatchesView';
import { MetricsView } from './views/MetricsView';
import { ExportsView } from './views/ExportsView';
import { LogsView } from './views/LogsView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';

export const WorkbenchLayout: React.FC = () => {
  const { currentView } = useApp();

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'upload':
        return <UploadView />;
      case 'register':
        return <RegisterView />;
      case 'results':
        return <ResultsView />;
      case 'matches':
        return <MatchesView />;
      case 'metrics':
        return <MetricsView />;
      case 'exports':
        return <ExportsView />;
      case 'logs':
        return <LogsView />;
      case 'settings':
        return <SettingsView />;
      case 'about':
        return <AboutView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="view-app" className="h-screen w-full flex overflow-hidden text-sm app-open">
      <div className="bg-nebula" />
      <Sidebar />
      <main id="app-main" className="flex-1 min-w-0 flex flex-col h-full">
        <Header />
        <div className="flex-1 overflow-y-auto p-6">{renderActiveView()}</div>
        <Footer />
      </main>
    </div>
  );
};
