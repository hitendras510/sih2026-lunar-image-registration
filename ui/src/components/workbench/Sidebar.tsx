import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Target,
  Layers,
  GitMerge,
  Activity,
  Download,
  Terminal,
  Settings,
  Info,
  Moon,
  PanelLeftClose,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkbenchView } from '../../types';

interface NavItemDef {
  key: WorkbenchView;
  label: string;
  icon: React.ElementType;
}

const workspaceNav: NavItemDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'upload', label: 'Image Upload', icon: UploadCloud },
  { key: 'register', label: 'Register Images', icon: Target },
  { key: 'results', label: 'Results', icon: Layers },
  { key: 'matches', label: 'Matches', icon: GitMerge },
  { key: 'metrics', label: 'Metrics', icon: Activity },
  { key: 'exports', label: 'Exports', icon: Download },
];

const systemNav: NavItemDef[] = [
  { key: 'logs', label: 'Logs', icon: Terminal },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'about', label: 'About', icon: Info },
];

export const Sidebar: React.FC = () => {
  const { currentView, navigateTo, sidebarCollapsed, toggleSidebar, goHome } = useApp();

  return (
    <aside
      id="main-sidebar"
      className={`flex flex-col shrink-0 h-full relative ${
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      }`}
    >
      <div className="shrink-0">
        <button
          id="sidebar-toggle"
          onClick={toggleSidebar}
          className="absolute top-2.5 right-2 p-1.5 text-slate-500 hover:text-brand-400 rounded z-20 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          className="p-5 flex items-center gap-3 border-b border-[rgba(146,196,255,0.13)] logo-container group"
          title="Back to home"
        >
          <div className="logo-mark">
            <Moon className="w-4 h-4 text-brand-400" />
          </div>
          <div className="logo-text whitespace-nowrap">
            <h1 className="text-[15px] font-semibold tracking-[0.08em] text-white leading-tight">
              SELENE-MATCH
            </h1>
            <p className="font-mono text-[8px] tracking-[0.22em] text-slate-500 mt-0.5">
              MISSION CONTROL
            </p>
          </div>
        </a>
        <nav id="main-nav" className="p-3 overflow-y-auto">
          <div className="nav-section-label">Workspace</div>
          {workspaceNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <a
                key={item.key}
                href={`#/${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.key);
                }}
                className={`nav-item ${isActive ? 'nav-active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="nav-text">{item.label}</span>
              </a>
            );
          })}

          <div className="nav-section-label">System</div>
          {systemNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <a
                key={item.key}
                href={`#/${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.key);
                }}
                className={`nav-item ${isActive ? 'nav-active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="nav-text">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto">
        <div className="p-4 mx-3 mb-3 rounded-xl project-info-panel">
          <h3 className="font-mono text-[8.5px] font-medium text-slate-500 mb-3 uppercase tracking-[0.2em]">
            Mission Card
          </h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">PS ID</span>
              <span className="font-mono text-slate-200">26166</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-600">Organisation</span>
              <span className="text-slate-200">ISRO / Dept. of Space</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Team Size</span>
              <span className="text-slate-200">5 Members</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Mode</span>
              <span className="flex items-center gap-1.5 text-success font-mono text-[9.5px] tracking-wider">
                <span className="led" />
                DEMO READY
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
