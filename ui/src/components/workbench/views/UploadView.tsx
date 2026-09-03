import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, RotateCcw, Zap, ExternalLink, Sliders, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { seleneApi } from '../../../services/api';

// ── Small slider row ─────────────────────────────────────────────────────────
interface SliderRowProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color?: string;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, unit, value, min, max, step, onChange, color = '#6ff6ff' }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-slate-400 font-mono">{label}</span>
      <span className="text-[11px] font-mono font-semibold" style={{ color }}>
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1 rounded-full appearance-none cursor-pointer"
      style={{ accentColor: color }}
    />
    <div className="flex justify-between text-[9px] text-slate-600 font-mono">
      <span>{min}{unit}</span><span>{max}{unit}</span>
    </div>
  </div>
);

// ── Main Upload View ──────────────────────────────────────────────────────────
export const UploadView: React.FC = () => {
  const {
    referenceImage, sourceImage,
    sourceSensor,
    setReferenceFile, setSourceFile, setSourceSensor,
    clearUploads, loadSyntheticPair, navigateTo,
    addLog, addToast,
    setReferenceImage: _setRef, setSourceImage: _setSrc,
  } = useApp() as any;

  const setRefMeta  = typeof _setRef  === 'function' ? _setRef  : null;
  const setSrcMeta  = typeof _setSrc  === 'function' ? _setSrc  : null;

  const refInputRef   = useRef<HTMLInputElement | null>(null);
  const srcInputRef   = useRef<HTMLInputElement | null>(null);

  const [genMode, setGenMode] = useState<'none' | 'config'>('none');
  const pairReady = referenceImage !== null && sourceImage !== null;

  return (
    <section id="view-upload" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div className="pb-3 border-b border-[#D0D0D0] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#222222]">
            Image Pair Input
          </h1>
          <p className="text-xs text-[#555555] mt-0.5">
            Select or upload Reference &amp; Target lunar optical rasters for correspondence matching.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
              genMode === 'none'
                ? 'bg-[#1F4E79] text-white border-[#1F4E79]'
                : 'bg-white text-[#222222] border-[#D0D0D0] hover:bg-[#F2F4F6]'
            }`}
            onClick={() => setGenMode('none')}
          >
            Upload Image Files
          </button>
          <button
            className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
              genMode === 'config'
                ? 'bg-[#1F4E79] text-white border-[#1F4E79]'
                : 'bg-white text-[#222222] border-[#D0D0D0] hover:bg-[#F2F4F6]'
            }`}
            onClick={loadSyntheticPair}
          >
            Generate Synthetic Pair
          </button>
        </div>
      </div>

      {/* IMAGE PAIR INPUT SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REFERENCE IMAGE */}
        <div className="p-5 rounded bg-white border border-[#D0D0D0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-2">
            <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
              Reference Image
            </h2>
            <span className="text-xs font-mono text-[#555555]">Dataset: LRO NAC</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              Sensor
            </label>
            <input
              type="text"
              readOnly
              value="LRO NAC (0.50 m/px)"
              className="w-full p-2 bg-[#F8F9FA] border border-[#D0D0D0] rounded text-xs text-[#222222] font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              File Input
            </label>
            <input
              ref={refInputRef}
              type="file"
              accept="image/*,.tif,.tiff,.lbl,.xml,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setReferenceFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#F2F4F6] border border-[#D0D0D0] rounded text-xs font-semibold text-[#222222] hover:bg-[#E9ECEF]"
              >
                Choose File
              </button>
              <span className="text-xs font-mono text-[#555555] truncate">
                {referenceImage ? referenceImage.name : 'reference.png'}
              </span>
            </div>
          </div>

          {/* Preview Box */}
          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              Image Preview
            </label>
            <div className="h-44 bg-[#F8F9FA] border border-[#D0D0D0] rounded flex items-center justify-center p-2 overflow-hidden">
              {referenceImage?.previewUrl ? (
                <img
                  src={referenceImage.previewUrl}
                  alt="Reference preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-[#555555]">No preview available</span>
              )}
            </div>
          </div>

          {/* Info Table */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">Image Information</h3>
            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-[#F2F4F6] text-[#222222]">
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">Dimensions:</td>
                  <td className="py-1 font-mono text-right">1024 × 1024 px</td>
                </tr>
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">GSD:</td>
                  <td className="py-1 font-mono text-right">0.50 m/px</td>
                </tr>
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">Sun Elevation:</td>
                  <td className="py-1 font-mono text-right">34.5°</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TARGET IMAGE */}
        <div className="p-5 rounded bg-white border border-[#D0D0D0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-2">
            <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
              Target Image
            </h2>
            <span className="text-xs font-mono text-[#555555]">Dataset: Chandrayaan-2</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              Sensor
            </label>
            <select
              value={sourceSensor}
              onChange={(e) => setSourceSensor(e.target.value)}
              className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#1F4E79] font-semibold focus:border-[#1F4E79] focus:outline-none"
            >
              <option value="Chandrayaan-2 OHRC">Chandrayaan-2 OHRC (0.25 m/px)</option>
              <option value="Chandrayaan-2 TMC-2">Chandrayaan-2 TMC-2 (5.00 m/px)</option>
              <option value="Chandrayaan-2 IIRS">Chandrayaan-2 IIRS (80.0 m/px)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              File Input
            </label>
            <input
              ref={srcInputRef}
              type="file"
              accept="image/*,.tif,.tiff,.lbl,.xml,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSourceFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => srcInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#F2F4F6] border border-[#D0D0D0] rounded text-xs font-semibold text-[#222222] hover:bg-[#E9ECEF]"
              >
                Choose File
              </button>
              <span className="text-xs font-mono text-[#555555] truncate">
                {sourceImage ? sourceImage.name : 'target.png'}
              </span>
            </div>
          </div>

          {/* Preview Box */}
          <div>
            <label className="text-xs font-semibold text-[#555555] block mb-1">
              Image Preview
            </label>
            <div className="h-44 bg-[#F8F9FA] border border-[#D0D0D0] rounded flex items-center justify-center p-2 overflow-hidden">
              {sourceImage?.previewUrl ? (
                <img
                  src={sourceImage.previewUrl}
                  alt="Target preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-[#555555]">No preview available</span>
              )}
            </div>
          </div>

          {/* Info Table */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">Image Information</h3>
            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-[#F2F4F6] text-[#222222]">
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">Dimensions:</td>
                  <td className="py-1 font-mono text-right">1024 × 1024 px</td>
                </tr>
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">GSD:</td>
                  <td className="py-1 font-mono text-right">{sourceImage?.gsd || '0.25 m/px'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-[#555555] font-semibold">Sun Elevation:</td>
                  <td className="py-1 font-mono text-right">32.1°</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ACTION CONTROLS */}
      <div className="p-5 rounded bg-white border border-[#D0D0D0] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={loadSyntheticPair}
            className="px-4 py-2 rounded bg-white border border-[#D0D0D0] text-[#222222] hover:bg-[#F2F4F6] text-xs font-semibold transition-colors"
          >
            Generate Synthetic Pair
          </button>
          <button
            onClick={clearUploads}
            className="px-4 py-2 rounded bg-white border border-[#D0D0D0] text-[#555555] hover:bg-[#F2F4F6] text-xs font-semibold transition-colors"
          >
            Clear Inputs
          </button>
        </div>

        <button
          onClick={() => navigateTo('register')}
          className="px-5 py-2.5 rounded bg-[#1F4E79] hover:bg-[#163A5C] text-white font-semibold text-xs transition-colors"
        >
          Continue to Registration
        </button>
      </div>
    </section>
  );
};
