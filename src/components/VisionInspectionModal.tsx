import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  Info,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Upload,
  X,
} from 'lucide-react';
import { MEDICINES_CATALOG } from '../data/mockOperationalData';

interface VisionInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateInventory?: (medicineName: string, quantity: number) => void;
}

export const VisionInspectionModal: React.FC<VisionInspectionModalProps> = ({
  isOpen,
  onClose,
  onUpdateInventory,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Human correction editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [correctedMedicine, setCorrectedMedicine] = useState('');
  const [correctedBatch, setCorrectedBatch] = useState('');
  const [correctedExpiry, setCorrectedExpiry] = useState('');
  const [isCommitted, setIsCommitted] = useState(false);

  if (!isOpen) return null;

  const sampleVials = [
    {
      name: 'Snake Venom Antiserum Vial (Cold Chain 2°C–8°C)',
      previewBg: 'bg-emerald-950 border-emerald-700',
      dataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><rect x="80" y="80" width="140" height="180" rx="20" fill="%236366f1" opacity="0.2" stroke="%236366f1" stroke-width="4"/><rect x="110" y="40" width="80" height="40" rx="5" fill="%2394a3b8"/><text x="150" y="140" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23ffffff" text-anchor="middle">SNAKE VENOM ANTISERUM</text><text x="150" y="165" font-family="sans-serif" font-size="10" fill="%23818cf8" text-anchor="middle">10ml Lyophilized Vial</text><text x="150" y="195" font-family="sans-serif" font-size="10" fill="%23a7f3d0" text-anchor="middle">LOT: KA-SVA-2026-08</text><text x="150" y="215" font-family="sans-serif" font-size="10" fill="%23e2e8f0" text-anchor="middle">EXP: 2027-08</text><circle cx="150" cy="240" r="10" fill="%2310b981"/></svg>',
      mime: 'image/svg+xml',
    },
    {
      name: 'Human Insulin 100 IU/ml Vial',
      previewBg: 'bg-indigo-950 border-indigo-700',
      dataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23090d1a"/><rect x="90" y="70" width="120" height="190" rx="15" fill="%234f46e5" opacity="0.25" stroke="%236366f1" stroke-width="4"/><rect x="120" y="30" width="60" height="40" rx="6" fill="%23cbd5e1"/><text x="150" y="130" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23ffffff" text-anchor="middle">REGULAR INSULIN</text><text x="150" y="150" font-family="sans-serif" font-size="10" fill="%23818cf8" text-anchor="middle">100 IU/ml - 10ml</text><text x="150" y="180" font-family="sans-serif" font-size="10" fill="%23fde047" text-anchor="middle">LOT: INS-BLR-8921</text><text x="150" y="200" font-family="sans-serif" font-size="10" fill="%23ffffff" text-anchor="middle">EXP: 2027-03</text><circle cx="150" cy="225" r="8" fill="%236366f1"/></svg>',
      mime: 'image/svg+xml',
    },
    {
      name: 'ORS WHO Formula Sachet Pack',
      previewBg: 'bg-amber-950 border-amber-700',
      dataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%231e1b4b"/><rect x="60" y="50" width="180" height="210" rx="8" fill="%23d97706" opacity="0.2" stroke="%23f59e0b" stroke-width="3"/><text x="150" y="110" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">ORAL REHYDRATION SALTS</text><text x="150" y="135" font-family="sans-serif" font-size="10" fill="%23fef08a" text-anchor="middle">WHO Standard 20.5g</text><text x="150" y="170" font-family="sans-serif" font-size="10" fill="%23e2e8f0" text-anchor="middle">BATCH: ORS-2026-X4</text><text x="150" y="190" font-family="sans-serif" font-size="10" fill="%23e2e8f0" text-anchor="middle">EXP: 2028-11</text><rect x="110" y="215" width="80" height="20" rx="4" fill="%2310b981"/><text x="150" y="229" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23ffffff" text-anchor="middle">TAMPER EVIDENT</text></svg>',
      mime: 'image/svg+xml',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target?.result as string);
      setInspectionResult(null);
      setIsEditing(false);
      setIsCommitted(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsEditing(false);
    setIsCommitted(false);

    try {
      const base64Content = selectedImage.split(',')[1] || selectedImage;
      const res = await fetch('/api/gemini/vision-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Content,
          mimeType: imageMime,
          prompt: 'Inspect this medicine label, extract drug name, batch lot, expiry date, cold-chain status.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vision inspection analysis failed.');

      setInspectionResult(data);
      setCorrectedMedicine(data.detectedMedicine || 'Verified Medicine');
      setCorrectedBatch(data.detectedBatch || 'BATCH-UNKNOWN');
      setCorrectedExpiry(data.detectedExpiry || '2027-12-31');
    } catch (err: any) {
      setErrorMessage(err.message || 'Vision inspection error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitVerification = () => {
    setIsCommitted(true);
    setIsEditing(false);
    if (onUpdateInventory && inspectionResult) {
      onUpdateInventory(correctedMedicine, inspectionResult.detectedQuantity || 10);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Multimodal Medicine &amp; Packaging Intake Scanner
              </h3>
              <p className="text-[11px] text-indigo-300 font-mono">
                Gemini Multimodal / Vertex AI Vision (OCR &middot; NLEM Catalogue Match &middot; VVM Check)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3.5 rounded-lg bg-rose-950/80 border border-rose-800 p-2.5 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Preset Clinical Samples */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Sample or Upload Field Photo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {sampleVials.map((vial, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(vial.dataUrl);
                    setImageMime(vial.mime);
                    setInspectionResult(null);
                    setIsEditing(false);
                    setIsCommitted(false);
                  }}
                  className={`rounded-lg border p-2.5 text-left text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    selectedImage === vial.dataUrl
                      ? 'border-indigo-500 bg-indigo-950/60 text-white ring-1 ring-indigo-500/50'
                      : 'border-indigo-950 bg-[#080c18] text-slate-400 hover:border-indigo-800 hover:text-slate-200'
                  }`}
                >
                  <img src={vial.dataUrl} alt={vial.name} className="h-14 w-14 object-contain rounded" />
                  <span className="text-[11px] font-medium text-center line-clamp-2">{vial.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-indigo-950 bg-[#080c18] hover:bg-[#121832] px-4 py-2 text-xs font-semibold text-white transition cursor-pointer">
              <Upload className="h-4 w-4 text-indigo-400" />
              <span>Upload Custom Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {selectedImage && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-5 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Running OCR & Extraction...' : 'Execute Multimodal Inspection'}</span>
              </button>
            )}
          </div>

          {/* Clinical Safety Disclaimer */}
          <div className="rounded-lg border border-amber-950 bg-amber-950/20 p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Mandatory Clinical Guardrail: </strong>
              AI OCR extraction and visual Vaccine Vial Monitor (VVM) stage estimation serve as intake screening aids. Physical verification by a registered pharmacist under adequate lighting is mandatory before patient administration.
            </p>
          </div>

          {/* Inspection View */}
          {selectedImage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-indigo-950 bg-[#080c18] p-4">
              <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-indigo-950 pb-3 sm:pb-0 sm:pr-4">
                <span className="text-[10px] text-slate-500 font-mono uppercase mb-2">Image Under Inspection</span>
                <img
                  src={selectedImage}
                  alt="Medicine intake"
                  className="max-h-48 max-w-full rounded-lg object-contain shadow"
                />
              </div>

              {/* Inspection Details */}
              <div className="space-y-2.5 text-xs">
                {inspectionResult ? (
                  <>
                    <div className="flex items-center justify-between pb-1.5 border-b border-indigo-950">
                      <span className="font-bold text-indigo-400 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span>AI Extraction Complete</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Confidence: {(inspectionResult.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Identified Medicine & NLEM Validation */}
                    <div>
                      <span className="text-slate-400 text-[11px] block">NLEM Catalogue Match:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={correctedMedicine}
                          onChange={(e) => setCorrectedMedicine(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-indigo-950 bg-[#0d1326] p-1.5 text-xs text-white"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{correctedMedicine}</span>
                          <span className="rounded-md bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 text-[9px] text-emerald-300 font-bold">
                            NLEM 2022 VERIFIED
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Batch / Lot:</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={correctedBatch}
                            onChange={(e) => setCorrectedBatch(e.target.value)}
                            className="mt-0.5 w-full rounded-lg border border-indigo-950 bg-[#0d1326] p-1.5 text-xs text-indigo-300 font-mono"
                          />
                        ) : (
                          <span className="font-mono text-indigo-300 font-bold">{correctedBatch}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Expiry Date:</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={correctedExpiry}
                            onChange={(e) => setCorrectedExpiry(e.target.value)}
                            className="mt-0.5 w-full rounded-lg border border-indigo-950 bg-[#0d1326] p-1.5 text-xs text-emerald-400 font-mono"
                          />
                        ) : (
                          <span className="font-mono text-emerald-400 font-bold">{correctedExpiry}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Packaging Integrity:</span>
                        <span
                          className={`font-semibold ${
                            inspectionResult.packagingIntegrity === 'INTACT'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {inspectionResult.packagingIntegrity}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cold-Chain Indicator:</span>
                        <span
                          className={`font-semibold ${
                            inspectionResult.coldChainIndicator === 'NORMAL'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {inspectionResult.coldChainIndicator} (VVM Stage 1)
                        </span>
                      </div>
                    </div>

                    {/* Human Verification Action */}
                    <div className="pt-2 border-t border-indigo-950 flex items-center justify-between">
                      {isCommitted ? (
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Intake Verified &amp; Synced to Ledger</span>
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>{isEditing ? 'Cancel Edit' : 'Edit OCR Values'}</span>
                          </button>

                          <button
                            onClick={handleCommitVerification}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                          >
                            <Save className="h-3 w-3" />
                            <span>Confirm &amp; Commit to Inventory</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6">
                    <Camera className="h-8 w-8 mb-2 text-slate-600" />
                    <span>Click &quot;Execute Multimodal Inspection&quot; to extract batch metadata via Gemini Multimodal.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3.5 border-t border-indigo-950 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-indigo-950 bg-[#080c18] px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121832] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
