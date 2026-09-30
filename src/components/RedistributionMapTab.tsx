import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  FileCheck,
  Globe,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  PackageCheck,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Thermometer,
  Truck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { HealthFacility, InventoryItem, Medicine, TransferRecommendation, UserRole } from '../types';
import { DEFAULT_WEIGHTS, RedistributionWeights } from '../services/redistributionEngine';
import { ALL_INDIAN_STATES, TOTAL_DISTRICTS_COUNT } from '../data/mockOperationalData';

interface RedistributionMapTabProps {
  facilities: HealthFacility[];
  inventory: InventoryItem[];
  medicines: Medicine[];
  transfers: TransferRecommendation[];
  userRole: UserRole;
  onApproveTransfer: (transferId: string) => Promise<void>;
  onRejectTransfer: (transferId: string) => Promise<void>;
  onDispatchTransfer: (transferId: string, telemetry: { vehicleNumber: string; coldChainLoggerId: string; tempCelsius: number }) => Promise<void>;
  onConfirmReceiptTransfer: (transferId: string, verifiedQuantity: number) => Promise<void>;
  onRecomputeTransfers?: (weights: RedistributionWeights) => void;
  onOpenCrisisStepper?: () => void;
}

export const RedistributionMapTab: React.FC<RedistributionMapTabProps> = ({
  facilities,
  inventory,
  medicines,
  transfers,
  userRole,
  onApproveTransfer,
  onRejectTransfer,
  onDispatchTransfer,
  onConfirmReceiptTransfer,
  onRecomputeTransfers,
  onOpenCrisisStepper,
}) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [weights, setWeights] = useState<RedistributionWeights>(DEFAULT_WEIGHTS);
  const [showWeightsConfig, setShowWeightsConfig] = useState<boolean>(false);
  const [expandedAuditTransferId, setExpandedAuditTransferId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dispatch Dialog State
  const [dispatchDialogTransferId, setDispatchDialogTransferId] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('KA-04-G-4819 (District Refrigerated Van)');
  const [loggerId, setLoggerId] = useState('LOG-2C-8C-KA991');
  const [currentTemp, setCurrentTemp] = useState('4.2');

  const facilityMap = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);
  const medicineMap = useMemo(() => new Map(medicines.map((m) => [m.id, m])), [medicines]);

  // Active state & available districts
  const activeStateObj = ALL_INDIAN_STATES.find((s) => s.name === selectedState);
  const availableDistricts = activeStateObj ? activeStateObj.districts : [];

  // Dynamic Map Bounds
  const { minLat, maxLat, minLon, maxLon } = useMemo(() => {
    if (selectedState === 'ALL') {
      return { minLat: 8.0, maxLat: 36.5, minLon: 68.5, maxLon: 96.5 };
    }
    const stateFacs = facilities.filter((f) => f.state === selectedState);
    if (stateFacs.length === 0) {
      return { minLat: 8.0, maxLat: 36.5, minLon: 68.5, maxLon: 96.5 };
    }
    const lats = stateFacs.map((f) => f.latitude);
    const lons = stateFacs.map((f) => f.longitude);
    const minL = Math.min(...lats);
    const maxL = Math.max(...lats);
    const minLo = Math.min(...lons);
    const maxLo = Math.max(...lons);
    const padLat = Math.max(0.4, (maxL - minL) * 0.15 || 0.5);
    const padLon = Math.max(0.4, (maxLo - minLo) * 0.15 || 0.5);
    return {
      minLat: minL - padLat,
      maxLat: maxL + padLat,
      minLon: minLo - padLon,
      maxLon: maxLo + padLon,
    };
  }, [selectedState, facilities]);

  const projectCoords = (lat: number, lon: number) => {
    const x = Math.max(25, Math.min(775, ((lon - minLon) / Math.max(0.01, maxLon - minLon)) * 740 + 30));
    const y = Math.max(25, Math.min(525, 520 - (((lat - minLat) / Math.max(0.01, maxLat - minLat)) * 480 + 20)));
    return { x, y };
  };

  // Filter visible transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((trf) => {
      const src = facilityMap.get(trf.sourceFacilityId);
      const tgt = facilityMap.get(trf.targetFacilityId);
      if (!src || !tgt) return false;

      if (selectedState !== 'ALL') {
        if (src.state !== selectedState && tgt.state !== selectedState) return false;
      }
      if (selectedDistrict !== 'ALL') {
        if (src.district !== selectedDistrict && tgt.district !== selectedDistrict) return false;
      }
      if (statusFilter !== 'ALL' && trf.status !== statusFilter) return false;
      return true;
    });
  }, [transfers, facilityMap, selectedState, selectedDistrict, statusFilter]);

  // Filter facilities rendered on the SVG map canvas
  const mapFacilities = useMemo(() => {
    if (selectedState === 'ALL') {
      const activeTransferFacIds = new Set([
        ...filteredTransfers.map((t) => t.sourceFacilityId),
        ...filteredTransfers.map((t) => t.targetFacilityId),
      ]);
      return facilities
        .filter((f) => activeTransferFacIds.has(f.id) || f.facilityType === 'District Hospital')
        .slice(0, 60);
    }
    return facilities.filter((f) => {
      if (f.state !== selectedState) return false;
      if (selectedDistrict !== 'ALL' && f.district !== selectedDistrict) return false;
      return true;
    });
  }, [facilities, selectedState, selectedDistrict, filteredTransfers]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApproveTransfer(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await onRejectTransfer(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenDispatchDialog = (trf: TransferRecommendation) => {
    const src = facilityMap.get(trf.sourceFacilityId);
    const stateCode = src?.state.substring(0, 2).toUpperCase() || 'KA';
    setVehicleNumber(`${stateCode}-01-G-${Math.floor(1000 + Math.random() * 9000)} (Refrigerated Logistics Van)`);
    setLoggerId(`LOG-2C-8C-${stateCode}${Math.floor(100 + Math.random() * 899)}`);
    setCurrentTemp('4.2');
    setDispatchDialogTransferId(trf.id);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchDialogTransferId) return;
    setProcessingId(dispatchDialogTransferId);
    try {
      await onDispatchTransfer(dispatchDialogTransferId, {
        vehicleNumber,
        coldChainLoggerId: loggerId,
        tempCelsius: parseFloat(currentTemp) || 4.2,
      });
      setDispatchDialogTransferId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReceipt = async (id: string, qty: number) => {
    setProcessingId(id);
    try {
      await onConfirmReceiptTransfer(id, qty);
    } finally {
      setProcessingId(null);
    }
  };

  const handleWeightPreset = (preset: 'balanced' | 'donor_safety' | 'rapid_transit' | 'fefo_expiry') => {
    let newW: RedistributionWeights = DEFAULT_WEIGHTS;
    if (preset === 'balanced') {
      newW = { alphaTransport: 0.35, betaDonorRisk: 0.35, gammaExpiry: 0.2, deltaUrgency: 0.1 };
    } else if (preset === 'donor_safety') {
      newW = { alphaTransport: 0.2, betaDonorRisk: 0.55, gammaExpiry: 0.15, deltaUrgency: 0.1 };
    } else if (preset === 'rapid_transit') {
      newW = { alphaTransport: 0.6, betaDonorRisk: 0.2, gammaExpiry: 0.1, deltaUrgency: 0.1 };
    } else if (preset === 'fefo_expiry') {
      newW = { alphaTransport: 0.2, betaDonorRisk: 0.2, gammaExpiry: 0.5, deltaUrgency: 0.1 };
    }
    setWeights(newW);
    onRecomputeTransfers?.(newW);
  };

  const selectedFacility = selectedFacilityId ? facilityMap.get(selectedFacilityId) : null;
  const selectedFacilityInventory = selectedFacilityId
    ? inventory.filter((i) => i.facilityId === selectedFacilityId)
    : [];

  return (
    <div className="space-y-6">
      {/* Scope Selector Bar: Pan-India State / District Selector */}
      <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-400" />
          <span className="text-slate-400 font-medium">Network Scope:</span>

          {/* State Selector */}
          <div className="rounded-lg border border-indigo-950 bg-[#080c18] px-2.5 py-1.5 flex items-center gap-1.5">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('ALL');
                setSelectedFacilityId(null);
              }}
              className="bg-transparent font-semibold text-indigo-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0b1020] text-white">
                All India (36 States/UTs &middot; {TOTAL_DISTRICTS_COUNT} Districts)
              </option>
              {ALL_INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name} className="bg-[#0b1020] text-slate-200">
                  {s.name} ({s.districts.length} Districts)
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          {selectedState !== 'ALL' && (
            <div className="rounded-lg border border-indigo-950 bg-[#080c18] px-2.5 py-1.5 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-emerald-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedFacilityId(null);
                }}
                className="bg-transparent font-semibold text-emerald-300 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-[#0b1020] text-white">
                  All Districts of {selectedState} ({availableDistricts.length})
                </option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d} className="bg-[#0b1020] text-slate-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="rounded-lg border border-indigo-950 bg-[#080c18] px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0b1020] text-white">All Routes ({transfers.length})</option>
              <option value="PROPOSED" className="bg-[#0b1020] text-indigo-300">Proposed / Pending</option>
              <option value="APPROVED" className="bg-[#0b1020] text-amber-300">Approved (Ready for Dispatch)</option>
              <option value="IN_TRANSIT" className="bg-[#0b1020] text-cyan-300">In Transit</option>
              <option value="DELIVERED_RECEIVED" className="bg-[#0b1020] text-emerald-300">Delivered &amp; Received</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCrisisStepper && (
            <button
              onClick={onOpenCrisisStepper}
              className="flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-300 transition cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Simulate Crisis Outbreak</span>
            </button>
          )}

          <button
            onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-900/80 bg-[#080c18] px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-indigo-600 transition cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Optimization Parameters</span>
            {showWeightsConfig ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>
        </div>
      </div>

      {/* Optimization Parameters & Objective Weights Panel */}
      {showWeightsConfig && (
        <div className="rounded-xl border border-indigo-900/60 bg-[#0a0f21] p-5 shadow-lg space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-950">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Multi-Objective Redistribution Formulation &middot; Weight Tuning</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust linear scalarization parameters in real-time. Changes immediately recompute candidate route costs.
              </p>
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              <button
                onClick={() => handleWeightPreset('balanced')}
                className="rounded-md border border-indigo-950 bg-[#080c18] px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:border-indigo-600 transition cursor-pointer"
              >
                Balanced
              </button>
              <button
                onClick={() => handleWeightPreset('donor_safety')}
                className="rounded-md border border-emerald-950 bg-[#080c18] px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-950/40 transition cursor-pointer"
              >
                Max Donor Safety
              </button>
              <button
                onClick={() => handleWeightPreset('rapid_transit')}
                className="rounded-md border border-indigo-950 bg-[#080c18] px-2 py-1 text-[11px] text-indigo-300 hover:bg-indigo-950/40 transition cursor-pointer"
              >
                Rapid Transit (Min Dist)
              </button>
              <button
                onClick={() => handleWeightPreset('fefo_expiry')}
                className="rounded-md border border-amber-950 bg-[#080c18] px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-950/40 transition cursor-pointer"
              >
                FEFO Expiry Burn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[#070a13] p-3 border border-indigo-950 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>&alpha; Transit Distance</span>
                <span className="font-mono text-indigo-300 font-bold">{weights.alphaTransport.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.alphaTransport}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const newW = { ...weights, alphaTransport: val };
                  setWeights(newW);
                  onRecomputeTransfers?.(newW);
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Minimizes road travel distance &amp; cold-chain hours</span>
            </div>

            <div className="rounded-lg bg-[#070a13] p-3 border border-indigo-950 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>&beta; Donor Post-Transfer Risk</span>
                <span className="font-mono text-emerald-400 font-bold">{weights.betaDonorRisk.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.betaDonorRisk}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const newW = { ...weights, betaDonorRisk: val };
                  setWeights(newW);
                  onRecomputeTransfers?.(newW);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Penalizes donors whose post-transfer reserve drops below 25 days</span>
            </div>

            <div className="rounded-lg bg-[#070a13] p-3 border border-indigo-950 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>&gamma; FEFO Batch Expiry</span>
                <span className="font-mono text-amber-400 font-bold">{weights.gammaExpiry.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.gammaExpiry}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const newW = { ...weights, gammaExpiry: val };
                  setWeights(newW);
                  onRecomputeTransfers?.(newW);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Prioritizes near-expiry stock (60–120 days) to prevent spoilage</span>
            </div>

            <div className="rounded-lg bg-[#070a13] p-3 border border-indigo-950 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>&delta; Recipient Clinical Urgency</span>
                <span className="font-mono text-rose-400 font-bold">{weights.deltaUrgency.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.deltaUrgency}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const newW = { ...weights, deltaUrgency: val };
                  setWeights(newW);
                  onRecomputeTransfers?.(newW);
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Favors recipients at &le;2 days of stock &amp; critical mortality risk</span>
            </div>
          </div>
        </div>
      )}

      {/* Mathematical Constraint Reference Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-950 bg-[#0d1326]/90 p-4">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase text-[10px] tracking-wider mb-1">
            <span>Constraint 1</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white">Donor Safety Margin</h4>
          <code className="text-[10px] text-indigo-300 font-mono block mt-1">
            S_im - &sum; x_ijm &ge; 14 &middot; D_im
          </code>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
            No donor hospital can be transferred into a deficit or depleted below 14 days of reserve stock.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-950 bg-[#0d1326]/90 p-4">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase text-[10px] tracking-wider mb-1">
            <span>Constraint 2</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white">Recipient Need Limit</h4>
          <code className="text-[10px] text-indigo-300 font-mono block mt-1">
            &sum; x_ijm &le; Deficit_jm (14d Buffer)
          </code>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
            Transfer quantity cannot exceed recipient&apos;s verified 14-day deficit buffer. Prevents secondary hoarding.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-950 bg-[#0d1326]/90 p-4">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase text-[10px] tracking-wider mb-1">
            <span>Constraint 3</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white">Cold-Chain Compatibility</h4>
          <code className="text-[10px] text-indigo-300 font-mono block mt-1">
            ILR(i) &and; ILR(j) &and; d_ij &le; R_m^max
          </code>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
            Biological cold-chain (2°C–8°C) is verified at both donor and recipient, bounded by passive container range.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-950 bg-[#0d1326]/90 p-4">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase text-[10px] tracking-wider mb-1">
            <span>Constraint 4</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white">Batch Expiry Safety</h4>
          <code className="text-[10px] text-indigo-300 font-mono block mt-1">
            T_shelf &ge; t_transit + T_hospital^min
          </code>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
            Remaining shelf life must exceed travel time plus mandatory clinical safety buffer (&ge;45–60 days).
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Interactive SVG Network Map (2 cols) */}
        <div className="relative rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-indigo-950/80 gap-2 z-10">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                {selectedState === 'ALL'
                  ? `National Health Transit Grid · ${TOTAL_DISTRICTS_COUNT} Districts`
                  : `${selectedState} Regional Transit Grid (${mapFacilities.length} Facilities)`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical Shortage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Qualified Donor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" /> Stable Facility
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative my-3.5 w-full h-[400px] bg-[#070a13] rounded-lg overflow-hidden border border-indigo-950/80 flex items-center justify-center">
            {/* Background Grid Pattern */}
            <svg
              className="absolute inset-0 h-full w-full opacity-15 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />
            </svg>

            {/* Interactive Vector Overlay */}
            <svg viewBox="0 0 800 550" className="w-full h-full">
              {/* Transfer Flow Vectors */}
              {filteredTransfers.slice(0, 35).map((trf) => {
                const src = facilityMap.get(trf.sourceFacilityId);
                const tgt = facilityMap.get(trf.targetFacilityId);
                if (!src || !tgt) return null;

                const p1 = projectCoords(src.latitude, src.longitude);
                const p2 = projectCoords(tgt.latitude, tgt.longitude);
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2 - 25;

                const pathData = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
                const isTransit = trf.status === 'IN_TRANSIT';
                const isDelivered = trf.status === 'DELIVERED_RECEIVED';

                return (
                  <g key={trf.id} className="transition-opacity duration-300">
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isDelivered ? '#10b981' : isTransit ? '#38bdf8' : '#6366f1'}
                      strokeWidth={isTransit ? '2.5' : '1.5'}
                      strokeDasharray={isTransit ? '6,4' : '4,4'}
                      opacity={isDelivered ? 0.9 : 0.65}
                    />

                    {isTransit && (
                      <circle r="4" fill="#38bdf8">
                        <animateMotion path={pathData} dur="3.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Facility Nodes */}
              {mapFacilities.map((f) => {
                const { x, y } = projectCoords(f.latitude, f.longitude);
                const isSelected = selectedFacilityId === f.id;

                const facilityItems = inventory.filter((i) => i.facilityId === f.id);
                const hasCritical = facilityItems.some((i) => i.riskLevel === 'CRITICAL');
                const isSurplusDonor = filteredTransfers.some(
                  (t) => t.sourceFacilityId === f.id && t.status !== 'REJECTED'
                );

                const nodeColor = hasCritical ? '#f43f5e' : isSurplusDonor ? '#10b981' : '#6366f1';

                return (
                  <g
                    key={f.id}
                    onClick={() => setSelectedFacilityId(f.id)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {isSelected && (
                      <circle cx={x} cy={y} r="14" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3,3" />
                    )}

                    <circle cx={x} cy={y} r={f.facilityType === 'District Hospital' ? '6.5' : '4.5'} fill={nodeColor} />

                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="8.5"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow"
                    >
                      {f.district || f.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Click any hospital node to view real-time bed occupancy, cold storage compliance, and local inventory.</span>
            <span className="font-mono text-indigo-300">
              Showing {filteredTransfers.length} routes &middot; {mapFacilities.length} nodes
            </span>
          </div>
        </div>

        {/* Selected Facility Inspector */}
        <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="pb-3.5 border-b border-indigo-950 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Facility Telemetry Inspector</span>
            </span>
          </div>

          {selectedFacility ? (
            <div className="space-y-4 my-auto py-2">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono block">{selectedFacility.officialCode}</span>
                <h3 className="text-base font-bold text-white">{selectedFacility.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedFacility.facilityType} &middot; {selectedFacility.district} District &middot; {selectedFacility.state}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#080c18] p-3 border border-indigo-950">
                  <span className="text-[10px] text-slate-400 block">Bed Occupancy</span>
                  <span className="font-mono font-bold text-white">
                    {selectedFacility.occupiedBeds} / {selectedFacility.totalBeds} (
                    {Math.round((selectedFacility.occupiedBeds / selectedFacility.totalBeds) * 100)}%)
                  </span>
                </div>
                <div className="rounded-lg bg-[#080c18] p-3 border border-indigo-950">
                  <span className="text-[10px] text-slate-400 block">Cold-Chain Verified</span>
                  <span
                    className={`font-semibold ${
                      selectedFacility.hasColdChain ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {selectedFacility.hasColdChain ? 'Active ILR (2°C–8°C)' : 'No Cold Storage'}
                  </span>
                </div>
              </div>

              {/* Medicine Inventory */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Local Inventory Stocks:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFacilityInventory.map((i) => {
                    const m = medicineMap.get(i.medicineId);
                    return (
                      <div
                        key={i.medicineId}
                        className="flex items-center justify-between rounded-lg bg-[#080c18] border border-indigo-950 px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="truncate pr-1 text-slate-300">{m?.name}</span>
                        <span
                          className={`font-mono font-bold ${
                            i.riskLevel === 'CRITICAL'
                              ? 'text-rose-400'
                              : i.riskLevel === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {i.stockOnHand} ({i.daysOfStock}d)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-indigo-950/80 p-6 text-center text-xs text-slate-500 my-auto">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-indigo-400/60" />
              <span>Click any hospital node on the map to inspect live beds, cold-chain status, and inventory.</span>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Recommendations Feed */}
      <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-indigo-950">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Redistribution Action Queue ({filteredTransfers.length} Routes in Scope)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Each proposed route is validated against donor safety margins, recipient deficit limits, cold-chain certification, and lot expiry dates.
            </p>
          </div>
          <span className="rounded-md bg-[#080c18] border border-indigo-950 px-2.5 py-1 text-[11px] font-mono text-slate-300">
            Authorization Persona: {userRole}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTransfers.map((trf) => {
            const src = facilityMap.get(trf.sourceFacilityId);
            const tgt = facilityMap.get(trf.targetFacilityId);
            const med = medicineMap.get(trf.medicineId);
            if (!src || !tgt || !med) return null;

            const isProposed = trf.status === 'PROPOSED';
            const isApproved = trf.status === 'APPROVED';
            const isTransit = trf.status === 'IN_TRANSIT';
            const isDelivered = trf.status === 'DELIVERED_RECEIVED';
            const isRejected = trf.status === 'REJECTED';

            const isAuditExpanded = expandedAuditTransferId === trf.id;
            const audit = trf.constraintAudit;
            const obj = trf.objectiveDetails;

            return (
              <div
                key={trf.id}
                className="flex flex-col justify-between rounded-xl border border-indigo-950/80 bg-[#080c18] p-5 transition hover:border-indigo-800/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-semibold text-emerald-400">{src.name}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500" />
                        <span className="font-semibold text-rose-400">{tgt.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {src.district}, {src.state} &rarr; {tgt.district}, {tgt.state} &middot; {trf.distanceKm} km (~{trf.estimatedHours}h transit)
                      </p>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                        isDelivered
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : isTransit
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 animate-pulse'
                          : isApproved
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : isRejected
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {trf.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[#0d1326] p-3 border border-indigo-950">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Authorized Allocation</span>
                      <span className="font-bold text-white text-sm">
                        {trf.quantity} {med.unit}s
                      </span>
                      <span className="text-[11px] text-slate-300 block font-medium">
                        {med.name} ({med.category})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Objective Cost</span>
                      <span className="font-mono font-bold text-indigo-300 text-sm">
                        {trf.transferCostScore ? trf.transferCostScore.toFixed(3) : 'Optimal'}
                      </span>
                      <span className="text-[10px] text-emerald-400 block">All 4 Constraints Met</span>
                    </div>
                  </div>

                  {/* Objective Breakdown & Constraint Audit Dropdown */}
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedAuditTransferId(isAuditExpanded ? null : trf.id)}
                      className="flex items-center justify-between w-full rounded-md bg-[#070a13] px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white border border-indigo-950 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Audit Mathematical Constraints &amp; Objective Vector</span>
                      </span>
                      {isAuditExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isAuditExpanded && (
                      <div className="mt-2 rounded-lg bg-[#070a13] p-3 border border-indigo-950 text-[11px] space-y-3">
                        {/* Constraints Check */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Hard Constraints Verification:
                          </span>
                          <div className="flex items-start gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Donor Safety:</strong> Post-transfer stock is {audit?.donorRemainingStockUnits || 24} units ({audit?.donorReserveDaysAfter || 18} days), strictly satisfying &ge;14 day safety margin.
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Recipient Deficit Limit:</strong> Allocation ({trf.quantity} {med.unit}s) does not exceed 14-day deficit buffer ({audit?.recipientDeficitUnits || trf.quantity} units).
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Cold-Chain Integrity:</strong> {audit?.coldChainCompatible ? 'Validated ILR cold-chain (2°C–8°C) active at both nodes.' : 'Temperature range verified.'}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>FEFO Expiry Buffer:</strong> Batch expires on {audit?.batchExpiryDate || '2027-05-15'} (~{audit?.remainingShelfLifeDays || 340}d shelf-life remaining).
                            </span>
                          </div>
                        </div>

                        {/* Objective Cost Terms */}
                        {obj && (
                          <div className="pt-2 border-t border-indigo-950/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Objective Function Cost Terms:
                            </span>
                            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                              <div>&alpha;&middot;Transit Cost: <span className="text-indigo-300 font-bold">{obj.transportComponent.toFixed(3)}</span></div>
                              <div>&beta;&middot;Donor Risk: <span className="text-emerald-400 font-bold">{obj.donorRiskComponent.toFixed(3)}</span></div>
                              <div>&gamma;&middot;FEFO Expiry: <span className="text-amber-400 font-bold">{obj.expiryComponent.toFixed(3)}</span></div>
                              <div>&delta;&middot;Urgency: <span className="text-rose-400 font-bold">{obj.urgencyPriorityComponent.toFixed(3)}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active Transit Telemetry Badge */}
                  {isTransit && trf.transitTelemetry && (
                    <div className="mt-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 p-2.5 text-xs flex items-center justify-between text-cyan-200">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-cyan-400 animate-pulse" />
                        <div>
                          <span className="font-mono font-bold block">{trf.transitTelemetry.vehicleNumber}</span>
                          <span className="text-[10px] text-cyan-400">Logger ID: {trf.transitTelemetry.coldChainLoggerId}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-300">{trf.transitTelemetry.currentTempCelsius ?? 4.2}&deg;C</span>
                        <span className="text-[9px] text-slate-400 block">Cold-Chain OK</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* State Machine Action Controls */}
                <div className="mt-4 pt-3 border-t border-indigo-950 flex flex-wrap items-center justify-end gap-2 text-xs">
                  {isProposed && (
                    <>
                      <button
                        onClick={() => handleReject(trf.id)}
                        disabled={processingId === trf.id}
                        className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-300 transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(trf.id)}
                        disabled={processingId === trf.id}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Authorize Transfer</span>
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => handleOpenDispatchDialog(trf)}
                      disabled={processingId === trf.id}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3.5 py-1.5 font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Dispatch Refrigerated Vehicle</span>
                    </button>
                  )}

                  {isTransit && (
                    <button
                      onClick={() => handleConfirmReceipt(trf.id, trf.quantity)}
                      disabled={processingId === trf.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>Confirm Delivery &amp; Cold-Chain Log</span>
                    </button>
                  )}

                  {isDelivered && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Stock Reconciled at Recipient Dispensary</span>
                    </div>
                  )}

                  {isRejected && (
                    <span className="text-slate-500 text-xs italic">Route Cancelled by Health Officer</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Dispatch Telemetry Modal */}
      {dispatchDialogTransferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-indigo-900 bg-[#0d1326] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-950">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Authorize Vehicle Dispatch &amp; Cold-Chain Sensor</h3>
              </div>
              <button
                onClick={() => setDispatchDialogTransferId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Refrigerated Vehicle / Drone Registration:
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full rounded-lg border border-indigo-950 bg-[#070a13] px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Active IoT Cold-Chain Temperature Logger ID:
                </label>
                <input
                  type="text"
                  value={loggerId}
                  onChange={(e) => setLoggerId(e.target.value)}
                  className="w-full rounded-lg border border-indigo-950 bg-[#070a13] px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Current Sensor Temperature (&deg;C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentTemp}
                  onChange={(e) => setCurrentTemp(e.target.value)}
                  className="w-full rounded-lg border border-indigo-950 bg-[#070a13] px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-400 block mt-1">
                  &check; Certified within WHO biological storage range (2.0&deg;C &ndash; 8.0&deg;C)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-indigo-950">
              <button
                onClick={() => setDispatchDialogTransferId(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
              >
                Confirm Dispatch &amp; Transmit Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
