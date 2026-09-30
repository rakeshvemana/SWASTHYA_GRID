import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  ChevronDown,
  Cloud,
  Compass,
  Database,
  Eye,
  Globe,
  LogIn,
  LogOut,
  Mic,
  Radio,
  Search,
  Shield,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { LanguageCode, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isOnline: boolean;
  syncLatencyMs: number;
  onOpenCloudSync: () => void;
  lastSyncedTime: string;
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenLiveVoice: () => void;
  onOpenSearchGrounding: () => void;
  onOpenMapsGrounding: () => void;
  onOpenAudioTranscribe: () => void;
  onOpenVision: () => void;
  onOpenTechStack: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentLanguage,
  onLanguageChange,
  isOnline,
  syncLatencyMs,
  onOpenCloudSync,
  lastSyncedTime,
  user,
  onLogin,
  onLogout,
  onOpenLiveVoice,
  onOpenSearchGrounding,
  onOpenMapsGrounding,
  onOpenAudioTranscribe,
  onOpenVision,
  onOpenTechStack,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-950/70 bg-[#070a13]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-gradient-to-b from-indigo-500/20 via-indigo-950/40 to-slate-950 text-indigo-400 shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Swasthya<span className="text-indigo-400">Grid</span>
              </span>
              <span className="text-slate-600 font-light">/</span>
              <span className="text-xs font-medium text-slate-300 hidden md:inline">
                National Health Resource Command
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium ml-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span className="hidden sm:inline">Pan-India Grid &middot; 780+ Districts</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block tracking-normal">
              Autonomous Shortage Prediction &amp; Multi-Constraint Redistribution Platform
            </p>
          </div>
        </div>

        {/* Center / Right Suite: Clinical AI Tools Dropdown + Quick Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clinical AI Suite Menu Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-900/50 bg-[#0d1326]/90 hover:bg-[#121a36] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white transition cursor-pointer"
              title="Access Google Gemini Multimodal AI Tools"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Clinical AI Suite</span>
              <span className="sm:hidden">AI Tools</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 rounded-xl border border-indigo-900/60 bg-[#0a0f1f] p-2 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-indigo-950/80">
                  Multimodal Operational Tools
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenLiveVoice();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-indigo-950/90 text-indigo-400 border border-indigo-800/50 mt-0.5">
                      <Radio className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Live Voice Dispatcher</div>
                      <div className="text-[11px] text-slate-400">Bidirectional voice triage with Gemini 2.5 Live</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenVision();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/50 mt-0.5">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Vision OCR &amp; VVM Inspection</div>
                      <div className="text-[11px] text-slate-400">Vial label intake &amp; vaccine cold-chain verification</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenSearchGrounding();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/50 mt-0.5">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Google Search Grounding</div>
                      <div className="text-[11px] text-slate-400">Real-time epidemiological telemetry &amp; outbreaks</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenMapsGrounding();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mt-0.5">
                      <Compass className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Google Maps Grounding</div>
                      <div className="text-[11px] text-slate-400">District road network &amp; live ambulance routing</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenAudioTranscribe();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-teal-950/80 text-teal-400 border border-teal-800/50 mt-0.5">
                      <Mic className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Clinical Audio Transcriber</div>
                      <div className="text-[11px] text-slate-400">Hands-free doctor voice prescription logging</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenTechStack();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-indigo-950/50 transition cursor-pointer border-t border-indigo-950/80 pt-2"
                  >
                    <div className="p-1.5 rounded-md bg-purple-950/80 text-purple-400 border border-purple-800/50 mt-0.5">
                      <Database className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Architecture &amp; Tech Matrix</div>
                      <div className="text-[11px] text-slate-400">Full tech stack, endpoints, and data specs</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Action: Live Voice Shortcut */}
          <button
            onClick={onOpenLiveVoice}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-indigo-950 bg-[#0d1326]/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-indigo-800/60 transition cursor-pointer"
            title="Launch Real-time Voice Dispatcher"
          >
            <Radio className="h-3 w-3 text-indigo-400" />
            <span>Voice Dispatch</span>
          </button>

          {/* Cloud Storage & Sync Status */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-950 bg-[#0d1326]/60 hover:bg-[#121a36] px-3 py-1.5 text-xs text-slate-300 transition cursor-pointer"
            title="Open Cloud Storage Backup & Latency Monitor"
          >
            <Cloud className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline font-mono text-[11px] text-slate-300">
              {isOnline ? `${syncLatencyMs}ms` : 'Offline'}
            </span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center rounded-lg border border-indigo-950 bg-[#0d1326]/60 px-2 py-1 text-xs">
            <Shield className="h-3.5 w-3.5 text-slate-400 mr-1.5 hidden sm:inline" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              title="Switch Administrative Level"
            >
              <option value="STATE_ADMIN" className="bg-[#0b1020] text-slate-200">
                State Director
              </option>
              <option value="DISTRICT_COORDINATOR" className="bg-[#0b1020] text-slate-200">
                District Officer
              </option>
              <option value="PHC_MEDICAL_OFFICER" className="bg-[#0b1020] text-slate-200">
                PHC Medical Officer
              </option>
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-indigo-950 bg-[#0d1326]/60 px-2 py-1 text-xs">
            <Globe className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:inline" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              title="Interface Language"
            >
              <option value="en" className="bg-[#0b1020] text-slate-200">EN</option>
              <option value="hi" className="bg-[#0b1020] text-slate-200">हिंदी</option>
              <option value="kn" className="bg-[#0b1020] text-slate-200">ಕನ್ನಡ</option>
            </select>
          </div>

          {/* Authentication Status */}
          {user ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-950 bg-[#0d1326]/60 p-1 text-xs">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-700 text-[10px] font-bold text-white">
                  {user.displayName ? user.displayName[0] : 'U'}
                </div>
              )}
              <span className="hidden xl:inline text-[11px] font-medium text-slate-300 max-w-[80px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition p-0.5 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-800/80 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
              title="Sign in with Google Account"
            >
              <LogIn className="h-3.5 w-3.5 text-white" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
