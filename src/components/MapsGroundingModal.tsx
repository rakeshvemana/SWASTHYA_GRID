import React, { useState } from 'react';
import { Compass, ExternalLink, MapPin, Navigation, RefreshCw, X } from 'lucide-react';

interface MapsGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapsGroundingModal: React.FC<MapsGroundingModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState(
    'Find driving route, road distance, and travel time from Devanahalli Taluk Hospital to Hoskote Community Health Centre in Karnataka, India'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchMaps = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve Maps grounding.');
      setResultText(data.text);
      setGroundingChunks(data.groundingChunks || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Maps grounding error.');
    } finally {
      setIsLoading(false);
    }
  };

  const presetRoutes = [
    'Route from Devanahalli Taluk Hospital to Hoskote Community Health Centre',
    'Route from Ramanagara District Hospital to Channapatna Taluk Hospital',
    'Route from Tumakuru District Hospital to Kunigal Taluk Hospital',
    'Emergency route from Nelamangala General Hospital to Vijayapura PHC',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Google Maps Grounding</h3>
              <p className="text-[11px] text-indigo-300 font-mono">Model: gemini-3.5-flash with googleMaps tool</p>
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

        <div className="my-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Navigation className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Query real-time transfer routes, hospital locations, road transit times..."
                className="w-full rounded-lg border border-indigo-950 bg-[#080c18] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleFetchMaps}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Routing...' : 'Route Map'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {presetRoutes.map((r, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(`Find driving route, road distance, and travel time for: ${r} in Karnataka, India`)}
                className="rounded-md border border-indigo-950 bg-[#080c18] px-2.5 py-1 text-slate-400 hover:border-indigo-800 hover:text-white transition cursor-pointer truncate max-w-xs"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {resultText && (
            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Grounded Transit &amp; Route Report:</span>
              </div>
              {resultText}
            </div>
          )}

          {groundingChunks && groundingChunks.length > 0 && (
            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-3.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Maps Place Entities &amp; Coordinates:
              </h4>
              <div className="space-y-1.5 text-xs text-slate-400">
                {groundingChunks.map((chunk, idx) => (
                  <div key={idx} className="rounded-lg bg-[#0d1326] p-2.5 border border-indigo-950/80">
                    {JSON.stringify(chunk)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3.5 border-t border-indigo-950 flex justify-end">
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
