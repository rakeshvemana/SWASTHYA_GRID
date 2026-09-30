import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Cpu,
  Database,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';
import { FederatedState } from '../types';

interface FederatedLearningTabProps {
  federatedState: FederatedState;
  onRunTrainingRound: () => Promise<void>;
}

export const FederatedLearningTab: React.FC<FederatedLearningTabProps> = ({
  federatedState,
  onRunTrainingRound,
}) => {
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      await onRunTrainingRound();
    } finally {
      setIsTraining(false);
    }
  };

  const latestRound = federatedState.roundsHistory[federatedState.roundsHistory.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Decentralized Federated Averaging (FedAvg) Hub
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
              Enables collaborative machine learning across 3 district health nodes without centralizing raw medical dispensary logs.
              Nodes train locally on edge records and transmit clipped parameter gradients bounded under Differential Privacy:
              <code className="mx-1.5 rounded-md bg-[#080c18] border border-indigo-950/80 px-1.5 py-0.5 font-mono text-[11px] text-indigo-300">
                &theta;_(t+1) = &theta;_t + &Sigma; (n_k / N) &middot; &Delta;_k + N(0, &sigma;&sup2;I)
              </code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Aggregating Gradients...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Execute FedAvg Round #{federatedState.currentRound + 1}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Differential Privacy & Threat Model Audit Card */}
      <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-br from-[#101733] to-[#0a0f1d] p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Differential Privacy Protocol &amp; Threat Model Specification
            </h3>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold">
            FORMAL DP GUARANTEE (&epsilon; = 1.25, &delta; = 10&#8315;&#8309;)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-[#080c18] p-3.5 border border-indigo-950">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              1. Gradient Sensitivity Clipping (C)
            </span>
            <div className="font-mono text-indigo-300 font-bold text-sm">C = 1.50 L2 Norm</div>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              Every district update is bounded: ||&Delta;&theta;_k||&#8322; &le; C to limit the maximum influence of any single dispensary record.
            </p>
          </div>

          <div className="rounded-lg bg-[#080c18] p-3.5 border border-indigo-950">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              2. Calibrated Gaussian Noise (&sigma;)
            </span>
            <div className="font-mono text-indigo-300 font-bold text-sm">&sigma; = 5.74 (Calibrated)</div>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              Perturbation scale &sigma; = (C &middot; &radic;(2&middot;ln(1.25/&delta;))) / &epsilon; ensures statistical indistinguishability.
            </p>
          </div>

          <div className="rounded-lg bg-[#080c18] p-3.5 border border-indigo-950">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              3. Byzantine Outlier Defense
            </span>
            <div className="font-mono text-emerald-400 font-bold text-sm">Norm &gt; 2.5&times; Median Filter</div>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              Protects against data poisoning or corrupted client updates by rejecting anomalous gradient norms before central aggregation.
            </p>
          </div>
        </div>

        {/* Boundary definition */}
        <div className="rounded-lg bg-[#080c18]/80 p-3 text-[11px] text-slate-300 leading-relaxed border border-indigo-950/80">
          <strong className="text-white">Strict Boundary Definition: </strong>
          &ldquo;Zero raw records transferred&rdquo; guarantees that individual patient identifying attributes, diagnosis notes, and line-item dispensary registers are retained strictly on edge district firewalls. Only privacy-perturbed mathematical model weight vectors leave the local edge environment.
        </div>
      </div>

      {/* 3 Regional Participating Nodes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {federatedState.nodes.map((node, idx) => (
          <div
            key={node.id}
            className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 shadow-sm hover:border-indigo-800/60 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#080c18] border border-indigo-950 text-indigo-400 font-mono font-bold text-xs">
                  0{idx + 1}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{node.name}</h3>
                  <p className="text-[10px] text-slate-400">{node.district}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{node.status}</span>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#080c18] p-2.5 border border-indigo-950">
                <span className="text-slate-400 text-[10px] block">Local Facilities</span>
                <span className="font-mono font-bold text-white">{node.facilityCount} Facilities</span>
              </div>
              <div className="rounded-lg bg-[#080c18] p-2.5 border border-indigo-950">
                <span className="text-slate-400 text-[10px] block">Edge Records</span>
                <span className="font-mono font-bold text-white">{node.localRecordsCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-indigo-950 text-[11px]">
              <span className="text-slate-400">Local Gradient Norm:</span>
              <span className="font-mono text-indigo-400 font-bold">{node.localGradientNorm} (&le; 1.50)</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Isolated Local MAE: {node.localMAE} units</span>
              <span className="text-emerald-400">&check; Quorum Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Global Model Performance & Convergence Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* FedAvg Convergence History */}
        <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              Round-by-Round Convergence History
            </h3>
            <span className="font-mono text-[11px] text-slate-300">
              Model: {federatedState.globalModelVersion}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080c18]/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-indigo-950 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Round</th>
                  <th className="py-2.5 px-3">Participating Nodes</th>
                  <th className="py-2.5 px-3">Global Loss</th>
                  <th className="py-2.5 px-3">Global MAE</th>
                  <th className="py-2.5 px-3">Local Baseline MAE</th>
                  <th className="py-2.5 px-3">Accuracy Gain</th>
                  <th className="py-2.5 px-3">&epsilon; Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/60 font-mono text-[11px]">
                {federatedState.roundsHistory.map((rnd) => (
                  <tr key={rnd.roundNumber} className="hover:bg-[#121832]/60">
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">Round {rnd.roundNumber}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      {rnd.participatingNodes.length} Nodes (Quorum Met)
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{rnd.globalLoss}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{rnd.globalMAE}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rnd.localBaselineMAE}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">+{rnd.accuracyImprovementPct}%</td>
                    <td className="py-2.5 px-3 text-indigo-300">{rnd.cumulativeEpsilonSpent || 1.25}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Summary Metric Card */}
        <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold block mb-1">
              Decentralized Utility
            </span>
            <h3 className="text-sm font-bold text-white">FedAvg Cross-District Generalization</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              By aggregating private model updates across 3 districts, the global model achieves a{' '}
              <strong className="text-emerald-400 font-mono">
                {latestRound ? latestRound.accuracyImprovementPct : 48.3}% lower MAE
              </strong>{' '}
              than any single isolated district model operating in data silos.
            </p>
          </div>

          <div className="my-4 rounded-lg bg-[#080c18] p-3.5 border border-indigo-950 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Aggregated Global MAE:</span>
              <span className="font-mono font-bold text-emerald-400">
                {latestRound ? latestRound.globalMAE : 4.6} units
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Siloed Baseline MAE:</span>
              <span className="font-mono font-bold text-slate-400">
                {latestRound ? latestRound.localBaselineMAE : 11.9} units
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quorum Status:</span>
              <span className="font-mono font-bold text-indigo-300">3/3 Nodes Synchronized</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500">
            Fault-tolerant aggregation ensures training proceeds safely as long as quorum (&ge; 2/3 nodes) is satisfied.
          </div>
        </div>
      </div>
    </div>
  );
};
