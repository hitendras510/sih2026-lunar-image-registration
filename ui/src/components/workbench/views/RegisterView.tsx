import React, { useState } from 'react';
import {
  Play,
  Database,
  Layers,
  Sliders,
  Cpu,
  Zap,
  Filter,
  Crosshair,
  Grid,
  Package,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { MatcherType } from '../../../types';

interface StageDetail {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  kpis: { label: string; value: string; color?: string }[];
  accentColor: string;
  badgeBg: string;
}

const STAGE_DETAILS: StageDetail[] = [
  {
    id: '01',
    name: 'Ingest & Validation',
    subtitle: 'OK - SOURCE RASTER',
    icon: Database,
    description: 'Ingesting PDS3/PDS4 labels, sensor metadata (LRO NAC / C-2 OHRC), and 16-bit floating-point rasters.',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    kpis: [
      { label: 'SOURCE FORMAT', value: 'GeoTIFF / PNG 16-bit' },
      { label: 'REFERENCE SENSOR', value: 'LRO NAC (0.50 m/px)' },
      { label: 'SUN ELEVATION', value: '34.5° vs 32.1°' },
      { label: 'RASTER DIMENSIONS', value: '1024 × 1024 px' },
    ],
  },
  {
    id: '02',
    name: 'GSD Resampling',
    subtitle: 'OK - PYRAMID SCALING',
    icon: Layers,
    description: 'Constructing multi-scale Gaussian pyramids & resampling both images to a uniform GSD grid.',
    accentColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.15)',
    kpis: [
      { label: 'SOURCE GSD', value: '0.25 m/px' },
      { label: 'REF GSD', value: '0.50 m/px' },
      { label: 'COMMON GSD TARGET', value: '0.50 m/px' },
      { label: 'PYRAMID LEVELS', value: '3 Scales (1×, 0.5×, 0.25×)' },
    ],
  },
  {
    id: '03',
    name: 'Equalization & Shadows',
    subtitle: 'OK - WALLIS FILTER',
    icon: Sliders,
    description: 'Phase congruency edge extraction & Wallis adaptive histogram equalization for high illumination invariance.',
    accentColor: '#f472b6',
    badgeBg: 'rgba(244, 114, 182, 0.15)',
    kpis: [
      { label: 'PHASE CONGRUENCY', value: 'Active (3 Scales, 6 Oris)' },
      { label: 'WALLIS WINDOW', value: '32 × 32 px' },
      { label: 'DYNAMIC RANGE', value: 'Normalized [0.0, 1.0]' },
      { label: 'SHADOW MASK', value: 'Thresholded < 0.05' },
    ],
  },
  {
    id: '04',
    name: 'Gate Router',
    subtitle: 'OK - EXPERT ROUTING',
    icon: Cpu,
    description: 'Evaluating orbital solar geometry & sensor modality matrix to select the optimal neural matcher expert.',
    accentColor: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    kpis: [
      { label: 'Δ SUN AZIMUTH', value: '14.2° (Normal Light)' },
      { label: 'GSD RATIO', value: '1.00 (Matched)' },
      { label: 'SELECTED MATCHER', value: 'LoFTR / LightGlue', color: '#c084fc' },
      { label: 'EXPERT ROUTE CONF', value: '98.4%' },
    ],
  },
  {
    id: '05',
    name: 'Matcher Core',
    subtitle: 'CONVERGENCE PASS',
    icon: Zap,
    description: 'Extracting high-density candidate feature points & computing mutual neural correspondence vectors.',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    kpis: [
      { label: 'RAW MATCHES', value: '21,389 Points', color: '#38bdf8' },
      { label: 'EXTRACTOR', value: 'SuperPoint / ALIKED' },
      { label: 'GPU MEMORY', value: '1.42 GB VRAM' },
      { label: 'EXTRACTION SPEED', value: '142 ms' },
    ],
  },
  {
    id: '06',
    name: 'MAGSAC++ Filtering',
    subtitle: 'OK - OUTLIER REMOVAL',
    icon: Filter,
    description: 'USAC_MAGSAC++ marginalizing sample consensus for robust spatial outlier elimination & matrix estimation.',
    accentColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    kpis: [
      { label: 'ROBUST INLIERS', value: '18,742 Points', color: '#34d399' },
      { label: 'INLIER RATIO', value: '87.6%', color: '#34d399' },
      { label: 'REJECTION RATE', value: '12.4% Outliers' },
      { label: 'CONVERGENCE ITERS', value: '100 / 100 Runs' },
    ],
  },
  {
    id: '07',
    name: 'IC-LK Refinement',
    subtitle: 'OK - SUB-PIXEL LOCK',
    icon: Crosshair,
    description: 'Inverse-Compositional Lucas-Kanade 21×21 sub-pixel refinement matrix solving H Δp = J^T ΔI.',
    accentColor: '#22d3ee',
    badgeBg: 'rgba(34, 211, 238, 0.15)',
    kpis: [
      { label: 'SUB-PIXEL RMSE', value: '0.062 px', color: '#22d3ee' },
      { label: 'PREVIOUS COARSE', value: '1.240 px' },
      { label: 'ERROR REDUCTION', value: '↓ 95.0% Drop', color: '#34d399' },
      { label: 'IC-LK ITERS', value: '14.2 / 30 iters' },
    ],
  },
  {
    id: '08',
    name: 'GCP Validation',
    subtitle: 'ERRORS: 0.68 px',
    icon: Grid,
    description: 'Evaluating uniform 8×8 grid coverage & 80/20 train/validation independent holdout ground control points.',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    kpis: [
      { label: 'TRAIN RMSE', value: '0.68 px', color: '#fbbf24' },
      { label: 'VAL HOLDOUT RMSE', value: '0.72 px' },
      { label: 'COVERAGE INDEX', value: '81% Spatial Mesh' },
      { label: 'UNIFORMITY NNI', value: '0.84 (Well-Clustered)' },
    ],
  },
  {
    id: '09',
    name: 'Export Products',
    subtitle: 'DONE - 4 PRODUCTS',
    icon: Package,
    description: 'Warping source raster with Thin Plate Splines & generating registered GeoTIFF, CSV matches, and PDF report.',
    accentColor: '#4ade80',
    badgeBg: 'rgba(74, 222, 128, 0.15)',
    kpis: [
      { label: 'GEOTIFF OUTPUT', value: 'registered.tif (16.4 MB)', color: '#4ade80' },
      { label: 'TELEMETRY CSV', value: 'matches.csv (2.1 MB)' },
      { label: 'PDF REPORT', value: 'Selene_Report.pdf' },
      { label: 'QUALITY GATE', value: '✓ PASSED (< 1.0 px)', color: '#4ade80' },
    ],
  },
];

export const RegisterView: React.FC = () => {
  const {
    selectedMatcher,
    setSelectedMatcher,
    geometryModel,
    setGeometryModel,
    runRegistration,
    isProcessing,
    pipelineProgress,
    activeStepIndex,
    logs,
  } = useApp();

  const [stepStage, setStepStage] = useState('0 - 0');
  const [pairInstance, setPairInstance] = useState('2');

  return (
    <section id="view-register" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div className="pb-3 border-b border-[#D0D0D0] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#222222]">
            Registration Configuration
          </h1>
          <p className="text-xs text-[#555555] mt-0.5">
            Configure registration hyperparameters, matcher model, and geodetic transformation parameters.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#555555]">Status:</span>
          <span className={`font-semibold px-2.5 py-1 rounded text-xs ${isProcessing ? 'bg-[#FFF3E0] text-[#B26A00]' : pipelineProgress === 100 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F8F9FA] text-[#555555] border border-[#D0D0D0]'}`}>
            {isProcessing ? 'Executing Pipeline...' : pipelineProgress === 100 ? 'Pipeline Complete' : 'Ready'}
          </span>
        </div>
      </div>

      {/* CONFIGURATION FORM CARD */}
      <div className="p-6 rounded bg-white border border-[#D0D0D0] space-y-5">
        <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#D0D0D0]">
          Pipeline Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1.5">
              Pipeline Stage
            </label>
            <select
              value={stepStage}
              onChange={(e) => setStepStage(e.target.value)}
              className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#222222] focus:border-[#1F4E79] focus:outline-none"
            >
              <option value="0 - 0">0 - 0 (Full Automatic 9-Stage)</option>
              <option value="0 - 4">0 - 4 (Initial Match Only)</option>
              <option value="0 - 8">0 - 8 (Full Registration Pipeline)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1.5">
              Image Pair
            </label>
            <select
              value={pairInstance}
              onChange={(e) => setPairInstance(e.target.value)}
              className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#222222] focus:border-[#1F4E79] focus:outline-none"
            >
              <option value="2">Pair #2 (OHRC 0.25 m / LRO NAC 0.50 m)</option>
              <option value="1">Pair #1 (TMC-2 5.0 m / WAC 100 m)</option>
              <option value="3">Pair #3 (IIRS Hyperspectral / TMC-2)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1.5">
              Feature Matcher Model
            </label>
            <select
              value={selectedMatcher}
              onChange={(e) => setSelectedMatcher(e.target.value as MatcherType)}
              className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#1F4E79] font-semibold focus:border-[#1F4E79] focus:outline-none"
            >
              <option value="auto">Auto – Intelligent Gate Routing</option>
              <option value="loftr">LoFTR Dense Deep Matcher</option>
              <option value="xfeat">XFeat Lightweight Matcher</option>
              <option value="lightglue">LightGlue (ALIKED/SuperPoint)</option>
              <option value="crater_graph">Crater Graph (Polarity Invariant)</option>
              <option value="phase_corr">Phase Correlation (FFT Translation)</option>
              <option value="mutual_info">Mutual Information (Cross-Sensor)</option>
              <option value="sift">SIFT Baseline</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1.5">
              Geodetic Model
            </label>
            <select
              value={geometryModel}
              onChange={(e) => setGeometryModel(e.target.value)}
              className="w-full p-2 bg-white border border-[#D0D0D0] rounded text-xs text-[#222222] focus:border-[#1F4E79] focus:outline-none"
            >
              <option value="DEM + Map Projection (Tier 2)">DEM – Map Projection</option>
              <option value="ISIS/SPICE (Tier 1)">ISIS/SPICE Camera Model</option>
              <option value="Selenographic Sphere (Tier 3)">Selenographic Ellipsoid</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#D0D0D0] flex-wrap gap-4">
          <span className="text-xs text-[#555555]">
            Selected Engine: <strong className="text-[#1F4E79]">{selectedMatcher === 'auto' ? 'Auto Routing' : selectedMatcher.toUpperCase()}</strong>
          </span>

          <button
            onClick={() => runRegistration()}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded bg-[#1F4E79] hover:bg-[#163A5C] text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing Pipeline...' : 'Run Registration'}
          </button>
        </div>
      </div>

      {/* PIPELINE PROGRESS TABLE */}
      <div className="p-6 rounded bg-white border border-[#D0D0D0] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
            Pipeline Progress
          </h2>
          <span className="text-xs font-mono text-[#1F4E79] font-bold">
            {pipelineProgress}% Completed
          </span>
        </div>

        {/* Simple Progress Bar */}
        <div className="w-full bg-[#F2F4F6] rounded h-2 overflow-hidden border border-[#D0D0D0]">
          <div
            className="h-full bg-[#1F4E79] transition-all duration-300"
            style={{ width: `${pipelineProgress}%` }}
          />
        </div>

        {/* Pipeline Stages Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#D0D0D0] text-[#555555] font-semibold">
                <th className="py-2.5 px-4 w-16">Stage</th>
                <th className="py-2.5 px-4">Stage Name</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0D0D0] text-[#222222]">
              {STAGE_DETAILS.map((stg, idx) => {
                const isRunning = isProcessing && activeStepIndex === idx;
                const isDone = activeStepIndex > idx || (pipelineProgress === 100 && activeStepIndex >= idx);

                return (
                  <tr key={stg.id} className={isRunning ? 'bg-[#E8F1F8]' : ''}>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#1F4E79]">{stg.id}</td>
                    <td className="py-2.5 px-4 font-semibold">{stg.name}</td>
                    <td className="py-2.5 px-4 text-[#555555]">{stg.description}</td>
                    <td className="py-2.5 px-4">
                      {isRunning ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/30">
                          Processing
                        </span>
                      ) : isDone ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                          Passed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2F4F6] text-[#555555] border border-[#D0D0D0]">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTION LOG TERMINAL */}
      <div className="p-5 rounded bg-white border border-[#D0D0D0] space-y-3">
        <h2 className="text-xs font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#D0D0D0]">
          Execution Logs
        </h2>
        <div className="bg-[#1E293B] text-slate-100 p-4 rounded text-xs font-mono h-48 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-400">System initialized. Awaiting registration command...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-slate-400">[{log.timestamp}]</span>
                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-200'}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
