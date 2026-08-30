import React, { useRef, useState } from 'react';
import { UploadCloud, Sliders, Zap, RotateCcw, Image as ImageIcon } from 'lucide-react';
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
    clearUploads, navigateTo,
    addLog, addToast,
    setReferenceImage: _setRef, setSourceImage: _setSrc,
  } = useApp() as any;

  // Use these safe setters if context exposes them, else fall back to setReferenceFile/setSourceFile
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

  // Generated preview URLs (bust cache with timestamp)
  const [genRefUrl, setGenRefUrl] = useState('');
  const [genSrcUrl, setGenSrcUrl] = useState('');

  const handleBaseFilePick = (file: File) => {
    setBaseFile(file);
    setBasePreview(URL.createObjectURL(file));
    setGenDone(false);
  };

  // ── Drop handlers ──────────────────────────────────────────────────────────
  const handleRefDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setReferenceFile(e.dataTransfer.files[0]);
  };
  const handleSrcDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSourceFile(e.dataTransfer.files[0]);
  };

  const pairReady = referenceImage !== null && sourceImage !== null;

  // ── Run generation pipeline ────────────────────────────────────────────────
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

      // Cache-bust the URLs so the browser reloads the new images
      const ts = `?t=${Date.now()}`;
      const refUrl = `${data.reference_image_url}${ts}`;
      const srcUrl = `${data.source_image_url}${ts}`;
      setGenRefUrl(refUrl);
      setGenSrcUrl(srcUrl);
      setGenDone(true);

      // Push generated pair into AppContext as pre-loaded images
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

      // If context exposes setReferenceImage / setSourceImage use those,
      // otherwise synthesise File objects from the blob URLs
      if (setRefMeta && setSrcMeta) {
        setRefMeta(refMeta);
        setSrcMeta(srcMeta);
      } else {
        // Fetch the generated images and load them as File objects
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
    <section id="view-upload" className="view-section active">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="screen-title">Image Upload</div>
        <span className="badge text-brand-400">T1 PAIRDESK · INGEST &amp; CONFIGURE</span>
        <div className="screen-subtitle w-full">
          Upload the Reference and Source images — or generate a synthetic pair from your own base image.
        </div>
      </div>

      {/* ── Mode toggle ── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          className={`px-4 py-2 rounded-lg text-[11px] font-mono tracking-wider border transition-all duration-200 ${
            genMode === 'none'
              ? 'bg-brand-500/15 border-brand-400/50 text-brand-300'
              : 'bg-transparent border-[rgba(146,196,255,0.15)] text-slate-400 hover:border-brand-400/30'
          }`}
          onClick={() => setGenMode('none')}
        >
          <UploadCloud className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
          UPLOAD EXISTING PAIR
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-[11px] font-mono tracking-wider border transition-all duration-200 ${
            genMode === 'config'
              ? 'bg-[rgba(111,246,255,0.1)] border-brand-300/50 text-brand-200'
              : 'bg-transparent border-[rgba(146,196,255,0.15)] text-slate-400 hover:border-brand-400/30'
          }`}
          onClick={() => setGenMode('config')}
        >
          <Zap className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
          GENERATE SYNTHETIC PAIR
        </button>
      </div>

      {/* ════════════════════════════════════════════
          MODE A: Upload existing pair
      ════════════════════════════════════════════ */}
      {genMode === 'none' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Reference */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-success tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(62,230,160,0.8)]" />
                REFERENCE / FIXED
              </h3>
              <span className="badge">LRO NAC / WAC</span>
            </div>
            <input
              ref={refInputRef} type="file" accept="image/*,.tif,.tiff,.lbl,.xml,.json"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) setReferenceFile(e.target.files[0]); }}
            />
            <div
              className="dropzone min-h-56 flex flex-col items-center justify-center cursor-pointer text-center px-4"
              onClick={() => refInputRef.current?.click()}
              onDragOver={e => e.preventDefault()} onDrop={handleRefDrop}
            >
              <div className="dz-icon mb-3.5"><UploadCloud className="w-5 h-5 text-brand-400" /></div>
              <div className="text-[13px] text-slate-200">
                {referenceImage ? referenceImage.name : 'Drop reference image here'}
              </div>
              <div className="font-mono text-[9px] text-slate-500 mt-1.5 tracking-[0.14em]">
                GEOTIFF / PDS · CLICK TO BROWSE
              </div>
              {referenceImage?.previewUrl && (
                <img src={referenceImage.previewUrl} alt="ref"
                  className="mt-3 max-h-32 rounded-lg border border-[rgba(146,196,255,0.2)] object-contain" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <div className="panel p-2.5"><div className="mini-label">Sensor</div><div className="text-slate-200 mt-1.5 text-[11px] font-mono">LRO NAC</div></div>
              <div className="panel p-2.5"><div className="mini-label">GSD</div><div className="text-slate-200 mt-1.5 text-[11px] font-mono">0.50 m/px</div></div>
              <div className="panel p-2.5"><div className="mini-label">Sun</div><div className="text-slate-200 mt-1.5 text-[11px] font-mono">142.1° / 34.5°</div></div>
            </div>
          </div>

          {/* Source */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-brand-300 tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(111,246,255,0.8)]" />
                SOURCE / MOVING
              </h3>
              <span className="badge">OHRC / TMC-2 / IIRS</span>
            </div>
            <input
              ref={srcInputRef} type="file" accept="image/*,.tif,.tiff,.lbl,.xml,.json"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) setSourceFile(e.target.files[0]); }}
            />
            <div
              className="dropzone min-h-56 flex flex-col items-center justify-center cursor-pointer text-center px-4"
              onClick={() => srcInputRef.current?.click()}
              onDragOver={e => e.preventDefault()} onDrop={handleSrcDrop}
            >
              <div className="dz-icon mb-3.5"><UploadCloud className="w-5 h-5 text-brand-400" /></div>
              <div className="text-[13px] text-slate-200">
                {sourceImage ? sourceImage.name : 'Drop source image here'}
              </div>
              <div className="font-mono text-[9px] text-slate-500 mt-1.5 tracking-[0.14em]">
                GEOTIFF / PDS · CLICK TO BROWSE
              </div>
              {sourceImage?.previewUrl && (
                <img src={sourceImage.previewUrl} alt="src"
                  className="mt-3 max-h-32 rounded-lg border border-[rgba(146,196,255,0.2)] object-contain" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <div className="panel p-2.5">
                <div className="mini-label">Sensor</div>
                <select value={sourceSensor} onChange={e => setSourceSensor(e.target.value)}
                  className="w-full mt-1.5 bg-transparent border-0 p-0 text-slate-200 text-[11px] font-mono">
                  <option>Chandrayaan-2 OHRC</option>
                  <option>Chandrayaan-2 TMC-2</option>
                  <option>Chandrayaan-2 IIRS (Multi-spectral)</option>
                </select>
              </div>
              <div className="panel p-2.5"><div className="mini-label">GSD</div><div className="text-slate-200 mt-1.5 text-[11px] font-mono">{sourceImage?.gsd || '0.25 m/px'}</div></div>
              <div className="panel p-2.5"><div className="mini-label">Sun</div><div className="text-slate-200 mt-1.5 text-[11px] font-mono">284.3° / 32.1°</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODE B: Generate synthetic pair
      ════════════════════════════════════════════ */}
      {genMode === 'config' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Left: base image upload */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-brand-300" />
              <h3 className="text-[13px] font-semibold text-white tracking-wide">BASE IMAGE INPUT</h3>
              <span className="badge text-slate-400 ml-auto">OPTIONAL — fallback to procedural</span>
            </div>

            <input
              ref={baseImgRef} type="file" accept="image/*,.tif,.tiff"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleBaseFilePick(e.target.files[0]); }}
            />

            <div
              className="dropzone min-h-52 flex flex-col items-center justify-center cursor-pointer text-center px-4"
              onClick={() => baseImgRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleBaseFilePick(e.dataTransfer.files[0]); }}
            >
              <div className="dz-icon mb-3.5">
                <UploadCloud className={`w-5 h-5 ${baseFile ? 'text-success' : 'text-brand-400'}`} />
              </div>
              <div className="text-[13px] text-slate-200">
                {baseFile ? baseFile.name : 'Drop your lunar image here'}
              </div>
              <div className="font-mono text-[9px] text-slate-500 mt-1.5 tracking-[0.14em]">
                PNG / TIFF / JPG · CLICK TO BROWSE
              </div>
              {basePreview && (
                <img src={basePreview} alt="base"
                  className="mt-3 max-h-36 rounded-lg border border-[rgba(62,230,160,0.25)] object-contain" />
              )}
              {!baseFile && (
                <p className="text-[10px] text-slate-500 mt-3 max-w-xs">
                  Leave empty to auto-generate a procedural lunar surface with craters and regolith texture.
                </p>
              )}
            </div>

            {baseFile && (
              <button
                onClick={() => { setBaseFile(null); setBasePreview(''); setGenDone(false); }}
                className="mt-3 text-[10px] font-mono text-slate-500 hover:text-warning transition-colors"
              >
                <RotateCcw className="inline w-3 h-3 mr-1" />CLEAR BASE IMAGE — USE PROCEDURAL
              </button>
            )}

            {/* Output size */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="panel p-3">
                <div className="mini-label mb-1.5">Output Width (px)</div>
                <input type="number" min={64} max={4096} step={64} value={imgW}
                  onChange={e => setImgW(parseInt(e.target.value) || 1024)}
                  className="w-full bg-transparent text-slate-200 font-mono text-[12px] border-0 outline-none" />
              </div>
              <div className="panel p-3">
                <div className="mini-label mb-1.5">Output Height (px)</div>
                <input type="number" min={64} max={4096} step={64} value={imgH}
                  onChange={e => setImgH(parseInt(e.target.value) || 1024)}
                  className="w-full bg-transparent text-slate-200 font-mono text-[12px] border-0 outline-none" />
              </div>
            </div>
          </div>

          {/* Right: transform parameters + run button */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Sliders className="w-4 h-4 text-brand-300" />
              <h3 className="text-[13px] font-semibold text-white tracking-wide">TRANSFORM PARAMETERS</h3>
            </div>

            <div className="space-y-5">
              <SliderRow label="Rotation"          unit="°"  value={rotDeg} min={-45}  max={45}  step={0.5}  onChange={setRotDeg}  color="#6ff6ff" />
              <SliderRow label="Scale Factor"       unit="×"  value={scale}  min={0.5}  max={1.5} step={0.01} onChange={setScale}   color="#a9dcff" />
              <SliderRow label="Translation X"      unit=" px" value={txPx}   min={-200} max={200} step={1}    onChange={setTxPx}   color="#3ee6a0" />
              <SliderRow label="Translation Y"      unit=" px" value={tyPx}   min={-200} max={200} step={1}    onChange={setTyPx}   color="#3ee6a0" />
              <SliderRow label="Illumination γ"     unit=""   value={gamma}  min={0.2}  max={2.0} step={0.05} onChange={setGamma}  color="#ffb65c" />
            </div>

            {/* Parameter preview */}
            <div className="mt-5 p-3 rounded-lg bg-[rgba(3,8,14,0.6)] border border-[rgba(146,196,255,0.1)] font-mono text-[10px] text-slate-400 space-y-1">
              <div>rotation_deg = <span className="text-brand-300">{rotDeg}</span></div>
              <div>scale        = <span className="text-brand-300">{scale}</span></div>
              <div>tx           = <span className="text-success">{txPx} px</span></div>
              <div>ty           = <span className="text-success">{tyPx} px</span></div>
              <div>gamma        = <span className="text-warning">{gamma}</span></div>
              <div>output_size  = <span className="text-slate-300">{imgW}×{imgH}</span></div>
            </div>

            {/* CTA */}
            <button
              className={`w-full mt-5 py-3 rounded-lg text-[12px] font-semibold tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                generating
                  ? 'bg-brand-500/10 border border-brand-400/30 text-brand-300 cursor-not-allowed'
                  : 'btn-primary'
              }`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-brand-300/40 border-t-brand-300 rounded-full animate-spin" />
                  RUNNING GENERATION PIPELINE…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  GENERATE SYNTHETIC PAIR
                </>
              )}
            </button>

            {genDone && (
              <div className="mt-3 p-3 rounded-lg bg-[rgba(62,230,160,0.07)] border border-success/25 text-[11px] text-success font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(62,230,160,0.8)] flex-shrink-0" />
                Pair generated and loaded. Proceed to registration.
              </div>
            )}
          </div>

          {/* Generated previews */}
          {genDone && (
            <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[
                { label: 'Reference (Fixed)', url: genRefUrl,  color: 'rgba(62,230,160,0.3)' },
                { label: 'Source / Synthetic Target (Moving)', url: genSrcUrl, color: 'rgba(111,246,255,0.3)' },
              ].map(({ label, url, color }) => (
                <div key={label} className="card p-4">
                  <div className="text-[11px] font-semibold text-white mb-3 tracking-wide">{label.toUpperCase()}</div>
                  <img src={url} alt={label}
                    className="w-full max-h-52 object-contain rounded-lg border"
                    style={{ borderColor: color }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pair Summary ── */}
      <div className="card bracket p-5 mt-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-[13px] font-semibold text-white tracking-wide">PAIR SUMMARY</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Metadata is used by the automatic matcher gate.</p>
          </div>
          <span className={`badge ${pairReady ? 'text-success border-[rgba(62,230,160,0.4)]' : 'text-slate-400'}`}>
            {pairReady ? 'PAIR READY FOR REGISTRATION' : 'WAITING FOR BOTH IMAGES'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="panel p-3"><div className="mini-label">Scale ratio</div><div className="text-white mt-1.5 font-mono text-[11px]">320× max</div></div>
          <div className="panel p-3"><div className="mini-label">Sun-angle</div><div className="text-warning mt-1.5 font-mono text-[11px]">142.6°</div></div>
          <div className="panel p-3"><div className="mini-label">GSD strategy</div><div className="text-white mt-1.5 font-mono text-[11px]">Common coarse</div></div>
          <div className="panel p-3"><div className="mini-label">Label parser</div><div className="text-white mt-1.5 font-mono text-[11px]">PDS3 / PDS4 / JSON</div></div>
        </div>
        <div className="flex gap-2.5 mt-4 flex-wrap">
          <button
            className="btn-primary px-5 py-2.5 rounded-lg text-[11px] tracking-wider"
            onClick={() => navigateTo('register')}
          >
            CONTINUE TO REGISTRATION ↗
          </button>
          <button
            className="btn-secondary px-5 py-2.5 rounded-lg text-[11px] tracking-wider"
            onClick={clearUploads}
          >
            CLEAR
          </button>
        </div>
      </div>
    </section>
  );
};
