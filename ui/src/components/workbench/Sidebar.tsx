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
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkbenchView } from '../../types';

interface NavItemDef {
  key: WorkbenchView;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const workspaceNav: NavItemDef[] = [
  { key: 'dashboard',  label: 'Overview',        icon: LayoutDashboard },
  { key: 'upload',     label: '1. Image Pair',   icon: UploadCloud },
  { key: 'register',   label: '2. Registration', icon: Target },
  { key: 'matches',    label: '3. Match Vectors', icon: GitMerge },
  { key: 'results',    label: '4. Visual Split',  icon: Layers },
  { key: 'metrics',    label: '5. Metrics',      icon: Activity },
  { key: 'exports',    label: '6. Exports',      icon: Download },
];

const systemNav: NavItemDef[] = [
  { key: 'logs',     label: 'Logs Feed', icon: Terminal },
  { key: 'settings', label: 'Settings',  icon: Settings },
  { key: 'about',    label: 'About Suite', icon: Info },
];

export const Sidebar: React.FC = () => {
  const { currentView, navigateTo, sidebarCollapsed, toggleSidebar, goHome, isComplete, isProcessing } = useApp();

  const renderNavItem = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = currentView === item.key;

    return (
      <a
        key={item.key}
        href={`#/${item.key}`}
        onClick={(e) => { e.preventDefault(); navigateTo(item.key); }}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-xs font-semibold transition-all select-none ${
          isActive
            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
          }`}
        />

        {!sidebarCollapsed && (
          <span className="flex-1 truncate tracking-tight font-medium">
            {item.label}
          </span>
        )}

        {isActive && !sidebarCollapsed && (
          <ChevronRight className="w-3.5 h-3.5 text-sky-400/70 shrink-0" />
        )}
      </a>
    );
  };

  return (
    <aside
      id="main-sidebar"
      className={`flex flex-col shrink-0 h-full relative border-r border-slate-800 bg-slate-950 transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* ── LOGO HEADER ── */}
      <div className="h-14 shrink-0 border-b border-slate-800 flex items-center justify-between px-4">
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); goHome(); }}
          className="flex items-center gap-2.5 group overflow-hidden"
          title="Back to Landing Page"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
            <Moon className="w-4 h-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-white block leading-none truncate">
                SELENE<span className="text-sky-400">·</span>MATCH
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block truncate">ISRO Workbench</span>
            </div>
          )}
        </a>

        <button
          onClick={toggleSidebar}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* ── PIPELINE STATUS STRIP ── */}
      {!sidebarCollapsed && (
        <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isProcessing
                ? 'bg-amber-400 animate-pulse'
                : isComplete
                ? 'bg-emerald-400'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-300 flex-1 truncate">
            {isProcessing ? 'Pipeline Running' : isComplete ? 'Registration Complete' : 'Awaiting Input'}
          </span>
        </div>
      )}

      {/* ── NAVIGATION LIST ── */}
      <nav className="flex-1 py-2 space-y-4 overflow-y-auto">
        <div>
          {!sidebarCollapsed && (
            <div className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Workflow Steps
            </div>
          )}
          <div className="space-y-1">
            {workspaceNav.map(renderNavItem)}
          </div>
        </div>

        <div>
          {!sidebarCollapsed && (
            <div className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              System & Tools
            </div>
          )}
          <div className="space-y-1">
            {systemNav.map(renderNavItem)}
          </div>
        </div>
      </nav>

      {/* ── FOOTER CARD ── */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>ISRO SIH Problem</span>
            <span className="font-semibold text-sky-400">#26166</span>
          </div>
        </div>
      )}
    </aside>
  );
};
