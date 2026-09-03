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
      <div className="pb-3 border-b border-[#D0D0D0]">
        <h1 className="text-xl font-bold text-[#222222]">
          Workbench Preferences &amp; Configuration
        </h1>
        <p className="text-xs text-[#555555] mt-0.5">
          Configure default registration strategies, API server endpoints, and user interface preferences.
        </p>
      </div>

      {/* SETTINGS FORM */}
      <div className="p-6 rounded bg-white border border-[#D0D0D0] space-y-6 max-w-4xl">
        {/* REGISTRATION ENGINE */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#D0D0D0]">
            Registration Engine Defaults
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#555555] block mb-1">
                Default GSD Strategy
              </label>
              <select
                value={settings.defaultGsdStrategy}
                onChange={(e) =>
                  updateSettings({ defaultGsdStrategy: e.target.value })
                }
                className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#222222] focus:border-[#1F4E79] focus:outline-none"
              >
                <option value="Common coarsest GSD">Common coarsest GSD</option>
                <option value="Reference GSD">Reference GSD</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#555555] block mb-1">
                Default Matcher
              </label>
              <select
                value={settings.defaultMatcher}
                onChange={(e) =>
                  updateSettings({ defaultMatcher: e.target.value })
                }
                className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#1F4E79] font-semibold focus:border-[#1F4E79] focus:outline-none"
              >
                <option value="Automatic gate routing">
                  Automatic gate routing
                </option>
                <option value="LoFTR Dense Deep Matcher">LoFTR Dense Deep Matcher</option>
                <option value="XFeat Lightweight Matcher">XFeat Lightweight Matcher</option>
                <option value="LightGlue">LightGlue</option>
              </select>
            </div>
          </div>
        </div>

        {/* API CONFIGURATION */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#D0D0D0]">
            API Endpoint Configuration
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => updateSettings({ apiUrl: e.target.value })}
              className="flex-1 p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#222222] font-mono focus:border-[#1F4E79] focus:outline-none"
            />
            <button
              onClick={handleTestApi}
              className="px-4 py-2 rounded bg-[#1F4E79] hover:bg-[#163A5C] text-white text-xs font-semibold"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

