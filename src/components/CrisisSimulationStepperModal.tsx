import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  FileCheck,
  PackageCheck,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';

interface CrisisSimulationStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteFullWorkflow?: () => void;
}

export const CrisisSimulationStepperModal: React.FC<CrisisSimulationStepperModalProps> = ({
  isOpen,
  onClose,
  onExecuteFullWorkflow,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'stepper' | 'comparison'>('stepper');

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Monsoon Envenomation Spike & Shortage Prediction',
      icon: AlertTriangle,
      badge: 'PREDICTION STAGE',
      color: 'border-rose-900/60 bg-rose-950/20 text-rose-300',
      description:
        'Hoskote Community Health Centre experiences an unexpected surge in snakebite envenomations following heavy rainfall. The current stock is only 8 vials. Vertex AI Tabular ML predicts depletion within 1.6 days (< 48 hours).',
      telemetry: {
        facility: 'Hoskote CHC (Bengaluru Rural)',
        medicine: 'Snake Venom Antiserum (Polyvalent)',
        stockOnHand: '8 vials',
        predictedBurnRate: '5.0 vials/day',
        daysToStockout: '1.6 days (CRITICAL RISK)',
        leadTimeAlert: '7 days advance warning triggered',
      },
    },
    {
      step: 2,
      title: 'Donor Screening & Constrained Optimization',
      icon: Compass,
      badge: 'OPTIMIZATION STAGE',
      color: 'border-indigo-900/60 bg-indigo-950/30 text-indigo-300',
      description:
        'The redistribution optimizer evaluates neighboring facilities. Devanahalli Taluk Hospital (32.4 km away) holds 140 vials. After keeping its mandatory 14-day safety reserve (56 vials), it holds a certified safe surplus of 84 vials. Expiry buffer is 320 days (exceeds required 90d).',
      telemetry: {
        donorFacility: 'Devanahalli Taluk Hospital',
        distance: '32.4 km (within 55km authorized radius)',
        donorSurplusBefore: '140 vials (35 days stock)',
        donorSurplusAfter: '80 vials (20 days stock > 14d mandatory rule)',
        transferQuantity: '60 vials (6 cartons of 10)',
        costScore: '18.4 (Optimal minimum cost)',
      },
    },
    {
      step: 3,
      title: 'Multi-Role Human-in-the-Loop Authorization',
      icon: UserCheck,
      badge: 'GOVERNANCE STAGE',
      color: 'border-indigo-900/60 bg-indigo-950/30 text-indigo-300',
      description:
        'Transfer recommendation TRF-HOS-DEV-MED01 is presented to the District Health Officer. The officer verifies cold-chain ILR readiness at both facilities and signs the authorization with clinical justification.',
      telemetry: {
        authorizedBy: 'Dr. Suresh Patil (District Health Officer, BLR Rural)',
        timestamp: '2026-09-29 08:35:12 IST',
        firestoreAuditId: 'audit_trf_hos_dev_01_signed',
        integrityHash: 'SHA256: 7f83b1a2...904b',
        status: 'AUTHORIZED & SEALED',
      },
    },
    {
      step: 4,
      title: 'Refrigerated Cold-Chain Dispatch (2°C–8°C)',
      icon: Truck,
      badge: 'LOGISTICS STAGE',
      color: 'border-amber-900/60 bg-amber-950/20 text-amber-300',
      description:
        'Stock is physically picked at Devanahalli depot. A calibrated IoT datalogger (LOG-2C-8C-KA991) is activated inside the passive vaccine carrier. Stock is deducted from Devanahalli and vehicle sets out on State Highway 104.',
      telemetry: {
        carrier: 'Karnataka State Health Express Van (KA-04-G-4819)',
        loggerId: 'LOG-2C-8C-KA991',
        temperatureSensor: '4.2°C (Intact within 2.0°C–8.0°C)',
        dispatchedAt: '09:15 IST',
        estimatedTravelTime: '48 mins (Google Maps Grounded)',
        chainOfCustody: 'ILR-to-ILR Active Logging',
      },
    },
    {
      step: 5,
      title: 'Intake Inspection & Stock Replenishment',
      icon: PackageCheck,
      badge: 'RECONCILIATION STAGE',
      color: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300',
      description:
        'Refrigerated van arrives at Hoskote CHC. Chief Pharmacist performs multimodal visual inspection and verifies temperature logs. 60 vials are confirmed and immediately merged into active dispensary stock, averting zero-inventory crisis.',
      telemetry: {
        receivedAt: '10:03 IST (48 min transit)',
        verifiedQuantity: '60 vials (0 breakages)',
        vvmInspection: 'Stage 1 Valid (Uncompromised)',
        newStockOnHand: '68 vials (13.6 days supply)',
        crisisOutcome: 'CRISIS AVERTED - 0 Patient Out-of-Stock Events',
      },
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left flex flex-col max-h-[92vh]">
        {/* Header with Switcher */}
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>End-to-End Operational Validation Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live verification of the complete supply-chain loop from ML prediction to pharmacy intake
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-indigo-950 bg-[#080c18] p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('stepper')}
                className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer ${
                  activeTab === 'stepper' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                5-Stage Crisis Lifecycle
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer ${
                  activeTab === 'comparison'
                    ? 'bg-[#121832] text-white border border-indigo-900/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                With vs Without AI
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeTab === 'stepper' ? (
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Step Indicator Progress Bar */}
            <div className="grid grid-cols-5 gap-2">
              {steps.map((s) => {
                const isCurrent = currentStep === s.step;
                const isPast = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`rounded-lg border p-2 text-left transition cursor-pointer ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-950/60 text-white'
                        : isPast
                        ? 'border-emerald-800/80 bg-emerald-950/20 text-slate-300'
                        : 'border-indigo-950/80 bg-[#080c18] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span>STEP 0{s.step}</span>
                      {isPast && <CheckCircle className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] font-semibold text-white block mt-1 truncate">
                      {s.title.split(' ')[0]} {s.title.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Step Spotlight Card */}
            <div className={`rounded-xl border p-5 ${currentStepData.color}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {currentStepData.badge}
                  </span>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <currentStepData.icon className="h-4 w-4" />
                    <span>{currentStepData.title}</span>
                  </h4>
                </div>
                <span className="rounded-md bg-[#080c18] px-2.5 py-0.5 font-mono text-xs font-bold text-white border border-indigo-950">
                  {currentStep} / 5
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-200 leading-relaxed">{currentStepData.description}</p>

              {/* Step Telemetry Breakdown */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(currentStepData.telemetry).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-[#080c18] border border-indigo-950 p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-semibold text-white text-[11px] mt-0.5 block">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="rounded-lg border border-indigo-950 bg-[#080c18] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#121832] transition cursor-pointer disabled:opacity-40"
              >
                &larr; Previous Stage
              </button>

              <div className="flex items-center gap-2">
                {currentStep < 5 ? (
                  <button
                    onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
                  >
                    <span>Advance Stage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onExecuteFullWorkflow?.();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Complete Full Workflow in Grid</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-Side Comparison Tab */
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            <div className="rounded-lg border border-indigo-950 bg-[#080c18] p-3.5">
              <h4 className="text-sm font-bold text-white mb-0.5">
                Controlled 30-Day Crisis Simulation: With vs. Without SwasthyaGrid AI
              </h4>
              <p className="text-xs text-slate-400">
                Evaluation across 14 health facilities subjected to identical post-monsoon surge and 7-day depot delivery delays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Without AI (Standard Siloed System) */}
              <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                  <span className="font-bold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Without SwasthyaGrid (Status Quo)</span>
                  </span>
                  <span className="font-mono text-[10px] text-rose-400 font-bold">SILOED SYSTEM</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Total Stockout Events:</span>
                    <span className="font-mono font-bold text-rose-300">48 events</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Cumulative Stockout Duration:</span>
                    <span className="font-mono font-bold text-rose-300">162 facility-days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Lead-Time Alert Warning:</span>
                    <span className="font-mono font-bold text-rose-300">1.8 days (Reactive)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Unmet Patient Medicine Demand:</span>
                    <span className="font-mono font-bold text-rose-300">4,120 units</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Expired Stock Wasted in Depots:</span>
                    <span className="font-mono font-bold text-rose-300">685 units</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Average Transfer Response Time:</span>
                    <span className="font-mono font-bold text-rose-300">7.2 days</span>
                  </div>
                </div>
              </div>

              {/* With SwasthyaGrid AI */}
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                  <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>With SwasthyaGrid AI (Connected Grid)</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">OPTIMIZED GRID</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Total Stockout Events:</span>
                    <span className="font-mono font-bold text-emerald-300">9 events (-81.3%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Cumulative Stockout Duration:</span>
                    <span className="font-mono font-bold text-emerald-300">27 facility-days (-83.3%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Lead-Time Alert Warning:</span>
                    <span className="font-mono font-bold text-emerald-300">6.8 days (Proactive)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Unmet Patient Medicine Demand:</span>
                    <span className="font-mono font-bold text-emerald-300">440 units (-89.3%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-950/60">
                    <span className="text-slate-400">Expired Stock Wasted in Depots:</span>
                    <span className="font-mono font-bold text-emerald-300">245 units (-64.2%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Average Transfer Response Time:</span>
                    <span className="font-mono font-bold text-emerald-300">4.5 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3.5 border-t border-indigo-950 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-indigo-950 bg-[#080c18] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121832] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
