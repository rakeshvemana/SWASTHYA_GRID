import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running in standalone mode, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition border border-emerald-500/50 cursor-pointer"
        title="Install SwasthyaGrid AI as a native desktop/mobile application"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700/80 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" /> Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> icon in the Safari navigation bar.<br />
                2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.<br />
                3. Launch SwasthyaGrid AI with full offline local storage and sync capability.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-cyan-600 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
