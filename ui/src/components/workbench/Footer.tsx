import React from 'react';
import { useApp } from '../../context/AppContext';
import { seleneApi } from '../../services/api';

export const Footer: React.FC = () => {
  const { results, selectedMatcher, sourceSensor, isComplete } = useApp();

  const matcherKey = seleneApi.resolveMatcher(selectedMatcher, sourceSensor);
  const matcherLabel = seleneApi.getMatcherLabel(matcherKey).toUpperCase();

  return (
    <footer className="app-footer h-10 shrink-0 flex items-center px-6 gap-6 font-mono text-[9px] tracking-[0.1em] text-slate-600 border-t border-[rgba(146,196,255,0.13)] bg-[rgba(4,9,16,0.8)]">
      <span className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-brand-400" />
        PIPELINE{' '}
        <b id="footer-time" className="text-slate-300 font-normal">
          {isComplete ? `${results.time} S` : '—'}
        </b>
      </span>
      <span>
        MATCHER{' '}
        <b id="footer-matcher" className="text-slate-300 font-normal">
          {matcherLabel}
        </b>
      </span>
      <span className="hidden lg:inline">
        GEOMETRY <b className="text-slate-300 font-normal">DEM + TPS</b>
      </span>
      <span className="hidden lg:inline">
        REFINEMENT <b className="text-slate-300 font-normal">IC-LK</b>
      </span>
      <span className="ml-auto hidden md:inline text-slate-700">BUILD v2.0</span>
    </footer>
  );
};
