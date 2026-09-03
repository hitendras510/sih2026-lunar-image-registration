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
  const baseImgRef    = useRef<HTMLInputElement | null>(null);

  // ── Generator state ────────────────────────────────────────────────────────
  const [genMode, setGenMode]         = useState<'none' | 'config'>('none');
  const [baseFile, setBaseFile]       = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState<string>('');
  const [generating, setGenerating]   = useState(false);
  const [genDone, setGenDone]         = useState(false);

  // Transform params
  const [rotDeg, setRotDeg]   = useState(7.0);
  const [scale, setScale]     = useState(0.92);
  const [txPx, setTxPx]       = useState(35.0);
  const [tyPx, setTyPx]       = useState(20.0);
  const [gamma, setGamma]     = useState(0.7);
  const [imgW, setImgW]       = useState(1024);
  const [imgH, setImgH]       = useState(1024);

  // Generated preview URLs
  const [genRefUrl, setGenRefUrl] = useState('');
  const [genSrcUrl, setGenSrcUrl] = useState('');

  const handleBaseFilePick = (file: File) => {
    setBaseFile(file);
    setBasePreview(URL.createObjectURL(file));
    setGenDone(false);
  };

  // Drop handlers
  const handleRefDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setReferenceFile(e.dataTransfer.files[0]);
  };
  const handleSrcDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSourceFile(e.dataTransfer.files[0]);
  };

  const pairReady = referenceImage !== null && sourceImage !== null;

  // Run generation pipeline
  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setGenDone(false);
    addLog('Running synthetic pair generation pipeline…', 'info');

    try {
      const data = await seleneApi.generateSyntheticPair({
        baseImage:    baseFile,
        rotationDeg:  rotDeg,
        scale,
        tx:           txPx,
        ty:           tyPx,
        gamma,
        targetWidth:  imgW,
        targetHeight: imgH,
      });

      const ts = `?t=${Date.now()}`;
      const refUrl = `${data.reference_image_url}${ts}`;
      const srcUrl = `${data.source_image_url}${ts}`;
      setGenRefUrl(refUrl);
      setGenSrcUrl(srcUrl);
      setGenDone(true);

      const refMeta = {
        name: data.reference_name || 'reference.png',
        size: 0, type: 'image/png',
        sensor: 'Procedural Lunar Surface',
        gsd: '0.25 m/px', sunAngle: '90.0° / 45.0°',
        previewUrl: refUrl,
      };
      const srcMeta = {
        name: data.source_name || 'synthetic_target.png',
        size: 0, type: 'image/png',
        sensor: 'OHRC Synthetic',
        gsd: '0.25 m/px',
        sunAngle: `az=${rotDeg}° / γ=${gamma}`,
        previewUrl: srcUrl,
      };

      if (setRefMeta && setSrcMeta) {
        setRefMeta(refMeta);
        setSrcMeta(srcMeta);
      } else {
        const [refBlob, srcBlob] = await Promise.all([
          fetch(refUrl).then(r => r.blob()),
          fetch(srcUrl).then(r => r.blob()),
        ]);
        setReferenceFile(new File([refBlob], 'reference.png',        { type: 'image/png' }));
        setSourceFile(  new File([srcBlob], 'synthetic_target.png',  { type: 'image/png' }));
      }

      const gt = (data.ground_truth as any)?.ground_truth_params ?? {};
      addLog(
        `Synthetic pair generated: rot=${gt.rotation_deg}° scale=${gt.scale} tx=${gt.translation_x_px}px ty=${gt.translation_y_px}px γ=${gt.gamma_illumination}`,
        'success',
      );
      addToast('Synthetic pair generated and loaded into workspace!', 'success', 'Generation Complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      addLog(`Generation error: ${msg}`, 'error');
      addToast(msg, 'error', 'Generation Error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section id="view-upload" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center gap-3 flex-wrap pb-1">
        <h1 className="text-2xl font-bold font-display text-white tracking-wide">
          Image Upload
        </h1>
        <span className="badge font-mono text-[10.5px] tracking-[0.14em] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-md">
          T1 PAIRDESK
        </span>
        <div className="screen-subtitle w-full text-[12.5px] text-slate-400 font-mono tracking-wide mt-1">
          Upload the Reference and Source images — or generate a synthetic pair from custom parameters.
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
            genMode === 'none'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
          onClick={() => setGenMode('none')}
        >
          <UploadCloud className="w-4 h-4" />
          Upload Existing Pair
        </button>
        <button
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
            genMode === 'config'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
          onClick={() => setGenMode('config')}
        >
          <Zap className="w-4 h-4" />
          Generate Synthetic Pair
        </button>
      </div>

      {/* MODE A: Upload existing pair */}
      {genMode === 'none' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* REFERENCE / FIXED CARD */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Reference Image (Fixed)
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  LRO NAC / DEM
                </span>
              </div>

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

              <div
                className="min-h-56 rounded-xl border-2 border-dashed border-slate-700 hover:border-sky-400/80 bg-slate-950/60 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-6 group"
                onClick={() => refInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleRefDrop}
              >
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">
                  {referenceImage ? referenceImage.name : 'Click or drop reference image'}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  GeoTIFF / PDS3 / PDS4 / PNG
                </div>
                {referenceImage?.previewUrl && (
                  <img
                    src={referenceImage.previewUrl}
                    alt="Reference preview"
                    className="mt-4 max-h-36 rounded-lg border border-slate-700 object-contain"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Sensor</div>
                <div className="text-sm font-semibold text-white font-mono mt-1">LRO NAC</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">GSD</div>
                <div className="text-sm font-semibold text-white font-mono mt-1">0.50 m/px</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Sun Angle</div>
                <div className="text-sm font-semibold text-white font-mono mt-1">142.1° / 34.5°</div>
              </div>
            </div>
          </div>

          {/* SOURCE / MOVING CARD */}
          <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13.5px] font-semibold font-display text-cyan-300 tracking-wide flex items-center gap-2.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(111,246,255,0.8)] inline-block" />
                  • SOURCE / MOVING
                </h3>
                <span className="badge font-mono text-[10px] tracking-[0.12em] text-slate-300 bg-slate-900/80 border border-slate-700/60 px-3 py-1 rounded-md">
                  OHRC / TMC-2 / IIRS
                </span>
              </div>

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

              <div
                className="dropzone min-h-60 rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400/70 hover:bg-cyan-950/30 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-6 group"
                onClick={() => srcInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleSrcDrop}
              >
                <div className="dz-icon mb-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-400/30 text-cyan-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-[14px] font-bold font-display text-white">
                  {sourceImage ? sourceImage.name : 'Drop source image here'}
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-2 tracking-[0.14em]">
                  GEOTIFF / PDS • CLICK TO BROWSE
                </div>
                {sourceImage?.previewUrl && (
                  <img
                    src={sourceImage.previewUrl}
                    alt="Source preview"
                    className="mt-4 max-h-36 rounded-lg border border-[rgba(146,196,255,0.25)] object-contain shadow-lg"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="panel p-3 rounded-lg bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
                <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 tracking-[0.12em] uppercase">
                  <span className="text-cyan-400">•</span> SENSOR
                </div>
                <select
                  value={sourceSensor}
                  onChange={(e) => setSourceSensor(e.target.value)}
                  className="w-full mt-1 bg-transparent border-0 p-0 text-white text-[11.5px] font-mono font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Chandrayaan-2 OHRC" className="bg-slate-900 text-white">OHRC</option>
                  <option value="Chandrayaan-2 TMC-2" className="bg-slate-900 text-white">TMC-2</option>
                  <option value="Chandrayaan-2 IIRS" className="bg-slate-900 text-white">IIRS (Multi-spectral)</option>
                </select>
              </div>
              <div className="panel p-3 rounded-lg bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
                <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 tracking-[0.12em] uppercase">
                  <span className="text-cyan-400">•</span> {sourceSensor.includes('IIRS') ? 'IIRS BAND' : 'GSD'}
                </div>
                <div className="text-white mt-1.5 text-[12px] font-mono font-semibold">
                  {sourceSensor.includes('IIRS') ? (
                    <span className="text-cyan-300">Band #12</span>
                  ) : (
                    sourceImage?.gsd || '0.25 m/px'
                  )}
                </div>
              </div>
              <div className="panel p-3 rounded-lg bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
                <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 tracking-[0.12em] uppercase">
                  <span className="text-cyan-400">•</span> SUN ANGLE
                </div>
                <div className="text-white mt-1.5 text-[12px] font-mono font-semibold">
                  284.3° / 32.1°
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE B: Generate synthetic pair */}
      {genMode === 'config' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: base image upload */}
          <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-cyan-300" />
                <h3 className="text-[13.5px] font-bold font-display text-white tracking-wide uppercase">BASE IMAGE INPUT</h3>
                <span className="badge font-mono text-[9.5px] text-slate-400 ml-auto border border-slate-700/60 px-2.5 py-0.5 rounded">
                  OPTIONAL — fallback to procedural
                </span>
              </div>

              <input
                ref={baseImgRef} type="file" accept="image/*,.tif,.tiff"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleBaseFilePick(e.target.files[0]); }}
              />

              <div
                className="dropzone min-h-56 rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400/70 hover:bg-cyan-950/30 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-6 group"
                onClick={() => baseImgRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleBaseFilePick(e.dataTransfer.files[0]); }}
              >
                <div className="dz-icon mb-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-400/30 text-cyan-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className={`w-6 h-6 ${baseFile ? 'text-emerald-400' : 'text-cyan-400'}`} />
                </div>
                <div className="text-[14px] font-bold font-display text-white">
                  {baseFile ? baseFile.name : 'Drop your lunar image here'}
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-1.5 tracking-[0.14em]">
                  PNG / TIFF / JPG • CLICK TO BROWSE
                </div>
                {basePreview && (
                  <img src={basePreview} alt="base"
                    className="mt-3 max-h-36 rounded-lg border border-emerald-500/30 object-contain shadow-md" />
                )}
                {!baseFile && (
                  <p className="text-[11px] text-slate-400 mt-3 max-w-xs font-mono">
                    Leave empty to auto-generate a procedural lunar surface with synthetic crater geometry.
                  </p>
                )}
              </div>

              {baseFile && (
                <button
                  onClick={() => { setBaseFile(null); setBasePreview(''); setGenDone(false); }}
                  className="mt-3 text-[10px] font-mono text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> CLEAR BASE IMAGE — USE PROCEDURAL
                </button>
              )}
            </div>

            {/* Output size */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="panel p-3 rounded-lg bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
                <div className="font-mono text-[9.5px] text-slate-400 tracking-[0.12em] uppercase mb-1">Output Width (px)</div>
                <input type="number" min={64} max={4096} step={64} value={imgW}
                  onChange={e => setImgW(parseInt(e.target.value) || 1024)}
                  className="w-full bg-transparent text-white font-mono text-[12.5px] font-semibold border-0 outline-none" />
              </div>
              <div className="panel p-3 rounded-lg bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
                <div className="font-mono text-[9.5px] text-slate-400 tracking-[0.12em] uppercase mb-1">Output Height (px)</div>
                <input type="number" min={64} max={4096} step={64} value={imgH}
                  onChange={e => setImgH(parseInt(e.target.value) || 1024)}
                  className="w-full bg-transparent text-white font-mono text-[12.5px] font-semibold border-0 outline-none" />
              </div>
            </div>
          </div>

          {/* Right: transform parameters + run button */}
          <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Sliders className="w-4 h-4 text-cyan-300" />
                <h3 className="text-[13.5px] font-bold font-display text-white tracking-wide uppercase">TRANSFORM PARAMETERS</h3>
              </div>

              <div className="space-y-4">
                <SliderRow label="Rotation"          unit="°"  value={rotDeg} min={-45}  max={45}  step={0.5}  onChange={setRotDeg}  color="#6ff6ff" />
                <SliderRow label="Scale Factor"       unit="×"  value={scale}  min={0.5}  max={1.5} step={0.01} onChange={setScale}   color="#a9dcff" />
                <SliderRow label="Translation X"      unit=" px" value={txPx}   min={-200} max={200} step={1}    onChange={setTxPx}   color="#3ee6a0" />
                <SliderRow label="Translation Y"      unit=" px" value={tyPx}   min={-200} max={200} step={1}    onChange={setTyPx}   color="#3ee6a0" />
                <SliderRow label="Illumination γ"     unit=""   value={gamma}  min={0.2}  max={2.0} step={0.05} onChange={setGamma}  color="#ffb65c" />
              </div>

              {/* Parameter preview */}
              <div className="mt-5 p-3.5 rounded-lg bg-[#07111b]/90 border border-[rgba(146,196,255,0.12)] font-mono text-[10.5px] text-slate-400 space-y-1">
                <div>rotation_deg = <span className="text-cyan-300 font-semibold">{rotDeg}</span></div>
                <div>scale        = <span className="text-cyan-300 font-semibold">{scale}</span></div>
                <div>tx           = <span className="text-emerald-400 font-semibold">{txPx} px</span></div>
                <div>ty           = <span className="text-emerald-400 font-semibold">{tyPx} px</span></div>
                <div>gamma        = <span className="text-amber-400 font-semibold">{gamma}</span></div>
                <div>output_size  = <span className="text-white font-semibold">{imgW}×{imgH}</span></div>
              </div>
            </div>

            <div className="mt-6">
              <button
                className={`w-full py-3.5 rounded-lg text-[12px] font-bold font-display tracking-[0.14em] flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  generating
                    ? 'bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 shadow-[0_0_18px_rgba(57,168,255,0.3)]'
                }`}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-300 rounded-full animate-spin" />
                    RUNNING GENERATION PIPELINE…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-300" />
                    GENERATE SYNTHETIC PAIR
                  </>
                )}
              </button>

              {genDone && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400 font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Synthetic pair generated and loaded into workspace.
                </div>
              )}
            </div>
          </div>

          {/* Generated previews */}
          {genDone && (
            <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[
                { label: 'Reference (Fixed)', url: genRefUrl,  borderColor: 'border-emerald-500/40' },
                { label: 'Source / Synthetic Target (Moving)', url: genSrcUrl, borderColor: 'border-cyan-500/40' },
              ].map(({ label, url, borderColor }) => (
                <div key={label} className="card p-5 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md">
                  <div className="text-[12px] font-bold font-display text-white mb-3 tracking-wide uppercase">{label}</div>
                  <img src={url} alt={label}
                    className={`w-full max-h-60 object-contain rounded-lg border ${borderColor} shadow-md`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAIR SUMMARY CARD */}
      <div className="card bracket p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
          <div>
            <h3 className="text-[14px] font-bold font-display text-white tracking-wide uppercase">
              PAIR SUMMARY
            </h3>
            <p className="text-[12px] text-slate-400 font-mono tracking-wide mt-1">
              Metadata is evaluated by the automatic matcher gate prior to registration execution.
            </p>
          </div>
          <span
            className={`badge font-mono text-[10.5px] tracking-[0.14em] font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-2 ${
              pairReady
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                : 'text-slate-400 bg-slate-900/60 border border-slate-700/60'
            }`}
          >
            {pairReady ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                PAIR READY FOR REGISTRATION
              </>
            ) : (
              'WAITING FOR BOTH IMAGES'
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="panel p-4 rounded-xl bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> SCALE RATIO
            </div>
            <div className="text-white mt-2 font-mono text-[12.5px] font-semibold">
              320× max
            </div>
          </div>
          <div className="panel p-4 rounded-xl bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> SUN-ANGLE DELTA
            </div>
            <div className="text-amber-400 mt-2 font-mono text-[12.5px] font-semibold">
              142.6°
            </div>
          </div>
          <div className="panel p-4 rounded-xl bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> GSD STRATEGY
            </div>
            <div className="text-white mt-2 font-mono text-[12.5px] font-semibold">
              Common coarse
            </div>
          </div>
          <div className="panel p-4 rounded-xl bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> LABEL PARSER
            </div>
            <div className="text-white mt-2 font-mono text-[12.5px] font-semibold">
              PDS3 / PDS4 / JSON
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-7 pt-6 border-t border-[rgba(146,196,255,0.12)] flex-wrap">
          <button
            className="px-6 py-3.5 rounded-xl text-[12px] font-bold font-display tracking-[0.14em] bg-gradient-to-r from-[#1d64ec] to-[#00b4d8] text-white flex items-center gap-2.5 hover:opacity-95 hover:scale-[1.02] transition-all cursor-pointer shadow-[0_0_20px_rgba(29,100,236,0.35)] uppercase border border-cyan-400/40"
            onClick={() => navigateTo('register')}
          >
            CONTINUE TO REGISTRATION <ExternalLink className="w-4 h-4 text-white" />
          </button>
          <button
            className="px-6 py-3.5 rounded-xl text-[12px] font-bold font-display tracking-[0.14em] border border-cyan-400/40 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(111,246,255,0.15)] uppercase"
            onClick={loadSyntheticPair}
          >
            LOAD SYNTHETIC GENERATED PAIR <Zap className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            className="px-6 py-3.5 rounded-xl text-[12px] font-bold font-display tracking-[0.14em] border border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-500 flex items-center gap-2 transition-all cursor-pointer uppercase"
            onClick={clearUploads}
          >
            CLEAR UPLOADS <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
