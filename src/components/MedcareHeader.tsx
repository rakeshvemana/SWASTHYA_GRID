import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Cloud,
  Eye,
  Globe,
  LogIn,
  LogOut,
  Mic,
  Plus,
  Radio,
  Search,
  Shield,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { LanguageCode, UserRole } from '../types';

interface MedcareHeaderProps {
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
  onOpenCrisisStepper?: () => void;
  onSearch?: (query: string) => void;
}

export const MedcareHeader: React.FC<MedcareHeaderProps> = ({
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
  onOpenCrisisStepper,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'STATE_ADMIN':
        return 'State Health Director';
      case 'DISTRICT_COORDINATOR':
        return 'District Nodal Officer';
      case 'PHC_MEDICAL_OFFICER':
        return 'PHC Medical Officer';
      default:
        return 'Health Officer';
    }
  };

  return (
    <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Search Input matching Medcare design */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search here... (District, Hospital, NLEM Drug)"
            className="w-full bg-[#f8faf9] hover:bg-[#f1f5f3] focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Action Controls & User Section */}
      <div className="flex items-center gap-3">
        {/* Quick Crisis Simulation Action */}
        {onOpenCrisisStepper && (
          <button
            onClick={onOpenCrisisStepper}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer"
          >
            <span>Simulate Crisis</span>
          </button>
        )}

        {/* Primary Action Button: + Add Emergency Transfer / Patient */}
        <button
          onClick={onOpenCrisisStepper || onOpenLiveVoice}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c4339] hover:bg-[#09352d] text-white text-xs font-semibold shadow-sm transition cursor-pointer active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>+ Add transfer</span>
        </button>

        {/* AI Multimodal Tools Menu */}
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">AI Tools</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isToolsOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs text-slate-700 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Multimodal Assistance
              </div>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenLiveVoice();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition text-left cursor-pointer"
              >
                <Radio className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-semibold">Live Voice Agent</div>
                  <div className="text-[10px] text-slate-400">Bidirectional conversational dispatch</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenVision();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition text-left cursor-pointer"
              >
                <Eye className="h-4 w-4 text-cyan-600" />
                <div>
                  <div className="font-semibold">Vision Label Inspector</div>
                  <div className="text-[10px] text-slate-400">Scan vial barcodes &amp; expiry</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenSearchGrounding();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition text-left cursor-pointer"
              >
                <Search className="h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-semibold">MoHFW Search Grounding</div>
                  <div className="text-[10px] text-slate-400">Official live medical guidelines</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenMapsGrounding();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition text-left cursor-pointer"
              >
                <Globe className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-semibold">Google Maps Geo-Locator</div>
                  <div className="text-[10px] text-slate-400">Real facility routing &amp; distance</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenTechStack();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition text-left cursor-pointer"
              >
                <Shield className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-semibold">Architecture &amp; Docs</div>
                  <div className="text-[10px] text-slate-400">Tech stack &amp; mathematical models</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell with red dot */}
        <button
          onClick={onOpenCloudSync}
          className="relative h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          title="Notifications & Cloud Sync"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* User Profile Avatar with Role Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/20 shadow-sm overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>SS</span>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 text-xs text-slate-700 space-y-2">
              <div className="pb-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">
                  {user?.displayName || 'Dr. Sourav Sharma'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'sourav.sharma@health.gov.in'}
                </div>
                <div className="mt-1 inline-block rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
                  {getRoleDisplayName(currentRole)}
                </div>
              </div>

              {/* Role Switcher */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Switch Operational Role
                </span>
                <div className="space-y-1">
                  {(['STATE_ADMIN', 'DISTRICT_COORDINATOR', 'PHC_MEDICAL_OFFICER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleChange(r);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        currentRole === r
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {getRoleDisplayName(r)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth actions */}
              <div className="pt-2 border-t border-slate-100">
                {user ? (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLogin();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-xs font-semibold cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
