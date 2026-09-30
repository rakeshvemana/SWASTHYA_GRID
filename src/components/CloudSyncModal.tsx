import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Database,
  Download,
  HardDrive,
  History,
  Layers,
  RefreshCw,
  RotateCcw,
  Shield,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { CloudBackupSnapshot } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  backups: CloudBackupSnapshot[];
  isOnline: boolean;
  syncLatencyMs: number;
  onCreateSnapshot: () => Promise<void>;
  onRestoreSnapshot: (snapshotId: string) => Promise<void>;
  currentRecordCount: number;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  backups,
  isOnline,
  syncLatencyMs,
  onCreateSnapshot,
  onRestoreSnapshot,
  currentRecordCount,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateSnapshot();
      setSuccessMessage('Cloud storage snapshot created successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    setIsRestoring(id);
    try {
      await onRestoreSnapshot(id);
      setSuccessMessage(`Restored operational state from snapshot ${id}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDownloadSnapshotJSON = (snap: CloudBackupSnapshot) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `SwasthyaGrid_CloudBackup_${snap.id}_${snap.hash}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-indigo-900/60 bg-[#0d1326] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 bg-[#080c18] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cloud Storage Checkpoint &amp; Sync Manager
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Low-latency state replication across decentralized district nodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-950/60 border border-emerald-700/60 p-3 text-emerald-300">
              <Check className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Sync Latency & Device Status Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Sync Latency</span>
                <Zap className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {syncLatencyMs} ms
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Round-Trip</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Low-latency live channel</span>
            </div>

            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Network Mode</span>
                <Wifi className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-semibold text-white text-base">
                  {isOnline ? 'Online Synced' : 'Offline Cache'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">PWA Service Worker Active</span>
            </div>

            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Live State Records</span>
                <Database className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-white">
                  {currentRecordCount}
                </span>
                <span className="text-[10px] text-slate-400">Entities</span>
              </div>
              <span className="text-[10px] text-slate-400">Facilities &middot; Stock &middot; Transfers</span>
            </div>
          </div>

          {/* Cloud Storage Snapshot Trigger */}
          <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-indigo-400" />
                Snapshot State to Google Cloud Storage
              </h4>
              <p className="mt-1 text-slate-400 text-xs">
                Creates an encrypted checkpoint containing facilities, stock burn rates, and pending transfer approvals.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCreating ? 'animate-spin' : ''}`} />
              <span>{isCreating ? 'Uploading Snapshot...' : 'Create Snapshot'}</span>
            </button>
          </div>

          {/* Backup Snapshots History List */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-slate-400" />
              Available Cloud Storage Snapshots ({backups.length})
            </h4>

            <div className="space-y-2.5">
              {backups.map((snap) => (
                <div
                  key={snap.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-indigo-950 bg-[#080c18] p-3.5 hover:border-indigo-800 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{snap.id}</span>
                      <span className="font-mono text-[10px] text-indigo-300">
                        {snap.hash}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                        {snap.status}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {new Date(snap.timestamp).toLocaleString()} &middot; {snap.recordCount} records &middot; {snap.sizeKb} KB &middot; Origin: {snap.deviceOrigin}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDownloadSnapshotJSON(snap)}
                      className="rounded-lg border border-indigo-950 bg-[#0d1326] px-2.5 py-1.5 text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      title="Download cold storage JSON file"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => handleRestore(snap.id)}
                      disabled={isRestoring === snap.id}
                      className="rounded-lg bg-indigo-950/70 border border-indigo-900/60 hover:bg-indigo-900/60 px-3 py-1.5 font-medium text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3 text-indigo-400" />
                      <span>{isRestoring === snap.id ? 'Restoring...' : 'Restore'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-indigo-950 bg-[#080c18] px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>Automatic local fallback via IndexedDB / Web Storage</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-indigo-950 bg-[#0d1326] px-3.5 py-1.5 font-medium text-slate-200 hover:bg-[#121832] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
