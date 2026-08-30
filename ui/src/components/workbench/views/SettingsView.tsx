import React from 'react';
import { useApp } from '../../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, addLog, addToast } = useApp();

  const handleTestApi = () => {
    addLog(`API connection test requested for: ${settings.apiUrl}`, 'info');
    addToast(
      'API connection check simulated successfully. Ready for FastAPI backend.',
      'success',
      'API Check'
    );
  };

  return (
    <section id="view-settings" className="view-section active">
      <div className="mb-5">
        <div className="screen-title">Settings</div>
        <div className="screen-subtitle">
          Workbench display and processing preferences.
        </div>
      </div>
      <div className="card p-6 space-y-7 max-w-4xl">
        <div>
          <h3 className="text-[12px] font-semibold text-brand-300 border-b border-[rgba(146,196,255,0.13)] pb-2.5 tracking-[0.12em] font-mono">
            REGISTRATION ENGINE
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <label className="text-[11px] text-slate-400">
              Default GSD strategy
              <select
                value={settings.defaultGsdStrategy}
                onChange={(e) =>
                  updateSettings({ defaultGsdStrategy: e.target.value })
                }
                className="w-full mt-2 p-2.5"
              >
                <option value="Common coarsest GSD">Common coarsest GSD</option>
                <option value="Reference GSD">Reference GSD</option>
              </select>
            </label>
            <label className="text-[11px] text-slate-400">
              Default matcher
              <select
                value={settings.defaultMatcher}
                onChange={(e) =>
                  updateSettings({ defaultMatcher: e.target.value })
                }
                className="w-full mt-2 p-2.5"
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

        <div>
          <h3 className="text-[12px] font-semibold text-brand-300 border-b border-[rgba(146,196,255,0.13)] pb-2.5 tracking-[0.12em] font-mono">
            VISUALIZATION
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <label className="text-[11px] text-slate-400">
              Heatmap opacity ({settings.heatmapOpacity}%)
              <input
                type="range"
                min="0"
                max="100"
                value={settings.heatmapOpacity}
                onChange={(e) =>
                  updateSettings({ heatmapOpacity: parseInt(e.target.value, 10) })
                }
                className="w-full mt-3"
              />
            </label>
            <label className="text-[11px] text-slate-400">
              Coordinate system
              <select
                value={settings.coordinateSystem}
                onChange={(e) =>
                  updateSettings({ coordinateSystem: e.target.value })
                }
                className="w-full mt-2 p-2.5"
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

        <div>
          <h3 className="text-[12px] font-semibold text-brand-300 border-b border-[rgba(146,196,255,0.13)] pb-2.5 tracking-[0.12em] font-mono">
            API &amp; CONNECTION
          </h3>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => updateSettings({ apiUrl: e.target.value })}
              className="flex-1 p-2.5 font-mono"
            />
            <button
              onClick={handleTestApi}
              className="btn-secondary px-5 rounded-lg text-[10px] tracking-[0.1em] font-mono"
            >
              TEST CONNECTION
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 text-[11.5px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
            />{' '}
            Auto-save results to local storage
          </label>
        </div>
      </div>
    </section>
  );
};
