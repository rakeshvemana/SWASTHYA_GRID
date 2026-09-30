import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MapPin,
  PieChart,
  Settings,
  Sparkles,
  Truck,
  Users,
  Wifi,
} from 'lucide-react';

interface MedcareSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  criticalStockCount?: number;
  pendingTransfersCount?: number;
}

export const MedcareSidebar: React.FC<MedcareSidebarProps> = ({
  activeTab,
  onTabChange,
  criticalStockCount = 0,
  pendingTransfersCount = 0,
}) => {
  const mainMenu = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Layers,
      badge: criticalStockCount > 0 ? `${criticalStockCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'redistribution',
      label: 'Redistribution Map',
      icon: Truck,
      badge: pendingTransfersCount > 0 ? `${pendingTransfersCount}` : null,
      badgeColor: 'bg-amber-400 text-[#0c4339]',
    },
    { id: 'facilities', label: '786 Districts', icon: Users },
    { id: 'federated', label: 'Federated AI Hub', icon: Activity },
  ];

  const otherMenu = [
    { id: 'gemini', label: 'Clinical Assistant', icon: Sparkles },
    { id: 'impact', label: 'Impact & Reports', icon: FileText },
    { id: 'statistics', label: 'Analytics Grid', icon: PieChart },
    { id: 'help', label: 'Help & Protocol', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c4339] text-white flex flex-col shrink-0 min-h-screen select-none transition-all duration-200 z-40">
      {/* Brand Header */}
      <div className="p-6 pb-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-sm">
          <Activity className="h-5 w-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Medcare
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-700/50">
              India
            </span>
          </span>
          <p className="text-[11px] text-emerald-200/60 font-medium">National Health Grid</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto scrollbar-none">
        {/* Main Menu */}
        <div>
          <div className="px-3 mb-2.5">
            <span className="text-[10px] font-bold tracking-widest text-emerald-200/50 uppercase">
              Menu
            </span>
          </div>
          <nav className="space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0c4339] shadow-sm font-bold'
                      : 'text-emerald-100/75 hover:text-white hover:bg-emerald-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#0c4339]' : 'text-emerald-300/80'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        item.badgeColor || 'bg-emerald-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Other Menu */}
        <div>
          <div className="px-3 mb-2.5">
            <span className="text-[10px] font-bold tracking-widest text-emerald-200/50 uppercase">
              Other Menu
            </span>
          </div>
          <nav className="space-y-1">
            {otherMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0c4339] shadow-sm font-bold'
                      : 'text-emerald-100/75 hover:text-white hover:bg-emerald-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#0c4339]' : 'text-emerald-300/80'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom User / Node Indicator */}
      <div className="p-4 border-t border-emerald-900/60 bg-[#09352d]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
            786
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">All India Grid</div>
            <div className="text-[10px] text-emerald-300/70 truncate flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              36 States &amp; UTs Live
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
