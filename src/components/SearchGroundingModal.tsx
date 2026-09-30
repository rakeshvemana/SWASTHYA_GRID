import React, { useState } from 'react';
import { ExternalLink, Globe, RefreshCw, Search, Sparkles, X } from 'lucide-react';

interface SearchGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchGroundingModal: React.FC<SearchGroundingModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState(
    'Karnataka health department dengue malaria outbreak advisories and essential drug protocol'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute search grounding.');
      setResultText(data.text);
      setGroundingChunks(data.groundingChunks || []);
      setSearchQueries(data.webSearchQueries || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Search grounding error.');
    } finally {
      setIsLoading(false);
    }
  };

  const presetQueries = [
    'Karnataka health department dengue outbreak advisories 2026',
    'National List of Essential Medicines India snake venom antiserum guidelines',
    'WHO cholera oral rehydration salts emergency distribution protocols',
    'Karnataka medical services corporation drug procurement lead times',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Google Search Grounding</h3>
              <p className="text-[11px] text-indigo-300 font-mono">Model: gemini-3.5-flash with googleSearch tool</p>
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
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search real-time disease outbreaks, advisories, drug protocols..."
                className="w-full rounded-lg border border-indigo-950 bg-[#080c18] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Grounding...' : 'Search'}</span>
            </button>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                }}
                className="rounded-md border border-indigo-950 bg-[#080c18] px-2.5 py-1 text-slate-400 hover:border-indigo-800 hover:text-white transition cursor-pointer truncate max-w-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results & Web Sources */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {resultText && (
            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Grounded Healthcare Intelligence:</span>
              </div>
              {resultText}
            </div>
          )}

          {groundingChunks && groundingChunks.length > 0 && (
            <div className="rounded-xl border border-indigo-950 bg-[#080c18] p-3.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Verified Web Citations &amp; Sources:
              </h4>
              <div className="space-y-1.5">
                {groundingChunks.map((chunk, idx) => {
                  const web = chunk.web;
                  if (!web) return null;
                  return (
                    <a
                      key={idx}
                      href={web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-indigo-950/80 bg-[#0d1326] p-2 text-xs text-slate-300 hover:border-indigo-700 hover:text-white transition"
                    >
                      <span className="truncate pr-2 font-medium">{web.title || web.uri}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400" />
                    </a>
                  );
                })}
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
