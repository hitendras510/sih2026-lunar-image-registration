import React from 'react';
import { Sliders, Activity, Server, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, addLog, addToast } = useApp();

  const handleTestApi = () => {
    addLog(`API connection test requested for: ${settings.apiUrl}`, 'info');
    addToast(
      'API connection check completed. Workbench is ready.',
      'success',
      'API Check'
    );
  };

  return (
    <section id="view-settings" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Workbench Preferences & Configuration
        </h1>
        <div className="text-xs text-slate-400 font-mono tracking-wide mt-1">
          Configure default registration strategies, API server endpoints, and user interface preferences.
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-8 max-w-4xl">
        {/* REGISTRATION ENGINE */}
        <div>
          <h3 className="text-sm font-bold text-sky-400 border-b border-slate-800 pb-3 uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Registration Engine Defaults
          </h3>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <label className="text-xs font-mono text-slate-400 flex flex-col gap-2">
              <span className="font-semibold text-slate-300">Default GSD Strategy</span>
              <select
                value={settings.defaultGsdStrategy}
                onChange={(e) =>
                  updateSettings({ defaultGsdStrategy: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
              >
                <option value="Common coarsest GSD">Common coarsest GSD</option>
                <option value="Reference GSD">Reference GSD</option>
              </select>
            </label>
            <label className="text-[11.5px] text-slate-400 font-mono flex flex-col gap-2">
              <span className="font-semibold text-slate-300">DEFAULT MATCHER</span>
              <select
                value={settings.defaultMatcher}
                onChange={(e) =>
                  updateSettings({ defaultMatcher: e.target.value })
                }
                className="w-full p-3 bg-[#060f19] border border-[rgba(146,196,255,0.18)] rounded-lg text-white font-mono text-[13px] focus:border-cyan-400 focus:outline-none transition-colors"
              >
                <option value="Automatic gate routing">
                  Automatic gate routing
                </option>
                <option value="LoFTR Dense Deep Matcher">LoFTR Dense Deep Matcher</option>
                <option value="XFeat Lightweight Matcher">XFeat Lightweight Matcher</option>
                <option value="LightGlue">LightGlue</option>
                <option value="Crater Graph">Crater Graph</option>
                <option value="Census Transform SIFT">Census Transform SIFT</option>
              </select>
            </label>
          </div>
        </div>

        {/* VISUALIZATION */}
        <div>
          <h3 className="text-[13px] font-bold font-display text-cyan-300 border-b border-[rgba(146,196,255,0.14)] pb-3 tracking-[0.14em] uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            • VISUALIZATION
          </h3>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <label className="text-[11.5px] text-slate-400 font-mono flex flex-col gap-2">
              <span className="font-semibold text-slate-300">
                HEATMAP OPACITY ({settings.heatmapOpacity}%)
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.heatmapOpacity}
                onChange={(e) =>
                  updateSettings({ heatmapOpacity: parseInt(e.target.value, 10) })
                }
                className="w-full mt-3 accent-cyan-400 cursor-pointer"
              />
            </label>
            <label className="text-[11.5px] text-slate-400 font-mono flex flex-col gap-2">
              <span className="font-semibold text-slate-300">COORDINATE SYSTEM</span>
              <select
                value={settings.coordinateSystem}
                onChange={(e) =>
                  updateSettings({ coordinateSystem: e.target.value })
                }
                className="w-full p-3 bg-[#060f19] border border-[rgba(146,196,255,0.18)] rounded-lg text-white font-mono text-[13px] focus:border-cyan-400 focus:outline-none transition-colors"
              >
                <option value="Selenographic (Lat / Lon)">
                  Selenographic (Lat / Lon)
                </option>
                <option value="Image Pixels (x, y)">Image Pixels (x, y)</option>
                <option value="Projected metres">Projected metres</option>
              </select>
            </label>
          </div>
        </div>

        {/* API & CONNECTION */}
        <div>
          <h3 className="text-[13px] font-bold font-display text-cyan-300 border-b border-[rgba(146,196,255,0.14)] pb-3 tracking-[0.14em] uppercase flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            • API &amp; CONNECTION
          </h3>
          <div className="flex gap-3 mt-4 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => updateSettings({ apiUrl: e.target.value })}
              className="flex-1 p-3 bg-[#060f19] border border-[rgba(146,196,255,0.18)] rounded-lg text-white font-mono text-[13px] focus:border-cyan-400 focus:outline-none transition-colors"
            />
            <button
              onClick={handleTestApi}
              className="px-6 py-3.5 rounded-xl text-[11.5px] font-bold font-display tracking-[0.14em] bg-gradient-to-r from-[#1d64ec] to-[#00b4d8] text-white flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(29,100,236,0.35)] uppercase border border-cyan-400/40 whitespace-nowrap hover:opacity-95 hover:scale-[1.02]"
            >
              TEST CONNECTION
            </button>
          </div>
        </div>

        {/* AUTO-SAVE */}
        <div className="pt-2">
          <label className="flex items-center gap-3 text-[12.5px] font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-0"
            />
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4 text-cyan-400" />
              Auto-save results &amp; parameters to local storage
            </span>
          </label>
        </div>
      </div>
    </section>
  );
};

