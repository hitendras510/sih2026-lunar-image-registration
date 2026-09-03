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
        className={`group flex items-center gap-3 px-3 py-2.5 mx-1.5 text-xs font-semibold select-none transition-colors ${
          isActive
            ? 'bg-[#E8F1F8] text-[#1F4E79] border-l-4 border-[#1F4E79]'
            : 'text-[#555555] hover:text-[#222222] hover:bg-[#F2F4F6] border-l-4 border-transparent'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${
            isActive ? 'text-[#1F4E79]' : 'text-slate-500'
          }`}
        />

        {!sidebarCollapsed && (
          <span className="flex-1 truncate font-medium">
            {item.label}
          </span>
        )}
      </a>
    );
  };

  return (
    <aside
      id="main-sidebar"
      className={`flex flex-col shrink-0 h-full relative border-r border-[#D6D6D6] bg-white transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-[230px]'
      }`}
    >
      {/* LOGO HEADER */}
      <div className="h-[60px] shrink-0 border-b border-[#D6D6D6] flex items-center justify-between px-4 bg-[#F8F9FA]">
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); goHome(); }}
          className="flex items-center gap-2 overflow-hidden"
          title="Back to Landing Page"
        >
          <div className="w-7 h-7 rounded bg-[#1F4E79] text-white flex items-center justify-center shrink-0 font-bold text-xs">
            S
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm text-[#222222] block leading-none truncate">
                SELENE-MATCH
              </span>
              <span className="text-[10px] text-[#555555] block truncate">SIH Problem #26166</span>
            </div>
          )}
        </a>

        <button
          onClick={toggleSidebar}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* PIPELINE STATUS STRIP */}
      {!sidebarCollapsed && (
        <div className="mx-3 my-3 px-3 py-2 rounded border border-[#D6D6D6] bg-[#F8F9FA] flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isProcessing
                ? 'bg-amber-500'
                : isComplete
                ? 'bg-emerald-600'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-xs font-medium text-[#222222] flex-1 truncate">
            {isProcessing ? 'Processing Pipeline...' : isComplete ? 'Registration Complete' : 'System Ready'}
          </span>
        </div>
      )}

      {/* NAVIGATION LIST */}
      <nav className="flex-1 py-2 space-y-4 overflow-y-auto">
        <div>
          {!sidebarCollapsed && (
            <div className="px-4 mb-1.5 text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
              Workflow Steps
            </div>
          )}
          <div className="space-y-0.5">
            {workspaceNav.map(renderNavItem)}
          </div>
        </div>

        <div>
          {!sidebarCollapsed && (
            <div className="px-4 mb-1.5 text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
              System Tools
            </div>
          )}
          <div className="space-y-0.5">
            {systemNav.map(renderNavItem)}
          </div>
        </div>
      </nav>
    </aside>
  );
};
