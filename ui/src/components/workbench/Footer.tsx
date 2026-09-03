import React from 'react';
import { useApp } from '../../context/AppContext';
import { seleneApi } from '../../services/api';
import { Zap, Triangle, Layers, GitMerge } from 'lucide-react';

export const Footer: React.FC = () => {
  const { results, selectedMatcher, sourceSensor, isComplete, isProcessing } = useApp();

  const matcherKey = seleneApi.resolveMatcher(selectedMatcher, sourceSensor);
  const matcherLabel = seleneApi.getMatcherLabel(matcherKey).toUpperCase();

  const chips = [
    { label: 'PIPELINE', value: isProcessing ? 'RUNNING' : isComplete ? `${results.time}s` : '—', icon: Zap, highlight: isProcessing },
    { label: 'MATCHER',  value: matcherLabel, icon: GitMerge },
    { label: 'GEOMETRY', value: 'DEM + TPS',   icon: Triangle, hideSm: true },
    { label: 'REFINE',   value: 'IC-LK',        icon: Layers, hideSm: true },
  ];

  return (
    <footer className="h-9 shrink-0 flex items-center px-6 justify-between border-t border-slate-800 bg-slate-950 text-xs font-mono text-slate-400">
      <div className="flex items-center gap-6">
        {chips.map(({ label, value, icon: Icon, highlight, hideSm }) => (
          <div
            key={label}
            className={`flex items-center gap-2 ${hideSm ? 'hidden lg:flex' : 'flex'}`}
          >
            <Icon className={`w-3 h-3 ${highlight ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-500 font-medium uppercase text-[10px]">{label}:</span>
            <span className={`font-semibold ${highlight ? 'text-amber-300' : 'text-slate-300'}`}>{value}</span>
          </div>
        ))}
      </div>

      <span className="text-[10px] text-slate-500 tracking-wider">
        SELENE Workbench v2.0 · ISRO SIH #26166
      </span>
    </footer>
  );
};
